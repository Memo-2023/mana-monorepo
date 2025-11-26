# Der einfachste Weg: Stripe in 1 Stunde integrieren

## Das Ziel

10 kostenlose Links pro Monat, danach 9,99€/Monat für unbegrenzte Links.

## Was du brauchst (5 Min)

### 1. Stripe Account

- Gehe zu [stripe.com](https://stripe.com) → Registrieren
- Wähle "Test Mode" (oben rechts)
- Kopiere deine Test Keys aus dem Dashboard

### 2. NPM Package

```bash
npm install stripe @stripe/stripe-js
```

### 3. Environment Variables

```bash
# .env
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51RujJlPRtmsJbOMgKRJu4uOqOGzGXwI8FT0qwf1jJUQ0HJIDmxBR3fzJSqGhVQCJ5xAJ4jKh0U6JvfLdx76FpMGB00xQI2j4qg
STRIPE_SECRET_KEY=sk_test_51RujJlPRtmsJbOMgPQDqEA4CBgWSGKkjlCry8nTlHs9b6xSwwh0ccj6RoaZSvl84cQ8TO28Nk0ug64fRlF978vK300EsYm8RP0

# Stripe Product & Prices
STRIPE_PRODUCT_ID=prod_SrqNlCbfaaKSnk
STRIPE_PRICE_MONTHLY=price_1Rw6hkPRtmsJbOMgdUYfj7ee
STRIPE_PRICE_YEARLY=price_1Rw6j0PRtmsJbOMgTGrOZH2c
STRIPE_PRICE_LIFETIME=price_1Rw6qPPRtmsJbOMgsS6nnBTM

PUBLIC_APP_URL=http://localhost:5173
```

## Schritt 1: Produkt in Stripe erstellen (2 Min)

Im Stripe Dashboard:

1. → Products → Add Product
2. Name: "ulo.ad Pro"
3. → Add Price: 9,99€ / Monthly
4. **Kopiere die Price ID** (z.B. `price_1OxAbc...`)
5. Füge sie in `.env.local` ein

## Schritt 2: Minimal Backend (10 Min)

### Checkout Route

```typescript
// src/routes/api/stripe/checkout/+server.ts
import { json } from '@sveltejs/kit';
import Stripe from 'stripe';
import { env } from '$env/dynamic/private';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
	apiVersion: '2024-10-28.acacia'
});

export async function POST({ request, locals, url }) {
	// User muss eingeloggt sein
	if (!locals.user) {
		return json({ error: 'Login required' }, { status: 401 });
	}

	const { priceType = 'monthly' } = await request.json();

	// Preis auswählen
	let priceId;
	let mode = 'subscription';

	switch (priceType) {
		case 'yearly':
			priceId = env.STRIPE_PRICE_YEARLY;
			break;
		case 'lifetime':
			priceId = env.STRIPE_PRICE_LIFETIME;
			mode = 'payment';
			break;
		default:
			priceId = env.STRIPE_PRICE_MONTHLY;
	}

	const session = await stripe.checkout.sessions.create({
		customer_email: locals.user.email,
		payment_method_types: ['card', 'sepa_debit'],
		line_items: [
			{
				price: priceId,
				quantity: 1
			}
		],
		mode,
		success_url: `${url.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
		cancel_url: `${url.origin}/pricing`,
		client_reference_id: locals.user.id
	});

	return json({ url: session.url });
}
```

### Webhook Handler (vereinfacht)

```typescript
// src/routes/api/stripe/webhook/+server.ts
import Stripe from 'stripe';
import { env } from '$env/dynamic/private';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
	apiVersion: '2024-10-28.acacia'
});

export async function POST({ request, locals }) {
	const body = await request.text();

	// Vereinfacht: Kein Signature Check für Test
	const event = JSON.parse(body);

	if (event.type === 'checkout.session.completed') {
		const session = event.data.object;
		const userId = session.client_reference_id;

		// User auf Pro upgraden
		await locals.pb.collection('users').update(userId, {
			subscription_status: 'pro',
			stripe_customer_id: session.customer
		});
	}

	return new Response('OK');
}
```

## Schritt 3: PocketBase Update (5 Min)

In PocketBase Admin:

1. Users Collection → Edit
2. Add Field:
   - Name: `subscription_status`
   - Type: Select
   - Options: `free`, `pro`
   - Default: `free`
3. Add Field:
   - Name: `links_count`
   - Type: Number
   - Default: 0

## Schritt 4: Frontend (10 Min)

### Upgrade Button

```svelte
<!-- src/lib/components/UpgradeButton.svelte -->
<script>
	export let priceType = 'monthly';

	async function upgrade() {
		const res = await fetch('/api/stripe/checkout', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ priceType })
		});
		const { url } = await res.json();
		window.location.href = url;
	}
