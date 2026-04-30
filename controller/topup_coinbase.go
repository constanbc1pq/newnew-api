package controller

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	svc "github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/system_setting"
	"github.com/gin-gonic/gin"
	"github.com/thanhpk/randstr"
)

const PaymentMethodCoinbase = "coinbase"

const coinbaseAPIBase = "https://api.commerce.coinbase.com"

type CoinbasePayRequest struct {
	Amount int64 `json:"amount"`
}

type coinbaseChargeRequest struct {
	Name        string            `json:"name"`
	Description string            `json:"description"`
	LocalPrice  coinbasePrice     `json:"local_price"`
	PricingType string            `json:"pricing_type"`
	Metadata    map[string]string `json:"metadata"`
	RedirectURL string            `json:"redirect_url"`
	CancelURL   string            `json:"cancel_url"`
}

type coinbasePrice struct {
	Amount   string `json:"amount"`
	Currency string `json:"currency"`
}

type coinbaseChargeResponse struct {
	Data struct {
		Code      string `json:"code"`
		HostedURL string `json:"hosted_url"`
	} `json:"data"`
}

type coinbaseWebhookEvent struct {
	Event struct {
		Type string `json:"type"`
		Data struct {
			Code     string            `json:"code"`
			Metadata map[string]string `json:"metadata"`
			Timeline []struct {
				Status string `json:"status"`
			} `json:"timeline"`
		} `json:"data"`
	} `json:"event"`
}

func RequestCoinbasePay(c *gin.Context) {
	if setting.CoinbaseAPIKey == "" {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "Coinbase Commerce 未配置"})
		return
	}

	var req CoinbasePayRequest
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

	// Unified pricing: live FX rates + spread + new-user promo
	quote := svc.QuoteForUser(userID, req.Amount, user.Group)
	amountUSD := quote.FinalAmountUSD
	quotaAmount := quote.QuotaAmount

	tradeRef := fmt.Sprintf("new-api-cb-%d-%d-%s", userID, time.Now().UnixMilli(), randstr.String(4))
	tradeNo := "cb_" + common.Sha1([]byte(tradeRef))

	serverAddr := system_setting.ServerAddress
	payURL, err := createCoinbaseCharge(tradeNo, amountUSD, serverAddr)
	if err != nil {
		log.Printf("Coinbase charge creation failed: %v", err)
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "拉起支付失败"})
		return
	}

	topUp := &model.TopUp{
		UserId:        userID,
		Amount:        quotaAmount,
		Money:         amountUSD,
		TradeNo:       tradeNo,
		PaymentMethod: PaymentMethodCoinbase,
		CreateTime:    time.Now().Unix(),
		Status:        common.TopUpStatusPending,
	}
	if err := topUp.Insert(); err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "创建订单失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "success",
		"data":    gin.H{"pay_link": payURL},
	})
}

func CoinbaseWebhook(c *gin.Context) {
	payload, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.AbortWithStatus(http.StatusServiceUnavailable)
		return
	}

	sig := c.GetHeader("X-CC-Webhook-Signature")
	if !verifyCoinbaseSignature(payload, sig, setting.CoinbaseWebhookSecret) {
		log.Printf("Coinbase webhook signature verification failed")
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	var event coinbaseWebhookEvent
	if err := json.Unmarshal(payload, &event); err != nil {
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	switch event.Event.Type {
	case "charge:confirmed", "charge:resolved":
		handleCoinbaseCharge(event)
	default:
		// Other event types (charge:created, charge:pending, charge:failed) - no action needed
	}

	c.Status(http.StatusOK)
}

func handleCoinbaseCharge(event coinbaseWebhookEvent) {
	tradeNo := event.Event.Data.Metadata["trade_no"]
	if tradeNo == "" {
		log.Printf("Coinbase webhook: missing trade_no in metadata")
		return
	}

	LockOrder(tradeNo)
	defer UnlockOrder(tradeNo)

	if err := model.RechargeCrypto(tradeNo, PaymentMethodCoinbase); err != nil {
		log.Printf("Coinbase recharge failed for %s: %v", tradeNo, err)
	}
}

func createCoinbaseCharge(tradeNo string, amountUSD float64, serverAddr string) (string, error) {
	body := coinbaseChargeRequest{
		Name:        "Market Router Credits",
		Description: fmt.Sprintf("充值 %.2f USD", amountUSD),
		LocalPrice:  coinbasePrice{Amount: fmt.Sprintf("%.2f", amountUSD), Currency: "USD"},
		PricingType: "fixed_price",
		Metadata:    map[string]string{"trade_no": tradeNo},
		RedirectURL: serverAddr + "/console/topup?pay=success",
		CancelURL:   serverAddr + "/console/topup?pay=cancel",
	}

	bodyBytes, err := json.Marshal(body)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest(http.MethodPost, coinbaseAPIBase+"/charges", bytes.NewReader(bodyBytes))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-CC-Api-Key", setting.CoinbaseAPIKey)
	req.Header.Set("X-CC-Version", "2018-03-22")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		b, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("coinbase API error %d: %s", resp.StatusCode, string(b))
	}

	var result coinbaseChargeResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	return result.Data.HostedURL, nil
}

func verifyCoinbaseSignature(payload []byte, sig string, secret string) bool {
	if secret == "" || sig == "" {
		return false
	}
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(payload)
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(sig))
}

func calcCoinbaseUSD(quotaAmount int64, group string) float64 {
	// Convert quota units to USD using the same logic as Stripe
	amount := float64(quotaAmount)
	if operation_setting.GetQuotaDisplayType() == operation_setting.QuotaDisplayTypeTokens {
		amount = amount / common.QuotaPerUnit
	}
	topupGroupRatio := common.GetTopupGroupRatio(group)
	if topupGroupRatio == 0 {
		topupGroupRatio = 1
	}
	// Use Stripe unit price as the base USD rate (shared config)
	return amount * setting.StripeUnitPrice * topupGroupRatio
}
