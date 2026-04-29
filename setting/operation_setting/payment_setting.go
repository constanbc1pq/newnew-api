package operation_setting

import "github.com/QuantumNous/new-api/setting/config"

type PaymentSetting struct {
	AmountOptions  []int           `json:"amount_options"`
	AmountDiscount map[int]float64 `json:"amount_discount"` // 充值金额对应的折扣，例如 100 元 0.9 表示 100 元充值享受 9 折优惠

	// New-user first-topup promo: applies a multiplier to quota for the first N USD charged.
	// Example defaults: first $10 at 2× quota (= 50% off effective price).
	NewUserPromoEnabled    bool    `json:"new_user_promo_enabled"`
	NewUserPromoLimitUSD   float64 `json:"new_user_promo_limit_usd"`   // amount subject to promo (default 10)
	NewUserPromoMultiplier float64 `json:"new_user_promo_multiplier"`  // quota multiplier for promo portion (default 2.0)
}

// 默认配置
var paymentSetting = PaymentSetting{
	AmountOptions:          []int{10, 20, 50, 100, 200, 500},
	AmountDiscount:         map[int]float64{},
	NewUserPromoEnabled:    true,
	NewUserPromoLimitUSD:   10.0,
	NewUserPromoMultiplier: 2.0,
}

func init() {
	// 注册到全局配置管理器
	config.GlobalConfig.Register("payment_setting", &paymentSetting)
}

func GetPaymentSetting() *PaymentSetting {
	return &paymentSetting
}
