# /stripe-test

Test Stripe webhooks locally using ngrok.

## Prerequisites

- `pnpm dev` running (API on port 3002)
- ngrok installed: `brew install ngrok`

## Steps

### 1. Start ngrok tunnel (in a separate terminal)
```bash
ngrok http 3002
```
Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)

### 2. Register webhook with Stripe
```bash
curl -X POST https://api.stripe.com/v1/webhook_endpoints \
  -u $STRIPE_SECRET_KEY: \
  -d url="https://YOUR_NGROK_URL/api/v1/billing/webhook" \
  -d "enabled_events[]=checkout.session.completed" \
  -d "enabled_events[]=customer.subscription.updated" \
  -d "enabled_events[]=customer.subscription.deleted" \
  -d "enabled_events[]=invoice.payment_failed"
```

### 3. Update STRIPE_WEBHOOK_SECRET in .env.local
Copy the `whsec_...` value from the webhook creation response into `.env.local`

### 4. Trigger a test event
```bash
# Simulate a completed checkout
curl -X POST https://api.stripe.com/v1/events \
  -u $STRIPE_SECRET_KEY: \
  --data-urlencode "type=checkout.session.completed"
```

Or use the Stripe Dashboard → Developers → Webhooks → Send test event

### 5. Verify webhook received
Check the API dev server logs for:
```
POST /api/v1/billing/webhook 200
```

## Test cards

| Card | Use |
|------|-----|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 9995` | Declined (insufficient funds) |
| `4000 0025 0000 3155` | Requires 3D Secure authentication |

Expiry: any future date. CVC: any 3 digits. ZIP: any 5 digits.
