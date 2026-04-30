package service

import (
	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/relay/payment"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/operation_setting"
)

// PriceQuote is the result of a price calculation for a given quota amount.
type PriceQuote struct {
	QuotaAmount    int64              `json:"quota_amount"`    // tokens the user receives
	AmountUSD      float64            `json:"amount_usd"`      // USD charge (before promo)
	FinalAmountUSD float64            `json:"final_amount_usd"` // USD after promo
	LocalPrices    map[string]float64 `json:"local_prices"`    // currency → amount
	IsNewUserPromo bool               `json:"is_new_user_promo"`
	PromoSaving    float64            `json:"promo_saving_usd"` // USD saved via promo
}

// QuoteForUser calculates what a user pays and receives for a given quota amount,
// applying group ratio, new-user promo, and live FX rates.
//
// quotaUnits: the raw quota units the user wants (before promo).
func QuoteForUser(userID int, quotaUnits int64, group string) PriceQuote {
	cfg := setting.GetPricingConfig()
	pmtCfg := operation_setting.GetPaymentSetting()

	// Base USD price for the requested quota (no promo, no group ratio)
	baseUSDPerUnit := cfg.BasePriceUSDPerUnit
	if baseUSDPerUnit <= 0 {
		baseUSDPerUnit = 0.000002 // fallback: $2 per 1M tokens
	}

	groupRatio := common.GetTopupGroupRatio(group)
	if groupRatio == 0 {
		groupRatio = 1
	}

	// USD amount before promo
	amountUSD := float64(quotaUnits) * baseUSDPerUnit * groupRatio

	// New-user promo multiplier
	promoMult := float64(1)
	isPromo := false
	if pmtCfg.NewUserPromoEnabled && !model.HasCompletedTopup(userID) {
		limit := pmtCfg.NewUserPromoLimitUSD
		mult := pmtCfg.NewUserPromoMultiplier
		if limit > 0 && mult > 1 {
			isPromo = true
			if amountUSD <= limit {
				promoMult = mult
			} else {
				promoMult = (limit*mult + (amountUSD - limit)) / amountUSD
			}
		}
	}

	// Promo reduces the effective price (user pays less USD for same quota)
	finalUSD := amountUSD / promoMult
	saving := amountUSD - finalUSD

	// Apply promo to quota via CalcTopupQuota
	finalQuota := payment.CalcTopupQuota(userID, finalUSD, common.QuotaPerUnit, groupRatio)

	// Build local currency prices using spread-adjusted FX rates
	localPrices := map[string]float64{}
	for _, cur := range cfg.DisplayCurrencies {
		localPrices[cur] = USDToLocal(finalUSD, cur)
	}

	return PriceQuote{
		QuotaAmount:    finalQuota,
		AmountUSD:      amountUSD,
		FinalAmountUSD: finalUSD,
		LocalPrices:    localPrices,
		IsNewUserPromo: isPromo,
		PromoSaving:    saving,
	}
}

// QuoteForUSD calculates how much quota a user gets for a given USD payment.
// This is the inverse: user says "I want to pay $10" → how many tokens?
func QuoteForUSD(userID int, amountUSD float64, group string) int64 {
	cfg := setting.GetPricingConfig()
	baseUSDPerUnit := cfg.BasePriceUSDPerUnit
	if baseUSDPerUnit <= 0 {
		baseUSDPerUnit = 0.000002
	}
	groupRatio := common.GetTopupGroupRatio(group)
	if groupRatio == 0 {
		groupRatio = 1
	}
	return payment.CalcTopupQuota(userID, amountUSD, common.QuotaPerUnit, groupRatio)
}
