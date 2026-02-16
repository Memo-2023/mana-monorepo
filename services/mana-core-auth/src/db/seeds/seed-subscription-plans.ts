/**
 * Seed subscription plans with Stripe Price IDs
 *
 * This script creates/updates the default subscription plans in the database.
 * Plans are idempotent - running multiple times won't create duplicates.
 *
 * Usage:
 *   pnpm db:seed:plans
 *
 * Prerequisites:
 *   1. Stripe products and prices are already created via MCP
 *   2. Set STRIPE_* environment variables with the price IDs
 *
 * Stripe Products (Live):
 *   - ManaCore Plus: prod_TzNUGcq9qx9rRT (4.99€/month, 49.99€/year, 100 credits)
 *   - ManaCore Pro: prod_TzNUgWeBjT35qn (11.99€/month, 119.99€/year, 500 credits)
 *   - ManaCore Ultra: prod_TzNUE5pTbTDdbp (24.99€/month, 249.99€/year, 2000 credits)
 */

import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { plans } from '../schema/subscriptions.schema';

// Environment configuration
const DATABASE_URL =
	process.env.DATABASE_URL || 'postgresql://manacore:manacore@localhost:5432/manacore_auth';

// Stripe Price IDs from environment (with production defaults)
const STRIPE_CONFIG = {
	// Free plan (no Stripe price needed)
	FREE_PRODUCT_ID: process.env.STRIPE_FREE_PRODUCT_ID || '',

	// ManaCore Plus plan
	PLUS_PRODUCT_ID: process.env.STRIPE_PLUS_PRODUCT_ID || 'prod_TzNUGcq9qx9rRT',
	PLUS_PRICE_MONTHLY: process.env.STRIPE_PLUS_PRICE_MONTHLY || 'price_1T1OkKAZjQCYS0ZJ88m0shoN',
	PLUS_PRICE_YEARLY: process.env.STRIPE_PLUS_PRICE_YEARLY || 'price_1T1OkLAZjQCYS0ZJ4IdMzVyJ',

	// ManaCore Pro plan
	PRO_PRODUCT_ID: process.env.STRIPE_PRO_PRODUCT_ID || 'prod_TzNUgWeBjT35qn',
	PRO_PRICE_MONTHLY: process.env.STRIPE_PRO_PRICE_MONTHLY || 'price_1T1OkLAZjQCYS0ZJvyPM7Wop',
	PRO_PRICE_YEARLY: process.env.STRIPE_PRO_PRICE_YEARLY || 'price_1T1OkLAZjQCYS0ZJDbZeuOOu',

	// ManaCore Ultra plan
	ULTRA_PRODUCT_ID: process.env.STRIPE_ULTRA_PRODUCT_ID || 'prod_TzNUE5pTbTDdbp',
	ULTRA_PRICE_MONTHLY: process.env.STRIPE_ULTRA_PRICE_MONTHLY || 'price_1T1OkMAZjQCYS0ZJYCJNZtg8',
	ULTRA_PRICE_YEARLY: process.env.STRIPE_ULTRA_PRICE_YEARLY || 'price_1T1OkMAZjQCYS0ZJvCvR6Ve6',
};

