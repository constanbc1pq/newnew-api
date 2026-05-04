package payment

import (
	"fmt"

	"github.com/QuantumNous/new-api/model"
)

// Provider is the unified interface every payment backend must implement.
// Adding a new provider only requires implementing these three methods.
type Provider interface {
	// Name returns a stable lowercase identifier used in TopUp.PaymentMethod and Transaction.Provider.
	Name() string

	// CreateOrder initiates a payment and returns a redirect URL plus the
	// trade number that was stored in the TopUp record.
	CreateOrder(user *model.User, req OrderRequest) (*OrderResult, error)

	// HandleWebhook validates the incoming callback, returns whether the
	// payment succeeded, and the trade number to look up.
	HandleWebhook(payload []byte, headers map[string]string) (*WebhookResult, error)
}

type OrderRequest struct {
	// QuotaAmount is the raw quota units the user wants to buy.
	// Providers that price by quota (Creem, Coinbase, NowPayments) use this.
	QuotaAmount int64

	// AmountUSD is the real-money amount in USD (used by Stripe / Waffo).
	AmountUSD float64

	// Currency hint from the client (e.g. "USDT", "BTC").  Optional.
	Currency string

	// ReturnURL is where the browser should land after the hosted checkout.
	ReturnURL string

	// CancelURL is where to send the user on failure/cancellation.
	CancelURL string

	// PaymentMethod is a provider-specific hint (e.g. "card", "alipay", "wechat_pay").
	PaymentMethod string
}

type OrderResult struct {
	TradeNo    string
	PaymentURL string
}

type WebhookResult struct {
	TradeNo  string
	Paid     bool
	Amount   float64
	Currency string
}

// Registry maps provider names to their implementations.
var registry = map[string]Provider{}

func Register(p Provider) {
	registry[p.Name()] = p
}

func Get(name string) (Provider, error) {
	p, ok := registry[name]
	if !ok {
		return nil, fmt.Errorf("payment provider %q not registered", name)
	}
	return p, nil
}

func All() []Provider {
	list := make([]Provider, 0, len(registry))
	for _, p := range registry {
		list = append(list, p)
	}
	return list
}
