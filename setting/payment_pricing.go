package setting

import "github.com/QuantumNous/new-api/setting/config"

// PricingConfig holds the base price that drives all payment calculations.
// All other currencies are derived from this via live FX rates.
type PricingConfig struct {
	// BasePriceUSDPerUnit is the USD price per quota unit (default: $0.000002 = $2 per 1M tokens).
	// Admins set this once; all currency prices auto-update via FX rates.
	BasePriceUSDPerUnit float64 `json:"base_price_usd_per_unit"`

	// DisplayCurrencies lists which currencies to show on the checkout page.
	DisplayCurrencies []string `json:"display_currencies"`
}

var pricingConfig = PricingConfig{
	BasePriceUSDPerUnit: 0.000002, // $2 per 1M tokens
	DisplayCurrencies:   []string{"USD", "CNY", "AUD", "THB", "EUR", "JPY"},
}

func init() {
	config.GlobalConfig.Register("pricing_config", &pricingConfig)
}

func GetPricingConfig() *PricingConfig {
	return &pricingConfig
}
