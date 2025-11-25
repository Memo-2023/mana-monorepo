# Stripe Quick Start Guide

## 🚀 Schnellstart in 30 Minuten

Diese Anleitung bringt dich in 30 Minuten zu einer funktionierenden Stripe-Integration.

## Prerequisites

- Stripe Account (stripe.com)
- SvelteKit Projekt läuft (`npm run dev`)
- PocketBase läuft

## Step 1: Stripe Setup (5 Min)

### 1.1 Install Stripe Dependencies

```bash
npm install stripe @stripe/stripe-js
```

### 1.2 Get API Keys

1. Login bei [stripe.com/dashboard](https://dashboard.stripe.com)
2. Kopiere Test Keys:
   - Publishable Key: `pk_test_...`
   - Secret Key: `sk_test_...`

### 1.3 Create Product

Im Stripe Dashboard:

1. Products → Add Product
2. Name: "ulo.ad Pro"
3. Price: €9.99/month
4. Kopiere Price ID: `price_xxx`

## Step 2: Environment Setup (2 Min)

```bash
# .env.local
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_PRICE_ID=price_1...
PUBLIC_APP_URL=http://localhost:5173
```

## Step 3: Minimal Backend (10 Min)

### 3.1 Stripe Client

```typescript
// src/lib/server/stripe.ts
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/static/private';

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
	apiVersion: '2024-11-20'
});
```

### 3.2 Checkout Endpoint

```typescript
// src/routes/api/checkout/+server.ts
import { json } from '@sveltejs/kit';
import { stripe } from '$lib/server/stripe';
import { PUBLIC_APP_URL } from '$env/static/public';
import { STRIPE_PRICE_ID } from '$env/static/private';

export async function POST({ locals }) {
	// Check if user is logged in
	if (!locals.pb.authStore.isValid) {
		return json({ error: 'Please login first' }, { status: 401 });
	}

	const session = await stripe.checkout.sessions.create({
		payment_method_types: ['card'],
		line_items: [
			{
				price: STRIPE_PRICE_ID,
				quantity: 1
			}
		],
		mode: 'subscription',
		success_url: `${PUBLIC_APP_URL}/success`,
		cancel_url: `${PUBLIC_APP_URL}/`,
		client_reference_id: locals.pb.authStore.model?.id
	});

	return json({ url: session.url });
}
```

## Step 4: Minimal Frontend (5 Min)

### 4.1 Upgrade Button

```svelte
<!-- src/lib/components/QuickUpgrade.svelte -->
<script lang="ts">
	let loading = false;

	async function upgrade() {
		loading = true;
		const res = await fetch('/api/checkout', { method: 'POST' });
		const { url } = await res.json();
		window.location.href = url;
	}
</script>

<button on:click={upgrade} disabled={loading}>
	{loading ? 'Loading...' : 'Upgrade to Pro €9.99/mo'}
</button>
```

### 4.2 Success Page

```svelte
<!-- src/routes/success/+page.svelte -->
<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		setTimeout(() => goto('/'), 3000);
	});
</script>

<div>
	<h1>🎉 Payment Successful!</h1>
	<p>Redirecting to dashboard...</p>
</div>
```

## Step 5: Test Payment (3 Min)

1. Click "Upgrade to Pro"
2. Use test card: `4242 4242 4242 4242`
3. Any future date, any CVC
4. Complete payment
5. Check Stripe Dashboard for payment

## Step 6: Basic Webhook (5 Min)

### 6.1 Get Webhook Secret

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login and forward webhooks
stripe login
stripe listen --forward-to localhost:5173/api/webhook

# Copy the webhook secret displayed
```

### 6.2 Webhook Handler

```typescript
// src/routes/api/webhook/+server.ts
import { stripe } from '$lib/server/stripe';
import { STRIPE_WEBHOOK_SECRET } from '$env/static/private';

export async function POST({ request, locals }) {
	const body = await request.text();
	const sig = request.headers.get('stripe-signature')!;

	try {
		const event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);

		if (event.type === 'checkout.session.completed') {
			const session = event.data.object;
			const userId = session.client_reference_id;

			// Update user to Pro in PocketBase
			if (userId) {
				await locals.pb.collection('users').update(userId, {
					subscription_status: 'pro'
				});
			}
		}

		return new Response('OK');
	} catch (err) {
		return new Response('Webhook Error', { status: 400 });
	}
}
```

## Step 7: Add to PocketBase (2 Min)

Add field to users collection:

```javascript
{
  name: "subscription_status",
  type: "select",
  options: ["free", "pro"],
  default: "free"
}
```

## Done! 🎊

Du hast jetzt:

- ✅ Funktionierende Checkout-Seite
- ✅ Test-Zahlungen möglich
- ✅ User-Status wird aktualisiert
- ✅ Webhook-Integration

## Next Steps

### Enforce Limits

```typescript
// In your API routes
if (user.subscription_status !== 'pro' && user.links_count >= 10) {
	return json({ error: 'Upgrade to Pro for unlimited links' }, { status: 403 });
}
```

### Add Customer Portal

```typescript
const session = await stripe.billingPortal.sessions.create({
	customer: user.stripe_customer_id,
	return_url: `${PUBLIC_APP_URL}/account`
});
```

### Production Checklist

- [ ] Switch to live keys
- [ ] Update webhook endpoint
- [ ] Add error handling
- [ ] Add loading states
- [ ] Test mit echten Karten
- [ ] Setup email notifications

## Troubleshooting

**"No such price"**
→ Check STRIPE_PRICE_ID in .env

**Webhook 400 Error**
→ Wrong webhook secret, check stripe listen output

**User not updated**
→ Check PocketBase permissions

**Checkout won't load**
→ Check PUBLIC_STRIPE_PUBLISHABLE_KEY

## Useful Commands

```bash
# Watch webhook events
stripe listen --forward-to localhost:5173/api/webhook

# Trigger test events
stripe trigger checkout.session.completed

# See recent events
stripe events list

# Create test customer
stripe customers create --email=test@example.com
```

## Links

- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
- [Checkout Docs](https://stripe.com/docs/payments/checkout)
- [SvelteKit Example](https://github.com/stripe-samples/checkout-single-subscription)
