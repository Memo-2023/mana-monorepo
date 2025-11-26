import Stripe from 'stripe';
import { env } from '$env/dynamic/private';

// Initialize Stripe only when the secret key is available
export const getStripe = () => {
	const secretKey = env.STRIPE_SECRET_KEY;
	if (!secretKey) {
		throw new Error('STRIPE_SECRET_KEY is not configured');
	}
	return new Stripe(secretKey, {
		apiVersion: '2025-07-30.basil',
		typescript: true
	});
};

export const STRIPE_CONFIG = {
	productId: env.STRIPE_PRODUCT_ID,
	prices: {
		monthly: env.STRIPE_PRICE_MONTHLY,
		yearly: env.STRIPE_PRICE_YEARLY,
		lifetime: env.STRIPE_PRICE_LIFETIME
	}
};
