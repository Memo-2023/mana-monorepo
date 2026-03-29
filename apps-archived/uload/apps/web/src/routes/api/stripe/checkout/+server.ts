import { json } from '@sveltejs/kit';
import { getStripe } from '$lib/server/stripe';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

// Map our locale codes to Stripe's expected format
function mapLocaleToStripe(locale: string): any {
	const stripeLocales: Record<string, any> = {
		en: 'en',
		de: 'de',
		it: 'it',
		fr: 'fr',
		es: 'es',
	};
	return stripeLocales[locale] || 'auto';
}

export const POST: RequestHandler = async ({ request, locals, url }) => {
	try {
		// Check if user is authenticated
		if (!locals.pb.authStore.isValid || !locals.user) {
			return json({ error: 'Bitte erst einloggen' }, { status: 401 });
		}

		const user = locals.user;
		const { priceType = 'monthly', locale = 'en' } = await request.json();

		// Check if user already has active subscription
		if (user.subscription_status === 'pro') {
			return json({ error: 'Du hast bereits ein aktives Abo' }, { status: 400 });
		}

		// Select the correct price ID
		let priceId: string;
		let mode: 'subscription' | 'payment' = 'subscription';

		switch (priceType) {
			case 'yearly':
				priceId = env.STRIPE_PRICE_YEARLY;
				break;
			case 'lifetime':
				priceId = env.STRIPE_PRICE_LIFETIME;
				mode = 'payment'; // One-time payment for lifetime
				break;
			case 'monthly':
			default:
				priceId = env.STRIPE_PRICE_MONTHLY;
				break;
		}

		if (!priceId) {
			throw new Error(`Price ID not found for type: ${priceType}`);
		}

		// Initialize Stripe
		const stripe = getStripe();

		// Create or get Stripe customer
		let stripeCustomerId = user.stripe_customer_id;

		if (!stripeCustomerId) {
			const customer = await stripe.customers.create({
				email: user.email,
				name: user.name || undefined,
				metadata: {
					pocketbase_id: user.id,
					username: user.username || '',
				},
			});

			stripeCustomerId = customer.id;

			// Save customer ID to PocketBase
			await locals.pb.collection('users').update(user.id, {
				stripe_customer_id: stripeCustomerId,
			});
		}

		// Create Stripe Checkout session
		const session = await stripe.checkout.sessions.create({
			customer: stripeCustomerId,
			payment_method_types: ['card', 'sepa_debit'],
			billing_address_collection: 'required',
			line_items: [
				{
					price: priceId,
					quantity: 1,
				},
			],
			mode,
			allow_promotion_codes: true,
			success_url: `${url.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${url.origin}/pricing?cancelled=true`,
			locale: mapLocaleToStripe(locale),
			metadata: {
				user_id: user.id,
				user_email: user.email,
				price_type: priceType,
			},
			...(mode === 'subscription' && {
				subscription_data: {
					metadata: {
						pocketbase_user_id: user.id,
					},
				},
			}),
		});

		return json({
			sessionId: session.id,
			url: session.url,
		});
	} catch (error) {
		console.error('Stripe checkout error:', error);
		return json(
			{
				error:
					error instanceof Error ? error.message : 'Fehler beim Erstellen der Checkout-Session',
			},
			{ status: 500 }
		);
	}
};