</script>

<button on:click={upgrade} class="btn btn-primary">
	Upgrade für {priceType === 'yearly' ? '39,99€/Jahr' : '4,99€/Monat'}
</button>
```

### Paywall Check

```svelte
<!-- src/routes/create/+page.svelte -->
<script>
	export let data;

	$: canCreate = data.user.subscription_status === 'pro' || data.user.links_count < 10;
</script>

{#if !canCreate}
	<div class="alert alert-warning">
		Du hast dein Limit von 10 kostenlosen Links erreicht.
		<UpgradeButton />
	</div>
{:else}
	<!-- Link erstellen Form -->
{/if}
```

### Success Page

```svelte
<!-- src/routes/success/+page.svelte -->
<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		setTimeout(() => goto('/'), 3000);
	});
</script>

<h1>🎉 Willkommen bei Pro!</h1><p>Du wirst gleich weitergeleitet...</p>
```

## Schritt 5: API Protection (5 Min)

```typescript
// src/routes/api/links/+server.ts
export async function POST({ request, locals }) {
  const user = locals.user;

  // Check limit
  if (user.subscription_status !== 'pro' && user.links_count >= 10) {
    return json({
      error: 'Limit erreicht. Bitte upgrade auf Pro.'
    }, { status: 403 });
  }

  // Link erstellen
  const link = await locals.pb.collection('links').create({...});

  // Counter erhöhen (nur für Free User)
  if (user.subscription_status !== 'pro') {
    await locals.pb.collection('users').update(user.id, {
      links_count: user.links_count + 1
    });
  }

  return json(link);
}
```

## Schritt 6: Testing (5 Min)

### Webhook mit Stripe CLI testen

```bash
# Stripe CLI installieren
brew install stripe/stripe-cli/stripe

# Webhooks forwarden
stripe listen --forward-to localhost:5173/api/webhook

# In neuem Terminal: Test Event senden
stripe trigger checkout.session.completed
```

### Test Kreditkarte

- Nummer: `4242 4242 4242 4242`
- Datum: Beliebig in Zukunft
- CVC: Beliebige 3 Zahlen

## Fertig! ✅

Das war's. Du hast jetzt:

- ✅ Stripe Checkout für Payments
- ✅ 10 kostenlose Links pro Monat
- ✅ Pro-Abo für unbegrenzte Links
- ✅ Automatisches Status-Update

## Nächste Schritte (Optional)

### Webhook Security hinzufügen

```typescript
// Webhook Signature verifizieren
const sig = request.headers.get('stripe-signature');
const event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
```

### Monatliches Reset

```typescript
// Cron Job oder in API Route
if (new Date().getDate() === 1) {
	await pb.collection('users').update(userId, { links_count: 0 });
}
```

### Customer Portal

```typescript
// Abo verwalten
const portal = await stripe.billingPortal.sessions.create({
	customer: user.stripe_customer_id,
	return_url: `${PUBLIC_APP_URL}/account`
});
```

## Probleme?

### "Invalid Stripe API version"

→ Verwende `apiVersion: '2024-10-28.acacia'` beim Stripe initialisieren

### "Price ID not found"

→ Alle Umgebungsvariablen setzen:

- STRIPE_PRICE_MONTHLY
- STRIPE_PRICE_YEARLY
- STRIPE_PRICE_LIFETIME

### "No such price"

→ Price ID aus Stripe Dashboard kopieren

### Webhook funktioniert nicht

→ `stripe listen` läuft? Terminal Output prüfen

### User wird nicht auf Pro gesetzt

→ PocketBase Permissions prüfen

## Das war's! 🚀

Von 0 auf bezahlte Subscriptions in einer Stunde. Keine Magie, nur die absolut nötigsten Teile.
