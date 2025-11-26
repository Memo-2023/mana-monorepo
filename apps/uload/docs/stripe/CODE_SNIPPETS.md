# Stripe Integration Code Snippets

## Komplette Code-Beispiele für Copy & Paste

### 1. Complete Checkout API Route

```typescript
// src/routes/api/stripe/checkout/+server.ts
import { json } from '@sveltejs/kit';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY, STRIPE_PRICE_MONTHLY, STRIPE_PRICE_YEARLY } from '$env/static/private';
import { PUBLIC_APP_URL } from '$env/static/public';
import type { RequestHandler } from './$types';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
	apiVersion: '2024-11-20'
});

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Verify authentication
		if (!locals.pb.authStore.isValid) {
			return json({ error: 'Bitte erst einloggen' }, { status: 401 });
		}

		const user = locals.pb.authStore.model;
		const { interval = 'month' } = await request.json();

		// Check if user already has active subscription
		if (user?.subscription_status === 'pro') {
			return json({ error: 'Du hast bereits ein aktives Abo' }, { status: 400 });
		}

		// Create or get Stripe customer
		let stripeCustomerId = user?.stripe_customer_id;

		if (!stripeCustomerId) {
			const customer = await stripe.customers.create({
				email: user.email,
				name: user.name || undefined,
				metadata: {
					pocketbase_id: user.id,
					username: user.username || ''
				}
			});

			stripeCustomerId = customer.id;

			// Save customer ID for future use
			await locals.pb.collection('users').update(user.id, {
				stripe_customer_id: stripeCustomerId
			});
		}

		// Choose price based on interval
		const priceId = interval === 'year' ? STRIPE_PRICE_YEARLY : STRIPE_PRICE_MONTHLY;

		// Create Stripe Checkout session
		const session = await stripe.checkout.sessions.create({
			customer: stripeCustomerId,
			payment_method_types: ['card', 'sepa_debit', 'paypal'],
			billing_address_collection: 'required',
			line_items: [
				{
					price: priceId,
					quantity: 1
				}
			],
			mode: 'subscription',
			allow_promotion_codes: true,
			subscription_data: {
				metadata: {
					pocketbase_user_id: user.id
				}
			},
			success_url: `${PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${PUBLIC_APP_URL}/pricing?cancelled=true`,
			locale: 'de',
			metadata: {
				user_id: user.id,
				user_email: user.email
			}
		});

		return json({
			sessionId: session.id,
			url: session.url
		});
	} catch (error) {
		console.error('Stripe checkout error:', error);
		return json(
			{
				error: 'Fehler beim Erstellen der Checkout-Session'
			},
			{ status: 500 }
		);
	}
};
```

### 2. Complete Webhook Handler

```typescript
// src/routes/api/stripe/webhook/+server.ts
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from '$env/static/private';
import type { RequestHandler } from './$types';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
	apiVersion: '2024-11-20'
});

export const POST: RequestHandler = async ({ request, locals }) => {
	const body = await request.text();
	const signature = request.headers.get('stripe-signature');

	if (!signature) {
		return new Response('No signature', { status: 400 });
	}

	let event: Stripe.Event;

	try {
		event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
	} catch (err: any) {
		console.error(`Webhook signature verification failed: ${err.message}`);
		return new Response(`Webhook Error: ${err.message}`, { status: 400 });
	}

	// Handle different event types
	try {
		switch (event.type) {
			case 'checkout.session.completed': {
				const session = event.data.object as Stripe.Checkout.Session;
				console.log('✅ Checkout completed:', session.id);

				const userId = session.metadata?.user_id;
				if (!userId) {
					console.error('No user_id in session metadata');
					break;
				}

				// Get subscription details
				const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

				// Update user in PocketBase
				await locals.pb.collection('users').update(userId, {
					subscription_status: 'pro',
					stripe_customer_id: session.customer,
					stripe_subscription_id: subscription.id,
					current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
					subscription_interval: subscription.items.data[0].price.recurring?.interval || 'month'
				});

				// Reset usage counter for new subscribers
				await locals.pb.collection('users').update(userId, {
					links_created_this_month: 0,
					monthly_reset_date: new Date(
						new Date().getFullYear(),
						new Date().getMonth() + 1,
						1
					).toISOString()
				});

				console.log(`User ${userId} upgraded to Pro`);
				break;
			}

			case 'customer.subscription.updated': {
				const subscription = event.data.object as Stripe.Subscription;
				console.log('📝 Subscription updated:', subscription.id);

				// Get PocketBase user ID from customer
				const customer = (await stripe.customers.retrieve(
					subscription.customer as string
				)) as Stripe.Customer;
				const userId = customer.metadata?.pocketbase_id;

				if (!userId) {
					console.error('No pocketbase_id in customer metadata');
					break;
				}

				// Map Stripe status to our status
				let status = 'free';
				switch (subscription.status) {
					case 'active':
						status = 'pro';
						break;
					case 'past_due':
						status = 'past_due';
						break;
					case 'canceled':
					case 'unpaid':
						status = 'cancelled';
						break;
				}

				// Update user subscription status
				await locals.pb.collection('users').update(userId, {
					subscription_status: status,
					current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
				});

				console.log(`User ${userId} subscription status: ${status}`);
				break;
			}

			case 'customer.subscription.deleted': {
				const subscription = event.data.object as Stripe.Subscription;
				console.log('❌ Subscription cancelled:', subscription.id);

				const customer = (await stripe.customers.retrieve(
					subscription.customer as string
				)) as Stripe.Customer;
				const userId = customer.metadata?.pocketbase_id;

				if (!userId) {
					console.error('No pocketbase_id in customer metadata');
					break;
				}

				// Downgrade user to free
				await locals.pb.collection('users').update(userId, {
					subscription_status: 'free',
					stripe_subscription_id: null,
					current_period_end: null
				});

				console.log(`User ${userId} downgraded to Free`);
				break;
			}

			case 'invoice.payment_failed': {
				const invoice = event.data.object as Stripe.Invoice;
				console.log('💳 Payment failed:', invoice.id);

				const customer = (await stripe.customers.retrieve(
					invoice.customer as string
				)) as Stripe.Customer;
				const userId = customer.metadata?.pocketbase_id;

				if (!userId) break;

				// Mark as past_due
				await locals.pb.collection('users').update(userId, {
					subscription_status: 'past_due'
				});

				// TODO: Send email notification to user
				console.log(`User ${userId} payment failed`);
				break;
			}

			case 'invoice.payment_succeeded': {
				const invoice = event.data.object as Stripe.Invoice;
				console.log('✅ Payment succeeded:', invoice.id);

				// If user was past_due, reactivate
				const customer = (await stripe.customers.retrieve(
					invoice.customer as string
				)) as Stripe.Customer;
				const userId = customer.metadata?.pocketbase_id;

				if (!userId) break;

				const user = await locals.pb.collection('users').getOne(userId);
				if (user.subscription_status === 'past_due') {
					await locals.pb.collection('users').update(userId, {
						subscription_status: 'pro'
					});
					console.log(`User ${userId} reactivated after payment`);
				}
				break;
			}

			default:
				console.log(`Unhandled event type: ${event.type}`);
		}

		return new Response('Webhook processed', { status: 200 });
	} catch (error) {
		console.error('Webhook processing error:', error);
		return new Response('Webhook processing failed', { status: 500 });
	}
};
```

### 3. Customer Portal Route

```typescript
// src/routes/api/stripe/portal/+server.ts
import { json } from '@sveltejs/kit';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/static/private';
import { PUBLIC_APP_URL } from '$env/static/public';
import type { RequestHandler } from './$types';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
	apiVersion: '2024-11-20'
});

export const POST: RequestHandler = async ({ locals }) => {
	try {
		if (!locals.pb.authStore.isValid) {
			return json({ error: 'Nicht authentifiziert' }, { status: 401 });
		}

		const user = locals.pb.authStore.model;

		if (!user?.stripe_customer_id) {
			return json({ error: 'Kein Stripe-Kunde gefunden' }, { status: 400 });
		}

		// Create portal session
		const session = await stripe.billingPortal.sessions.create({
			customer: user.stripe_customer_id,
			return_url: `${PUBLIC_APP_URL}/account`,
			locale: 'de'
		});

		return json({ url: session.url });
	} catch (error) {
		console.error('Portal session error:', error);
		return json({ error: 'Fehler beim Erstellen der Portal-Session' }, { status: 500 });
	}
};
```

### 4. Usage Tracking Service

```typescript
// src/lib/server/subscription.ts
import type { PocketBase } from 'pocketbase';

export class SubscriptionService {
	constructor(private pb: PocketBase) {}

	async canCreateLink(userId: string): Promise<{ allowed: boolean; reason?: string }> {
		const user = await this.pb.collection('users').getOne(userId);

		// Pro users have unlimited access
		if (user.subscription_status === 'pro') {
			return { allowed: true };
		}

		// Past due users should pay first
		if (user.subscription_status === 'past_due') {
			return {
				allowed: false,
				reason: 'Bitte aktualisiere deine Zahlungsmethode'
			};
		}

		// Check monthly limit for free users
		await this.checkAndResetMonthlyCounter(userId, user);

		const updatedUser = await this.pb.collection('users').getOne(userId);
		const linksUsed = updatedUser.links_created_this_month || 0;

		if (linksUsed >= 10) {
			return {
				allowed: false,
				reason: `Du hast bereits ${linksUsed} von 10 kostenlosen Links diesen Monat erstellt`
			};
		}

		return { allowed: true };
	}

	async incrementUsage(userId: string): Promise<void> {
		const user = await this.pb.collection('users').getOne(userId);

		// Don't count for pro users
		if (user.subscription_status === 'pro') return;

		const currentCount = user.links_created_this_month || 0;

		await this.pb.collection('users').update(userId, {
			links_created_this_month: currentCount + 1
		});

		// Log usage
		await this.pb.collection('usage_logs').create({
			user: userId,
			action: 'link_created',
			timestamp: new Date().toISOString()
		});
	}

	private async checkAndResetMonthlyCounter(userId: string, user: any): Promise<void> {
		const now = new Date();
		const resetDate = user.monthly_reset_date ? new Date(user.monthly_reset_date) : null;

		// Reset if needed (first of the month or no reset date)
		if (!resetDate || resetDate <= now) {
			const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);

			await this.pb.collection('users').update(userId, {
				links_created_this_month: 0,
				monthly_reset_date: nextReset.toISOString()
			});
		}
	}

	async getUsageStats(userId: string): Promise<{
		used: number;
		limit: number;
		unlimited: boolean;
		daysUntilReset: number;
	}> {
		const user = await this.pb.collection('users').getOne(userId);

		if (user.subscription_status === 'pro') {
			return {
				used: 0,
				limit: 0,
				unlimited: true,
				daysUntilReset: 0
			};
		}

		await this.checkAndResetMonthlyCounter(userId, user);
		const updatedUser = await this.pb.collection('users').getOne(userId);

		const resetDate = new Date(updatedUser.monthly_reset_date);
		const now = new Date();
		const daysUntilReset = Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

		return {
			used: updatedUser.links_created_this_month || 0,
			limit: 10,
			unlimited: false,
			daysUntilReset
		};
	}
}
```

### 5. React/Svelte Components

```svelte
<!-- src/lib/components/PricingCard.svelte -->
<script lang="ts">
	import { loadStripe } from '@stripe/stripe-js';
	import { PUBLIC_STRIPE_PUBLISHABLE_KEY } from '$env/static/public';
	import { page } from '$app/stores';

	export let title: string;
	export let price: string;
	export let interval: 'month' | 'year' = 'month';
	export let features: string[] = [];
	export let recommended = false;

	let loading = false;
	let error = '';

	async function handleCheckout() {
		loading = true;
		error = '';

		try {
			const response = await fetch('/api/stripe/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ interval })
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Checkout fehlgeschlagen');
			}

			const { url, sessionId } = await response.json();

			if (url) {
				window.location.href = url;
			} else if (sessionId) {
				const stripe = await loadStripe(PUBLIC_STRIPE_PUBLISHABLE_KEY);
				const { error: stripeError } = await stripe!.redirectToCheckout({ sessionId });
				if (stripeError) throw stripeError;
			}
		} catch (err: any) {
			error = err.message;
			loading = false;
		}
	}
</script>

<div class="card {recommended ? 'border-primary border-2' : 'border'}">
	{#if recommended}
		<div class="badge badge-primary absolute -top-3 left-1/2 -translate-x-1/2">Empfohlen</div>
	{/if}

	<div class="card-body">
		<h2 class="card-title justify-center">{title}</h2>

		<div class="my-4 text-center">
			<span class="text-4xl font-bold">{price}</span>
			<span class="text-gray-600">/{interval === 'year' ? 'Jahr' : 'Monat'}</span>
		</div>

		<ul class="mb-6 space-y-2">
			{#each features as feature}
				<li class="flex items-center gap-2">
					<svg class="text-success h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"
						></path>
					</svg>
					{feature}
				</li>
			{/each}
		</ul>

		{#if error}
			<div class="alert alert-error mb-4">
				<span>{error}</span>
			</div>
		{/if}

		<button
			class="btn {recommended ? 'btn-primary' : 'btn-outline'} w-full"
			on:click={handleCheckout}
			disabled={loading}
		>
			{#if loading}
				<span class="loading loading-spinner"></span>
				Lädt...
			{:else}
				Jetzt upgraden
			{/if}
		</button>
	</div>
</div>
```

### 6. Hooks for Protection

```typescript
// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { SubscriptionService } from '$lib/server/subscription';

export const handle: Handle = async ({ event, resolve }) => {
	// Check subscription for API routes
	if (event.url.pathname.startsWith('/api/links') && event.request.method === 'POST') {
		if (!event.locals.pb.authStore.isValid) {
			return new Response('Unauthorized', { status: 401 });
		}

		const service = new SubscriptionService(event.locals.pb);
		const userId = event.locals.pb.authStore.model?.id;
		const { allowed, reason } = await service.canCreateLink(userId);

		if (!allowed) {
			return new Response(
				JSON.stringify({
					error: reason,
					requiresUpgrade: true
				}),
				{
					status: 403,
					headers: { 'Content-Type': 'application/json' }
				}
			);
		}
	}

	return resolve(event);
};
```

### 7. Account Management Page

```svelte
<!-- src/routes/account/+page.svelte -->
<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	export let data;

	let loadingPortal = false;

	async function openCustomerPortal() {
		loadingPortal = true;

		try {
			const response = await fetch('/api/stripe/portal', {
				method: 'POST'
			});

			const { url } = await response.json();
			if (url) {
				window.location.href = url;
			}
		} catch (error) {
			console.error('Portal error:', error);
		} finally {
			loadingPortal = false;
		}
	}

	$: isPro = data.user?.subscription_status === 'pro';
	$: nextBillingDate = data.user?.current_period_end
		? new Date(data.user.current_period_end).toLocaleDateString('de-DE')
		: null;
</script>

<div class="container mx-auto p-4">
	<h1 class="mb-6 text-2xl font-bold">Account Einstellungen</h1>

	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title">Subscription Status</h2>

			<div class="stats shadow">
				<div class="stat">
					<div class="stat-title">Aktueller Plan</div>
					<div class="stat-value text-primary">
						{isPro ? 'Pro' : 'Free'}
					</div>
					{#if nextBillingDate}
						<div class="stat-desc">Nächste Zahlung: {nextBillingDate}</div>
					{/if}
				</div>

				{#if !isPro}
					<div class="stat">
						<div class="stat-title">Links diesen Monat</div>
						<div class="stat-value">{data.usage?.used || 0}/10</div>
						<div class="stat-desc">
							Reset in {data.usage?.daysUntilReset || 0} Tagen
						</div>
					</div>
				{/if}
			</div>

			<div class="card-actions mt-4 justify-end">
				{#if isPro}
					<button class="btn btn-primary" on:click={openCustomerPortal} disabled={loadingPortal}>
						{#if loadingPortal}
							<span class="loading loading-spinner"></span>
						{/if}
						Abo verwalten
					</button>
				{:else}
					<a href="/pricing" class="btn btn-primary"> Upgrade to Pro </a>
				{/if}
			</div>
		</div>
	</div>
</div>
```

### 8. Testing Utilities

```typescript
// src/lib/server/stripe-test.ts
import type { PocketBase } from 'pocketbase';

export async function createTestSubscription(pb: PocketBase, userId: string) {
	// Simulate Pro subscription for testing
	await pb.collection('users').update(userId, {
		subscription_status: 'pro',
		stripe_customer_id: 'cus_test_' + Date.now(),
		stripe_subscription_id: 'sub_test_' + Date.now(),
		current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
	});
}

export async function simulateWebhook(eventType: string, data: any) {
	const response = await fetch('/api/stripe/webhook', {
		method: 'POST',
		headers: {
			'stripe-signature': 'test_signature',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			type: eventType,
			data: { object: data }
		})
	});

	return response;
}
```

### 9. Migration Script

```typescript
// scripts/migrate-to-stripe.ts
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function addStripeFields() {
	// Get users collection
	const collection = await pb.collections.getOne('users');

	// Add new fields
	const updatedSchema = [
		...collection.schema,
		{
			name: 'subscription_status',
			type: 'select',
			options: {
				values: ['free', 'pro', 'cancelled', 'past_due']
			},
			required: true
		},
		{
			name: 'stripe_customer_id',
			type: 'text',
			required: false
		},
		{
			name: 'stripe_subscription_id',
			type: 'text',
			required: false
		},
		{
			name: 'current_period_end',
			type: 'date',
			required: false
		},
		{
			name: 'links_created_this_month',
			type: 'number',
			min: 0,
			required: true
		},
		{
			name: 'monthly_reset_date',
			type: 'date',
			required: false
		}
	];

	// Update collection
	await pb.collections.update('users', {
		schema: updatedSchema
	});

	console.log('✅ Migration completed');
}

addStripeFields().catch(console.error);
```

## Usage Examples

### Check subscription before action

```typescript
// In your API route
const service = new SubscriptionService(locals.pb);
const { allowed, reason } = await service.canCreateLink(userId);

if (!allowed) {
	return json({ error: reason, requiresUpgrade: true }, { status: 403 });
}
```

### Display usage in UI

```svelte
{#if $page.data.usage && !$page.data.usage.unlimited}
	<div class="alert alert-info">
		Du hast {$page.data.usage.used} von {$page.data.usage.limit} Links erstellt
	</div>
{/if}
```

### Handle upgrade flow

```typescript
try {
	const response = await createLink(data);
	// Success
} catch (error) {
	if (error.requiresUpgrade) {
		goto('/pricing');
	}
}
```
