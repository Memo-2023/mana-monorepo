import { getStripe } from '$lib/server/stripe';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { RequestHandler } from './$types';
import PocketBase from 'pocketbase';

export const POST: RequestHandler = async ({ request, locals }) => {
	const body = await request.text();
	const signature = request.headers.get('stripe-signature');

	// Initialize Stripe
	const stripe = getStripe();
	const STRIPE_WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET;

	// For development without webhook secret
	if (!STRIPE_WEBHOOK_SECRET || STRIPE_WEBHOOK_SECRET === 'undefined') {
		console.warn('⚠️ No webhook secret configured - running in test mode');
		const event = JSON.parse(body);
		return handleWebhookEvent(event, locals);
	}

	if (!signature) {
		return new Response('No signature', { status: 400 });
	}

	let event: Stripe.Event;

	try {
		event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
	} catch (err: any) {
		// Webhook signature verification failed
		return new Response(`Webhook Error: ${err.message}`, { status: 400 });
	}

	return handleWebhookEvent(event, locals);
};

async function handleWebhookEvent(event: any, locals?: any) {
	// Create admin PocketBase client for webhooks
	const pb = new PocketBase(publicEnv.PUBLIC_POCKETBASE_URL);

	// Admin auth for updating users
	try {
		if (!env.POCKETBASE_ADMIN_EMAIL || !env.POCKETBASE_ADMIN_PASSWORD) {
			throw new Error(
				'Admin credentials not configured. Please set POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD environment variables.'
			);
		}

		await pb.admins.authWithPassword(env.POCKETBASE_ADMIN_EMAIL, env.POCKETBASE_ADMIN_PASSWORD);
		// Admin authenticated successfully
	} catch (error) {
		// Admin authentication failed

		// Return error response for missing credentials
		return new Response(
			JSON.stringify({
				error: 'Webhook processing failed due to configuration error',
				details: 'Admin authentication failed. Please check server configuration.',
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	}

	try {
		switch (event.type) {
			case 'checkout.session.completed': {
				const session = event.data.object;
				// Checkout completed

				const userId = session.metadata?.user_id;
				// Processing user_id from metadata

				if (!userId) {
					// No user_id in session metadata
					break;
				}

				const priceType = session.metadata?.price_type || 'monthly';

				// Handle lifetime purchase differently
				if (priceType === 'lifetime') {
					await pb.collection('users').update(userId, {
						subscription_status: 'pro',
						stripe_customer_id: session.customer,
						stripe_subscription_id: 'lifetime_' + session.id,
						current_period_end: new Date('2099-12-31').toISOString(), // Far future date
						links_created_this_month: 0,
					});
					// User purchased lifetime access
				} else {
					// Handle subscription
					if (session.subscription) {
						const stripe = getStripe();
						const subscription = await stripe.subscriptions.retrieve(
							session.subscription as string
						);

						await pb.collection('users').update(userId, {
							subscription_status: 'pro',
							stripe_customer_id: session.customer,
							stripe_subscription_id: subscription.id,
							current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
							links_created_this_month: 0,
						});
						// User upgraded to Pro
					}
				}
				break;
			}

			case 'customer.subscription.updated': {
				const subscription = event.data.object;
				// Subscription updated

				// Get user by stripe_subscription_id
				try {
					const users = await pb.collection('users').getList(1, 1, {
						filter: `stripe_subscription_id = "${subscription.id}"`,
					});

					if (users.items.length > 0) {
						const user = users.items[0];

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

						await pb.collection('users').update(user.id, {
							subscription_status: status,
							current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
						});
						// User subscription status updated
					}
				} catch (error) {
					// Error finding user for subscription
				}
				break;
			}

			case 'customer.subscription.deleted': {
				const subscription = event.data.object;
				// Subscription cancelled

				try {
					const users = await pb.collection('users').getList(1, 1, {
						filter: `stripe_subscription_id = "${subscription.id}"`,
					});

					if (users.items.length > 0) {
						const user = users.items[0];

						await pb.collection('users').update(user.id, {
							subscription_status: 'free',
							stripe_subscription_id: null,
							current_period_end: null,
						});
						// User downgraded to Free
					}
				} catch (error) {
					// Error finding user for cancelled subscription
				}
				break;
			}

			case 'invoice.payment_failed': {
				const invoice = event.data.object;
				// Payment failed

				if (invoice.subscription) {
					try {
						const users = await pb.collection('users').getList(1, 1, {
							filter: `stripe_subscription_id = "${invoice.subscription}"`,
						});

						if (users.items.length > 0) {
							const user = users.items[0];

							await pb.collection('users').update(user.id, {
								subscription_status: 'past_due',
							});
							// User payment failed - marked as past_due
						}
					} catch (error) {
						// Error handling payment failure
					}
				}
				break;
			}

			case 'invoice.payment_succeeded': {
				const invoice = event.data.object;
				// Payment succeeded

				if (invoice.subscription) {
					try {
						const users = await pb.collection('users').getList(1, 1, {
							filter: `stripe_subscription_id = "${invoice.subscription}"`,
						});

						if (users.items.length > 0) {
							const user = users.items[0];

							// Reactivate if was past_due
							if (user.subscription_status === 'past_due') {
								await pb.collection('users').update(user.id, {
									subscription_status: 'pro',
								});
								// User reactivated after payment
							}
						}
					} catch (error) {
						// Error handling payment success
					}
				}
				break;
			}

			default:
			// Unhandled event type
		}

		return new Response('Webhook processed', { status: 200 });
	} catch (error) {
		// Webhook processing error
		return new Response('Webhook processing failed', { status: 500 });
	} finally {
		pb.authStore.clear();
	}
}
