# Stripe Integration Implementation Guide für ulo.ad

## Übersicht

Diese Anleitung beschreibt die Implementierung von Stripe Checkout für ulo.ad mit einem Freemium-Modell (10 kostenlose Links pro Monat, danach Pro-Abo erforderlich).

## Architektur-Entscheidungen

- **Payment Method**: Stripe Checkout (gehostete Zahlungsseite)
- **Subscription Model**: Freemium mit monatlichem Pro-Plan
- **Enforcement**: Server-side Paywall mit Link-Counting
- **Database**: PocketBase für User-Status und Usage-Tracking

## 1. Stripe Account Setup

### 1.1 Account erstellen

1. Registriere dich bei [stripe.com](https://stripe.com)
2. Aktiviere Test-Modus für Entwicklung
3. Notiere folgende Keys aus dem Dashboard:
   - Publishable Key: `pk_test_...`
   - Secret Key: `sk_test_...`

### 1.2 Webhook Endpoint konfigurieren

1. Gehe zu Dashboard → Developers → Webhooks
2. Füge Endpoint hinzu: `https://ulo.ad/api/stripe/webhook`
3. Wähle Events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Notiere Webhook Secret: `whsec_...`

### 1.3 Produkte und Preise anlegen

```javascript
// Im Stripe Dashboard unter "Products":
Produkt: "ulo.ad Pro"
Beschreibung: "Unlimited link creation and premium features"

Preis 1:
- Name: "Monthly"
- Preis: €9.99/Monat
- Price ID: price_monthly_xxx

Preis 2:
- Name: "Yearly"
- Preis: €99/Jahr (2 Monate gratis)
- Price ID: price_yearly_xxx
```

## 2. PocketBase Schema Updates

### 2.1 Users Collection erweitern

```javascript
// Neue Felder für users collection:
{
  "subscription_status": {
    "type": "select",
    "options": ["free", "pro", "cancelled", "past_due"],
    "default": "free",
    "required": true
  },
  "stripe_customer_id": {
    "type": "text",
    "required": false
  },
  "stripe_subscription_id": {
    "type": "text",
    "required": false
  },
  "current_period_end": {
    "type": "date",
    "required": false
  },
  "links_created_this_month": {
    "type": "number",
    "default": 0,
    "min": 0,
    "required": true
  },
  "monthly_reset_date": {
    "type": "date",
    "required": false
  }
}
```

### 2.2 Usage Tracking Collection

```javascript
// Neue collection: usage_logs
{
  "user": {
    "type": "relation",
    "collection": "users",
    "required": true
  },
  "action": {
    "type": "select",
    "options": ["link_created", "link_deleted", "qr_generated"],
    "required": true
  },
  "timestamp": {
    "type": "autodate",
    "onCreate": true
  },
  "link_id": {
    "type": "relation",
    "collection": "links",
    "required": false
  }
}
```

## 3. Backend Implementation

### 3.1 Environment Variables

```bash
# .env.local
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY=price_monthly_xxx
STRIPE_PRICE_YEARLY=price_yearly_xxx
PUBLIC_APP_URL=http://localhost:5173  # Production: https://ulo.ad
```

### 3.2 Stripe Client Setup

```typescript
// src/lib/server/stripe.ts
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/static/private';

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
	apiVersion: '2024-11-20',
	typescript: true
});
```

### 3.3 Checkout Session API

```typescript
// src/routes/api/stripe/checkout/+server.ts
import { json } from '@sveltejs/kit';
import { stripe } from '$lib/server/stripe';
import { PUBLIC_APP_URL } from '$env/static/public';
import { STRIPE_PRICE_MONTHLY } from '$env/static/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const { priceId, userId } = await request.json();

		// Verify user is authenticated
		if (!locals.pb.authStore.isValid) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const user = locals.pb.authStore.model;

		// Create or retrieve Stripe customer
		let customerId = user.stripe_customer_id;

		if (!customerId) {
			const customer = await stripe.customers.create({
				email: user.email,
				metadata: {
					pocketbase_id: user.id
				}
			});
			customerId = customer.id;

			// Save customer ID to PocketBase
			await locals.pb.collection('users').update(user.id, {
				stripe_customer_id: customerId
			});
		}

		// Create checkout session
		const session = await stripe.checkout.sessions.create({
			customer: customerId,
			payment_method_types: ['card', 'sepa_debit'],
			line_items: [
				{
					price: priceId || STRIPE_PRICE_MONTHLY,
					quantity: 1
				}
			],
			mode: 'subscription',
			success_url: `${PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${PUBLIC_APP_URL}/pricing`,
			metadata: {
				user_id: user.id
			},
			allow_promotion_codes: true,
			billing_address_collection: 'auto',
			locale: 'de'
		});

		return json({ sessionId: session.id, url: session.url });
	} catch (error) {
		console.error('Checkout session error:', error);
		return json({ error: 'Failed to create checkout session' }, { status: 500 });
	}
};
```

### 3.4 Webhook Handler

```typescript
// src/routes/api/stripe/webhook/+server.ts
import { stripe } from '$lib/server/stripe';
import { STRIPE_WEBHOOK_SECRET } from '$env/static/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const signature = request.headers.get('stripe-signature');
	const body = await request.text();

	let event;

	try {
		event = stripe.webhooks.constructEvent(body, signature!, STRIPE_WEBHOOK_SECRET);
	} catch (err) {
		console.error('Webhook signature verification failed:', err);
		return new Response('Webhook Error', { status: 400 });
	}

	// Handle the event
	try {
		switch (event.type) {
			case 'checkout.session.completed': {
				const session = event.data.object;
				const userId = session.metadata?.user_id;

				if (userId) {
					await locals.pb.collection('users').update(userId, {
						subscription_status: 'pro',
						stripe_subscription_id: session.subscription,
						current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Approximate, will be updated by subscription.updated
					});
				}
				break;
			}

			case 'customer.subscription.updated': {
				const subscription = event.data.object;
				const customer = await stripe.customers.retrieve(subscription.customer as string);

				if (customer && !customer.deleted && customer.metadata?.pocketbase_id) {
					const status =
						subscription.status === 'active'
							? 'pro'
							: subscription.status === 'past_due'
								? 'past_due'
								: 'cancelled';

					await locals.pb.collection('users').update(customer.metadata.pocketbase_id, {
						subscription_status: status,
						current_period_end: new Date(subscription.current_period_end * 1000)
					});
				}
				break;
			}

			case 'customer.subscription.deleted': {
				const subscription = event.data.object;
				const customer = await stripe.customers.retrieve(subscription.customer as string);

				if (customer && !customer.deleted && customer.metadata?.pocketbase_id) {
					await locals.pb.collection('users').update(customer.metadata.pocketbase_id, {
						subscription_status: 'cancelled',
						stripe_subscription_id: null
					});
				}
				break;
			}

			case 'invoice.payment_failed': {
				const invoice = event.data.object;
				const customer = await stripe.customers.retrieve(invoice.customer as string);

				if (customer && !customer.deleted && customer.metadata?.pocketbase_id) {
					await locals.pb.collection('users').update(customer.metadata.pocketbase_id, {
						subscription_status: 'past_due'
					});

					// TODO: Send email notification
				}
				break;
			}
		}

		return new Response('Webhook processed', { status: 200 });
	} catch (error) {
		console.error('Webhook processing error:', error);
		return new Response('Webhook processing failed', { status: 500 });
	}
};
```

## 4. Frontend Implementation

### 4.1 Upgrade Button Component

```svelte
<!-- src/lib/components/UpgradeButton.svelte -->
<script lang="ts">
	import { loadStripe } from '@stripe/stripe-js';
	import { PUBLIC_STRIPE_PUBLISHABLE_KEY } from '$env/static/public';

	export let priceId: string | undefined = undefined;
	export let buttonText = 'Upgrade to Pro';
	export let className = '';

	let loading = false;

	async function handleUpgrade() {
		loading = true;

		try {
			// Create checkout session
			const response = await fetch('/api/stripe/checkout', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ priceId })
			});

			const { sessionId, url } = await response.json();

			if (url) {
				// Redirect to Stripe Checkout
				window.location.href = url;
			} else {
				// Fallback to Stripe.js redirect
				const stripe = await loadStripe(PUBLIC_STRIPE_PUBLISHABLE_KEY);
				await stripe?.redirectToCheckout({ sessionId });
			}
		} catch (error) {
			console.error('Upgrade error:', error);
			// TODO: Show error toast
		} finally {
			loading = false;
		}
	}
</script>

<button
	on:click={handleUpgrade}
	disabled={loading}
	class="btn btn-primary {className}"
	class:loading
>
	{#if loading}
		Lädt...
	{:else}
		{buttonText}
	{/if}
</button>
```

### 4.2 Paywall Banner

```svelte
<!-- src/lib/components/PaywallBanner.svelte -->
<script lang="ts">
	import { page } from '$app/stores';
	import UpgradeButton from './UpgradeButton.svelte';

	export let linksUsed = 0;
	export let maxFreeLinks = 10;

	$: isNearLimit = linksUsed >= maxFreeLinks - 2;
	$: hasReachedLimit = linksUsed >= maxFreeLinks;
</script>

{#if isNearLimit}
	<div class="alert {hasReachedLimit ? 'alert-error' : 'alert-warning'} mb-4 shadow-lg">
		<div>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-6 w-6 flex-shrink-0 stroke-current"
				fill="none"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
				/>
			</svg>
			<div>
				<h3 class="font-bold">
					{#if hasReachedLimit}
						Link-Limit erreicht!
					{:else}
						Du näherst dich deinem monatlichen Limit
					{/if}
				</h3>
				<div class="text-xs">
					Du hast {linksUsed} von {maxFreeLinks} kostenlosen Links diesen Monat verwendet.
					{#if hasReachedLimit}
						Upgrade auf Pro für unbegrenzte Links!
					{/if}
				</div>
			</div>
		</div>
		<div class="flex-none">
			<UpgradeButton buttonText="Jetzt upgraden" className="btn-sm" />
		</div>
	</div>
{/if}
```

## 5. Server-side Paywall Enforcement

### 5.1 Usage Tracking Middleware

```typescript
// src/lib/server/usage.ts
import type { PocketBase } from 'pocketbase';

export async function checkUsageLimit(pb: PocketBase, userId: string): Promise<boolean> {
	const user = await pb.collection('users').getOne(userId);

	// Pro users have no limits
	if (user.subscription_status === 'pro') {
		return true;
	}

	// Check monthly reset
	const now = new Date();
	const resetDate = user.monthly_reset_date ? new Date(user.monthly_reset_date) : null;

	if (!resetDate || resetDate < now) {
		// Reset counter at the beginning of each month
		await pb.collection('users').update(userId, {
			links_created_this_month: 0,
			monthly_reset_date: new Date(now.getFullYear(), now.getMonth() + 1, 1)
		});
		return true;
	}

	// Check if under limit
	return user.links_created_this_month < 10;
}

export async function incrementUsage(pb: PocketBase, userId: string) {
	const user = await pb.collection('users').getOne(userId);

	await pb.collection('users').update(userId, {
		links_created_this_month: (user.links_created_this_month || 0) + 1
	});

	// Log usage
	await pb.collection('usage_logs').create({
		user: userId,
		action: 'link_created',
		timestamp: new Date()
	});
}
```

### 5.2 API Route Protection

```typescript
// src/routes/api/links/+server.ts (Example)
import { json } from '@sveltejs/kit';
import { checkUsageLimit, incrementUsage } from '$lib/server/usage';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.pb.authStore.isValid) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = locals.pb.authStore.model?.id;

	// Check usage limit
	const canCreate = await checkUsageLimit(locals.pb, userId);

	if (!canCreate) {
		return json(
			{
				error: 'Monthly limit reached. Please upgrade to Pro for unlimited links.',
				requiresUpgrade: true
			},
			{ status: 403 }
		);
	}

	try {
		// Create the link
		const data = await request.json();
		const link = await locals.pb.collection('links').create({
			...data,
			user: userId
		});

		// Increment usage counter
		await incrementUsage(locals.pb, userId);

		return json(link);
	} catch (error) {
		return json({ error: 'Failed to create link' }, { status: 500 });
	}
};
```

## 6. Success & Cancel Pages

### 6.1 Success Page

```svelte
<!-- src/routes/checkout/success/+page.svelte -->
<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let verifying = true;

	onMount(async () => {
		// Verify the session with backend
		const sessionId = $page.url.searchParams.get('session_id');

		if (sessionId) {
			// Optional: Verify session with backend
			// await fetch(`/api/stripe/verify-session/${sessionId}`);
		}

		// Refresh user data
		await fetch('/api/user/refresh');

		verifying = false;

		// Redirect to dashboard after 3 seconds
		setTimeout(() => {
			goto('/dashboard');
		}, 3000);
	});
</script>

<div class="flex min-h-screen items-center justify-center">
	<div class="text-center">
		{#if verifying}
			<div class="loading loading-spinner loading-lg"></div>
			<p class="mt-4">Verifiziere deine Zahlung...</p>
		{:else}
			<div class="mb-4 text-6xl">🎉</div>
			<h1 class="mb-2 text-3xl font-bold">Willkommen bei ulo.ad Pro!</h1>
			<p class="mb-4 text-lg">Dein Upgrade war erfolgreich.</p>
			<p class="text-sm text-gray-600">
				Du wirst in wenigen Sekunden zum Dashboard weitergeleitet...
			</p>
		{/if}
	</div>
</div>
```

### 6.2 Cancel Page

```svelte
<!-- src/routes/checkout/cancel/+page.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import UpgradeButton from '$lib/components/UpgradeButton.svelte';
</script>

<div class="flex min-h-screen items-center justify-center">
	<div class="max-w-md text-center">
		<div class="mb-4 text-6xl">🤔</div>
		<h1 class="mb-2 text-2xl font-bold">Upgrade abgebrochen</h1>
		<p class="mb-6">
			Kein Problem! Du kannst jederzeit upgraden, wenn du bereit bist. Bis dahin kannst du weiterhin
			10 Links pro Monat kostenlos erstellen.
		</p>

		<div class="flex justify-center gap-4">
			<button on:click={() => goto('/dashboard')} class="btn btn-outline">
				Zurück zum Dashboard
			</button>
			<UpgradeButton buttonText="Nochmal versuchen" />
		</div>
	</div>
</div>
```

## 7. Testing

### 7.1 Stripe Test Cards

```
Erfolgreiche Zahlung: 4242 4242 4242 4242
Zahlung erfordert Auth: 4000 0025 0000 3155
Zahlung abgelehnt: 4000 0000 0000 9995
SEPA Test IBAN: DE89 3704 0044 0532 0130 00
```

### 7.2 Webhook Testing mit Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:5173/api/stripe/webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
```

### 7.3 Test Checklist

- [ ] User kann Checkout Session erstellen
- [ ] Redirect zu Stripe funktioniert
- [ ] Success Page wird nach Zahlung angezeigt
- [ ] User Status wird auf "pro" gesetzt
- [ ] Webhooks werden verarbeitet
- [ ] Link-Limit wird für Free User enforced
- [ ] Pro User haben kein Limit
- [ ] Monthly Reset funktioniert
- [ ] Subscription Cancellation wird verarbeitet
- [ ] Failed Payments werden gehandhabt

## 8. Production Deployment

### 8.1 Environment Variables

```bash
# Production .env
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_live_xxx
PUBLIC_APP_URL=https://ulo.ad
```

### 8.2 Webhook URL Update

1. Stripe Dashboard → Webhooks
2. Update Endpoint URL zu `https://ulo.ad/api/stripe/webhook`
3. Neues Webhook Secret notieren

### 8.3 SSL/HTTPS Requirement

Stripe requires HTTPS in production. Stelle sicher, dass deine Domain SSL-Zertifikate hat.

### 8.4 Monitoring

- Stripe Dashboard für Payment Analytics
- PocketBase Logs für Webhook-Fehler
- User Feedback für UX-Probleme

## 9. Rechtliche Anforderungen (Deutschland)

### 9.1 Impressum & AGB Updates

- Zahlungsdienstleister erwähnen
- Widerrufsrecht für digitale Dienstleistungen
- Preise inkl. MwSt. anzeigen

### 9.2 Rechnungsstellung

Stripe kann automatisch Rechnungen erstellen:

1. Dashboard → Settings → Billing → Invoices
2. Aktiviere "Email customers their invoices"
3. Konfiguriere Rechnungsnummer-Format
4. Füge Steuernummer hinzu

### 9.3 DSGVO

- Erwähne Stripe in Datenschutzerklärung
- Datenverarbeitung in den USA erwähnen
- Auftragsverarbeitungsvertrag mit Stripe

## Support & Troubleshooting

### Häufige Probleme

**Webhook 400 Error**

- Webhook Secret prüfen
- Body als raw text, nicht JSON parsen

**User Status wird nicht aktualisiert**

- Webhook Events in Stripe Dashboard prüfen
- PocketBase Permissions prüfen

**CORS Fehler**

- PUBLIC_APP_URL korrekt setzen
- Stripe Checkout erlaubt keine custom headers

### Hilfreiche Links

- [Stripe Docs](https://stripe.com/docs)
- [Stripe Checkout Guide](https://stripe.com/docs/payments/checkout)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [SvelteKit + Stripe Example](https://github.com/stripe-samples/subscription-use-cases/tree/main/fixed-price-subscriptions/sveltekit)
