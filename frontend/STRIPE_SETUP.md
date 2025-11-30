# Stripe Payment Integration Setup

This project uses Stripe for secure payment processing with 3D Secure authentication support.

## Frontend Setup (Already Configured)

The frontend is ready to accept Stripe payments. You just need to configure the environment variables.

### Environment Variables

Add to your `.env` file:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

Get your publishable key from: https://dashboard.stripe.com/test/apikeys

## Backend Setup (Required)

Your backend needs to implement these endpoints:

### 1. Create Payment Intent
**POST** `/api/v1/payments/create-intent`

```json
Request Body:
{
  "amount": 100.50
}

Response:
{
  "status": "success",
  "data": {
    "clientSecret": "pi_xxx_secret_xxx"
  }
}
```

Backend implementation example:
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/api/v1/payments/create-intent', async (req, res) => {
  const { amount } = req.body;
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'usd',
    automatic_payment_methods: {
      enabled: true,
    },
  });
  
  res.json({
    status: 'success',
    data: {
      clientSecret: paymentIntent.client_secret
    }
  });
});
```

### 2. Confirm Payment & Create Order
**POST** `/api/v1/payments/confirm`

```json
Request Body:
{
  "paymentIntentId": "pi_xxx"
}

Response:
{
  "status": "success",
  "data": {
    "id": "order_123",
    "userId": "user_123",
    "totalAmount": 100.50,
    "status": "COMPLETED",
    "tickets": [...]
  }
}
```

Backend implementation example:
```javascript
app.post('/api/v1/payments/confirm', async (req, res) => {
  const { paymentIntentId } = req.body;
  
  // Verify payment with Stripe
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  
  if (paymentIntent.status !== 'succeeded') {
    return res.status(400).json({ error: 'Payment not completed' });
  }
  
  // Create order in your database
  const order = await createOrder({
    userId: req.user.id,
    totalAmount: paymentIntent.amount / 100,
    paymentIntentId: paymentIntentId,
    status: 'COMPLETED'
  });
  
  res.json({
    status: 'success',
    data: order
  });
});
```

### 3. Webhook Handler (Recommended for Production)
**POST** `/api/v1/webhooks/stripe`

Handle Stripe webhook events for:
- `payment_intent.succeeded` - Payment completed
- `payment_intent.payment_failed` - Payment failed
- `charge.refunded` - Refund processed

```javascript
app.post('/api/v1/webhooks/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      // Update order status in database
      await updateOrderStatus(paymentIntent.id, 'COMPLETED');
      break;
    case 'payment_intent.payment_failed':
      // Handle failed payment
      break;
  }

  res.json({ received: true });
});
```

## Testing

### Test Cards

Use these test card numbers in development:

- **Success**: `4242 4242 4242 4242`
- **3D Secure Auth**: `4000 0025 0000 3155`
- **Declined**: `4000 0000 0000 9995`

Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)

## Production Checklist

- [ ] Replace test keys with live Stripe keys
- [ ] Set up webhook endpoint and verify signature
- [ ] Configure webhook URL in Stripe Dashboard
- [ ] Enable proper error handling and logging
- [ ] Test 3D Secure authentication flow
- [ ] Implement proper order confirmation emails
- [ ] Set up refund handling
- [ ] Configure proper currency and payment methods

## Resources

- [Stripe API Docs](https://stripe.com/docs/api)
- [Payment Intents Guide](https://stripe.com/docs/payments/payment-intents)
- [Webhooks Guide](https://stripe.com/docs/webhooks)
- [Testing Cards](https://stripe.com/docs/testing)
