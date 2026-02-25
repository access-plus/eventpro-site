# Stripe Integration Guide

This guide walks you through configuring Stripe so payments work in the EventPro app (create payment intent, card form, confirm payment for guests and logged-in users).

---

## 1. What’s Already in the App

- **Backend**
  - `POST /api/v1/payments/create-intent` – creates a Stripe PaymentIntent and returns `clientSecret`.
  - `POST /api/v1/payments/confirm` – confirms payment and creates order (authenticated users).
  - `POST /api/v1/payments/guest/confirm` – confirms payment and creates order (guest checkout).
  - Uses Stripe Java SDK; keys read from environment (see below).

- **Frontend**
  - Loads Stripe.js and mounts the Card element on the checkout page.
  - Uses `clientSecret` from create-intent to confirm card payment, then calls your backend to confirm and create the order.

You only need to **configure keys and (optionally) webhooks**; no code changes required for basic card payments.

---

## 2. Get Your Stripe Keys (Test Mode)

1. Go to **[Stripe Dashboard → API keys](https://dashboard.stripe.com/test/apikeys)**.
2. Ensure you’re in **Test mode** (toggle in the top right).
3. Copy:
   - **Publishable key** (starts with `pk_test_...`) – used in the frontend.
   - **Secret key** (starts with `sk_test_...`) – used only in the backend; never expose in the frontend.

---

## 3. Configure Environment Variables

### Option A: Docker (backend + frontend in containers)

Use a **`.env` file in the project root** (same folder as `docker-compose.yml`). Create or edit it:

```bash
# Stripe – required for payments (get keys from Dashboard; never commit real secret key)
STRIPE_SECRET_KEY=sk_test_...   # paste your secret key here
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

- Backend uses `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY`.
- Frontend container automatically gets the publishable key from `STRIPE_PUBLISHABLE_KEY` (so you don’t need `VITE_STRIPE_PUBLISHABLE_KEY` in root `.env` unless you want to override it).

Restart after changing env:

```bash
docker compose restart backend frontend
```

### Option B: Frontend run locally (e.g. `npm run dev` in eventpro-frontend)

Backend can still get keys from root `.env` via Docker. For the frontend:

- Add to **`eventpro-frontend/.env.local`**:

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Restart the frontend dev server after changing.

---

## 4. Verify the Integration

1. **Start the app** (e.g. `make local-up` or `docker compose up`).
2. **Add tickets to cart** and go to **Checkout**.
3. **Proceed to Payment** – you should see the Stripe card field (no “Payment is not configured” or “Set VITE_STRIPE_PUBLISHABLE_KEY”).
4. **Use a Stripe test card**:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - 3D Secure: `4000 0025 0000 3155`
   - Any future expiry (e.g. 12/34), any 3-digit CVC, any postal code.

If you see “Invalid API Key” or “Payment is not configured”, the backend is using a wrong or placeholder secret key – fix `STRIPE_SECRET_KEY` in `.env` and restart the backend.

---

## 5. Optional: Webhooks (for production or async events)

For **local development**, the app does **not** require webhooks for basic flow: the frontend confirms the card with Stripe, then your backend confirms the PaymentIntent and creates the order.

If you later want webhooks (e.g. `payment_intent.succeeded`, `payment_intent.payment_failed`):

1. Install Stripe CLI: <https://stripe.com/docs/stripe-cli>.
2. Login and forward events to your backend:
   ```bash
   stripe listen --forward-to localhost:8080/api/v1/payments/webhook
   ```
3. Add `STRIPE_WEBHOOK_SECRET` to `.env` (the CLI will show a signing secret when you run `stripe listen`).
4. Implement a `POST /api/v1/payments/webhook` endpoint that verifies the signature and handles the events you need.

The app may already define a webhook route; if not, you can add it when you need it.

---

## 6. Checklist

| Step | Done |
|------|------|
| Get Stripe test keys from Dashboard (Test mode) | ☐ |
| Set `STRIPE_SECRET_KEY` in root `.env` | ☐ |
| Set `STRIPE_PUBLISHABLE_KEY` in root `.env` (optional for backend) | ☐ |
| Set `VITE_STRIPE_PUBLISHABLE_KEY` in root `.env` and/or `eventpro-frontend/.env.local` | ☐ |
| Restart backend (and frontend if using Docker) | ☐ |
| Test checkout with card `4242 4242 4242 4242` | ☐ |

---

## 7. Security Reminders

- **Never commit** `.env` or any file containing `sk_test_...` or `sk_live_...` (`.env` is in `.gitignore`).
- Use **test keys** (`sk_test_...`, `pk_test_...`) for local and non-production; use **live keys** only in production and only via secure config (e.g. env vars or secrets manager).
- The **publishable key** is safe to use in the browser; the **secret key** must stay on the server.

For more env details, see [docs/VARIABLES.md](./VARIABLES.md).