// Plan definitions
const PLANS = [
	{
		name: 'Free',
		description: 'Kostenlos starten mit grundlegenden Features',
		monthlyCredits: 50,
		priceMonthlyEuroCents: 0,
		priceYearlyEuroCents: 0,
		stripePriceIdMonthly: null,
		stripePriceIdYearly: null,
		stripeProductId: STRIPE_CONFIG.FREE_PRODUCT_ID || null,
		features: [
			'50 Credits pro Monat',
			'3 tägliche Gratis-Credits',
			'Zugang zu allen Apps',
			'Community-Support',
		],
		maxTeamMembers: null,
		maxOrganizations: null,
		isDefault: true,
		isEnterprise: false,
		sortOrder: 0,
	},
	{
		name: 'Plus',
		description: 'Basis-Zugang zu allen ManaCore Apps mit AI-Credits',
		monthlyCredits: 100,
		priceMonthlyEuroCents: 499, // 4.99 EUR
		priceYearlyEuroCents: 4999, // 49.99 EUR (~2 months free)
		stripePriceIdMonthly: STRIPE_CONFIG.PLUS_PRICE_MONTHLY || null,
		stripePriceIdYearly: STRIPE_CONFIG.PLUS_PRICE_YEARLY || null,
		stripeProductId: STRIPE_CONFIG.PLUS_PRODUCT_ID || null,
		features: [
			'100 AI-Credits pro Monat',
			'Zugang zu allen Apps',
			'Chat & Bildgenerierung',
			'E-Mail Support',
		],
		maxTeamMembers: 1,
		maxOrganizations: 1,
		isDefault: false,
		isEnterprise: false,
		sortOrder: 1,
	},
	{
		name: 'Pro',
		description: 'Erweiterter Zugang mit Premium-Modellen und Priority-Support',
		monthlyCredits: 500,
		priceMonthlyEuroCents: 1199, // 11.99 EUR
		priceYearlyEuroCents: 11999, // 119.99 EUR (~2 months free)
		stripePriceIdMonthly: STRIPE_CONFIG.PRO_PRICE_MONTHLY || null,
		stripePriceIdYearly: STRIPE_CONFIG.PRO_PRICE_YEARLY || null,
		stripeProductId: STRIPE_CONFIG.PRO_PRODUCT_ID || null,
		features: [
			'500 AI-Credits pro Monat',
			'Premium AI-Modelle (GPT-4, Claude)',
			'Priority-Support',
			'API-Zugang',
			'Erweiterte Exportoptionen',
		],
		maxTeamMembers: 5,
		maxOrganizations: 3,
		isDefault: false,
		isEnterprise: false,
		sortOrder: 2,
	},
	{
		name: 'Ultra',
		description: 'Maximale Power für Power-User und Teams',
		monthlyCredits: 2000,
		priceMonthlyEuroCents: 2499, // 24.99 EUR
		priceYearlyEuroCents: 24999, // 249.99 EUR (~2 months free)
		stripePriceIdMonthly: STRIPE_CONFIG.ULTRA_PRICE_MONTHLY || null,
		stripePriceIdYearly: STRIPE_CONFIG.ULTRA_PRICE_YEARLY || null,
		stripeProductId: STRIPE_CONFIG.ULTRA_PRODUCT_ID || null,
		features: [
			'2.000 AI-Credits pro Monat',
			'Alle Premium AI-Modelle',
			'Dedizierter Support',
			'Unlimitierte API-Calls',
			'Team-Features',
			'Custom Integrationen',
		],
		maxTeamMembers: null, // Unlimited
		maxOrganizations: null, // Unlimited
		isDefault: false,
		isEnterprise: true,
		sortOrder: 3,
	},
];

async function seedPlans() {
	console.log('Seeding subscription plans...');
	console.log(`Database: ${DATABASE_URL.replace(/:[^@]+@/, ':***@')}`);

	const client = postgres(DATABASE_URL);
	const db = drizzle(client);

	try {
		for (const plan of PLANS) {
			// Check if plan exists
			const [existing] = await db.select().from(plans).where(eq(plans.name, plan.name)).limit(1);

			if (existing) {
				// Update existing plan
				await db
					.update(plans)
					.set({
						...plan,
						updatedAt: new Date(),
					})
					.where(eq(plans.id, existing.id));
				console.log(`✓ Updated plan: ${plan.name}`);
			} else {
				// Insert new plan
				await db.insert(plans).values({
					...plan,
				} as any);
				console.log(`✓ Created plan: ${plan.name}`);
			}
		}

		// List all plans
		const allPlans = await db.select().from(plans).orderBy(plans.sortOrder);
		console.log('\nAll subscription plans:');
		console.table(
			allPlans.map((p) => ({
				name: p.name,
				credits: p.monthlyCredits,
				monthly: `€${(p.priceMonthlyEuroCents / 100).toFixed(2)}`,
				yearly: `€${(p.priceYearlyEuroCents / 100).toFixed(2)}`,
				stripeMonthly: p.stripePriceIdMonthly || '(not set)',
				stripeYearly: p.stripePriceIdYearly || '(not set)',
				default: p.isDefault,
			}))
		);

		console.log('\n✅ Subscription plans seeded successfully!');

		// Info about configured Stripe products
		console.log('\n📦 Stripe Products configured:');
		console.log('   Plus:  ', STRIPE_CONFIG.PLUS_PRODUCT_ID || '(not set)');
		console.log('   Pro:   ', STRIPE_CONFIG.PRO_PRODUCT_ID || '(not set)');
		console.log('   Ultra: ', STRIPE_CONFIG.ULTRA_PRODUCT_ID || '(not set)');
	} catch (error) {
		console.error('Error seeding plans:', error);
		process.exit(1);
	} finally {
		await client.end();
	}
}

// Run if called directly
seedPlans();
