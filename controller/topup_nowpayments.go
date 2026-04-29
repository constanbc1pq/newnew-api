package controller

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha512"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/relay/payment"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/QuantumNous/new-api/setting/system_setting"
	"github.com/gin-gonic/gin"
	"github.com/thanhpk/randstr"
)

const PaymentMethodNowPayments = "nowpayments"

const nowpaymentsAPIBase = "https://api.nowpayments.io/v1"

type NowPaymentsPayRequest struct {
	Amount int64 `json:"amount"`
}

type nowpaymentsInvoiceRequest struct {
	PriceAmount      float64 `json:"price_amount"`
	PriceCurrency    string  `json:"price_currency"`
	OrderID          string  `json:"order_id"`
	OrderDescription string  `json:"order_description"`
	SuccessURL       string  `json:"success_url"`
	CancelURL        string  `json:"cancel_url"`
}

type nowpaymentsInvoiceResponse struct {
	ID         string `json:"id"`
	InvoiceURL string `json:"invoice_url"`
}

type nowpaymentsIPNPayload struct {
	PaymentID     int64   `json:"payment_id"`
	PaymentStatus string  `json:"payment_status"`
	OrderID       string  `json:"order_id"`
	PriceAmount   float64 `json:"price_amount"`
	PriceCurrency string  `json:"price_currency"`
}

func RequestNowPaymentsPay(c *gin.Context) {
	if setting.NowPaymentsAPIKey == "" {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "NowPayments 未配置"})
		return
	}

	var req NowPaymentsPayRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "参数错误"})
		return
	}

	if req.Amount <= 0 {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "充值数量无效"})
		return
	}

	userID := c.GetInt("id")
	user, err := model.GetUserById(userID, false)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "获取用户信息失败"})
		return
	}

	amountUSD := calcNowPaymentsUSD(req.Amount, user.Group)
	quotaPerUnit := common.QuotaPerUnit
	groupRatio := common.GetTopupGroupRatio(user.Group)
	if groupRatio == 0 {
		groupRatio = 1
	}
	quotaAmount := payment.CalcTopupQuota(userID, amountUSD, quotaPerUnit, groupRatio)

	tradeRef := fmt.Sprintf("new-api-np-%d-%d-%s", userID, time.Now().UnixMilli(), randstr.String(4))
	tradeNo := "np_" + common.Sha1([]byte(tradeRef))

	serverAddr := system_setting.ServerAddress
	invoiceURL, err := createNowPaymentsInvoice(tradeNo, amountUSD, serverAddr)
	if err != nil {
		log.Printf("NowPayments invoice creation failed: %v", err)
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "拉起支付失败"})
		return
	}

	topUp := &model.TopUp{
		UserId:        userID,
		Amount:        quotaAmount,
		Money:         amountUSD,
		TradeNo:       tradeNo,
		PaymentMethod: PaymentMethodNowPayments,
		CreateTime:    time.Now().Unix(),
		Status:        common.TopUpStatusPending,
	}
	if err := topUp.Insert(); err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "创建订单失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "success",
		"data":    gin.H{"pay_link": invoiceURL},
	})
}

func NowPaymentsWebhook(c *gin.Context) {
	payload, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.AbortWithStatus(http.StatusServiceUnavailable)
		return
	}

	sig := c.GetHeader("x-nowpayments-sig")
	if !verifyNowPaymentsSignature(payload, sig, setting.NowPaymentsIPNSecret) {
		log.Printf("NowPayments IPN signature verification failed")
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	var ipn nowpaymentsIPNPayload
	if err := json.Unmarshal(payload, &ipn); err != nil {
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	// NowPayments statuses that mean payment is complete
	if ipn.PaymentStatus == "finished" || ipn.PaymentStatus == "confirmed" {
		handleNowPaymentsIPN(ipn)
	}

	c.Status(http.StatusOK)
}

func handleNowPaymentsIPN(ipn nowpaymentsIPNPayload) {
	tradeNo := ipn.OrderID
	if tradeNo == "" {
		log.Printf("NowPayments IPN: missing order_id")
		return
	}

	LockOrder(tradeNo)
	defer UnlockOrder(tradeNo)

	if err := model.RechargeCrypto(tradeNo, PaymentMethodNowPayments); err != nil {
		log.Printf("NowPayments recharge failed for %s: %v", tradeNo, err)
	}
}

func createNowPaymentsInvoice(tradeNo string, amountUSD float64, serverAddr string) (string, error) {
	body := nowpaymentsInvoiceRequest{
		PriceAmount:      amountUSD,
		PriceCurrency:    "USD",
		OrderID:          tradeNo,
		OrderDescription: fmt.Sprintf("Market Router Credits %.2f USD", amountUSD),
		SuccessURL:       serverAddr + "/console/topup?pay=success",
		CancelURL:        serverAddr + "/console/topup?pay=cancel",
	}

	bodyBytes, err := json.Marshal(body)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest(http.MethodPost, nowpaymentsAPIBase+"/invoice", bytes.NewReader(bodyBytes))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", setting.NowPaymentsAPIKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		b, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("nowpayments API error %d: %s", resp.StatusCode, string(b))
	}

	var result nowpaymentsInvoiceResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	return result.InvoiceURL, nil
}

// verifyNowPaymentsSignature verifies the IPN payload using HMAC-SHA512.
// NowPayments signs a sorted JSON representation of the payload.
func verifyNowPaymentsSignature(payload []byte, sig string, secret string) bool {
	if secret == "" || sig == "" {
		return false
	}

	// NowPayments signs the sorted JSON keys representation
	var data map[string]interface{}
	if err := json.Unmarshal(payload, &data); err != nil {
		return false
	}
	sortedJSON := sortedJSONString(data)

	mac := hmac.New(sha512.New, []byte(secret))
	mac.Write([]byte(sortedJSON))
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(strings.ToLower(sig)))
}

// sortedJSONString produces a JSON string with keys sorted alphabetically,
// matching NowPayments' signature scheme.
func sortedJSONString(data map[string]interface{}) string {
	keys := make([]string, 0, len(data))
	for k := range data {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	var sb strings.Builder
	sb.WriteString("{")
	for i, k := range keys {
		if i > 0 {
			sb.WriteString(",")
		}
		keyJSON, _ := json.Marshal(k)
		valJSON, _ := json.Marshal(data[k])
		sb.Write(keyJSON)
		sb.WriteString(":")
		sb.Write(valJSON)
	}
	sb.WriteString("}")
	return sb.String()
}

func calcNowPaymentsUSD(quotaAmount int64, group string) float64 {
	amount := float64(quotaAmount)
	if operation_setting.GetQuotaDisplayType() == operation_setting.QuotaDisplayTypeTokens {
		amount = amount / common.QuotaPerUnit
	}
	topupGroupRatio := common.GetTopupGroupRatio(group)
	if topupGroupRatio == 0 {
		topupGroupRatio = 1
	}
	return amount * setting.StripeUnitPrice * topupGroupRatio
}
