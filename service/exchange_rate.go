package service

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/QuantumNous/new-api/common"
)

const (
	// FXSpread is the markup we absorb to cover FX volatility.
	// e.g. 0.015 = 1.5% — users see a slightly worse rate but it's predictable.
	FXSpread = 0.015

	fxCacheTTL = time.Hour
	fxAPIURL   = "https://api.frankfurter.app/latest?from=USD"
)

// FXRates holds the latest cached exchange rates (base: USD).
type FXRates struct {
	mu        sync.RWMutex
	rates     map[string]float64
	fetchedAt time.Time
}

var globalFXRates = &FXRates{
	rates: defaultFXRates(),
}

// defaultFXRates returns conservative fallback rates when the API is unavailable.
func defaultFXRates() map[string]float64 {
	return map[string]float64{
		"USD": 1.0,
		"CNY": 7.25,
		"AUD": 1.55,
		"THB": 35.0,
		"EUR": 0.92,
		"GBP": 0.79,
		"JPY": 153.0,
		"HKD": 7.78,
		"SGD": 1.35,
		"KRW": 1340.0,
		"INR": 83.5,
	}
}

type frankfurterResponse struct {
	Rates map[string]float64 `json:"rates"`
}

// RefreshFXRates fetches the latest rates from Frankfurter and caches them.
// Safe to call concurrently; refresh is skipped if cache is still fresh.
func RefreshFXRates() error {
	globalFXRates.mu.RLock()
	fresh := time.Since(globalFXRates.fetchedAt) < fxCacheTTL
	globalFXRates.mu.RUnlock()
	if fresh {
		return nil
	}

	resp, err := http.Get(fxAPIURL)
	if err != nil {
		common.SysLog(fmt.Sprintf("FX rate fetch failed (using cached): %v", err))
		return err
	}
	defer resp.Body.Close()

	var data frankfurterResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return err
	}
	if len(data.Rates) == 0 {
		return fmt.Errorf("empty FX rates response")
	}

	data.Rates["USD"] = 1.0

	globalFXRates.mu.Lock()
	globalFXRates.rates = data.Rates
	globalFXRates.fetchedAt = time.Now()
	globalFXRates.mu.Unlock()

	common.SysLog("FX rates refreshed successfully")
	return nil
}

// GetFXRate returns the mid-market rate for the given currency vs USD.
// Falls back to defaults if the currency is unknown.
func GetFXRate(currency string) float64 {
	globalFXRates.mu.RLock()
	rate, ok := globalFXRates.rates[currency]
	globalFXRates.mu.RUnlock()
	if !ok || rate <= 0 {
		if def, ok := defaultFXRates()[currency]; ok {
			return def
		}
		return 1.0
	}
	return rate
}

// GetFXRateWithSpread returns the rate with our spread baked in.
// This slightly over-charges users in local currency, giving us a buffer
// against FX volatility so we don't lose money on conversions.
//
//	spread-adjusted rate = mid-market rate × (1 + FXSpread)
func GetFXRateWithSpread(currency string) float64 {
	return GetFXRate(currency) * (1 + FXSpread)
}

// USDToLocal converts a USD amount to the target currency using the spread rate.
func USDToLocal(amountUSD float64, currency string) float64 {
	if currency == "USD" {
		return amountUSD
	}
	return amountUSD * GetFXRateWithSpread(currency)
}

// LocalToUSD converts a local-currency amount back to USD (inverse of spread rate).
func LocalToUSD(amountLocal float64, currency string) float64 {
	if currency == "USD" {
		return amountLocal
	}
	rate := GetFXRateWithSpread(currency)
	if rate == 0 {
		return amountLocal
	}
	return amountLocal / rate
}

// GetAllRatesWithSpread returns all cached rates with spread applied.
// Used by the frontend to display localised prices.
func GetAllRatesWithSpread() map[string]float64 {
	globalFXRates.mu.RLock()
	defer globalFXRates.mu.RUnlock()

	out := make(map[string]float64, len(globalFXRates.rates))
	for k, v := range globalFXRates.rates {
		out[k] = v * (1 + FXSpread)
	}
	return out
}

// StartFXRefreshLoop kicks off a background goroutine that refreshes FX rates
// every hour. Call once at startup.
func StartFXRefreshLoop() {
	go func() {
		// Initial fetch
		if err := RefreshFXRates(); err != nil {
			common.SysLog("initial FX rate fetch failed, using defaults")
		}
		ticker := time.NewTicker(fxCacheTTL)
		defer ticker.Stop()
		for range ticker.C {
			if err := RefreshFXRates(); err != nil {
				common.SysLog(fmt.Sprintf("FX rate refresh failed: %v", err))
			}
		}
	}()
}
