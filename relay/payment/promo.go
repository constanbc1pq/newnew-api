package payment

import (
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting/operation_setting"
)

// CalcTopupQuota converts a USD amount to quota units, applying:
//  1. New-user first-topup promo multiplier
//  2. Volume discount bonus (AmountDiscount config: amount→bonus multiplier)
//
// Formula: quota = amountUSD × QuotaPerUnit × groupRatio × promoMult × volumeMult
func CalcTopupQuota(userID int, amountUSD float64, quotaPerUnit float64, groupRatio float64) int64 {
	promoMult := newUserPromoMultiplier(userID, amountUSD)
	volumeMult := volumeDiscountMultiplier(amountUSD)
	return int64(amountUSD * quotaPerUnit * groupRatio * promoMult * volumeMult)
}

// volumeDiscountMultiplier returns the quota bonus multiplier for a given USD amount.
// Uses AmountDiscount setting: e.g. {20: 1.05, 100: 1.10, 200: 1.20}
// Picks the largest threshold ≤ amountUSD.
func volumeDiscountMultiplier(amountUSD float64) float64 {
	s := operation_setting.GetPaymentSetting()
	if len(s.AmountDiscount) == 0 {
		return 1.0
	}
	best := 1.0
	bestThreshold := -1
	for threshold, mult := range s.AmountDiscount {
		if float64(threshold) <= amountUSD && threshold > bestThreshold {
			bestThreshold = threshold
			best = mult
		}
	}
	return best
}

// newUserPromoMultiplier returns the effective quota multiplier for amountUSD.
// Returns 1.0 for returning users or when promo is disabled.
func newUserPromoMultiplier(userID int, amountUSD float64) float64 {
	s := operation_setting.GetPaymentSetting()
	if !s.NewUserPromoEnabled {
		return 1.0
	}
	if model.HasCompletedTopup(userID) {
		return 1.0
	}

	limit := s.NewUserPromoLimitUSD
	mult := s.NewUserPromoMultiplier
	if limit <= 0 || mult <= 1.0 {
		return 1.0
	}

	if amountUSD <= limit {
		return mult
	}
	// Weighted average: promo portion gets mult, remainder gets 1×.
	promoQuota := limit * mult
	normalQuota := amountUSD - limit
	return (promoQuota + normalQuota) / amountUSD
}
