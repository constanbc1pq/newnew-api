package setting

var StripePublicKey = "pk_live_51TMsBqA9lovNsebN9ixn2TX0MpfygXTPCKg3FKm1u2YiY314AHt5uRRYqUlZNKQCbCaqeJUk4fiKJLnxI3xdXUUt00SojdP1jb"
var StripeApiSecret = ""
var StripeWebhookSecret = ""
var StripePriceId = ""
var StripeUnitPrice = 8.0
var StripeMinTopUp = 1
var StripePromotionCodesEnabled = false

// StripePaymentMethods is a comma-separated list of Stripe payment method types to enable.
// e.g. "card,alipay,wechat_pay"
// Leave empty to let Stripe auto-select based on customer location.
var StripePaymentMethods = "card,alipay,wechat_pay"
