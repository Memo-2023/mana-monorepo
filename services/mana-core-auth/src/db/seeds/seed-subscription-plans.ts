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
 *   1. Create products and prices in Stripe Dashboard
 *   2. Set STRIPE_* environment variables with the price IDs
 *
 * Stripe Products to create:
 *   - Mana Free (price: 0 EUR)
 *   - Mana Pro (prices: 9.99 EUR/month, 99 EUR/year)
 *   - Mana Enterprise (contact sales)
 */

import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { plans } from '../schema/subscriptions.schema';

// Environment configuration
const DATABASE_URL =
	process.env.DATABASE_URL || 'postgresql://manacore:manacore@localhost:5432/manacore_auth';

// Stripe Price IDs from environment (or defaults for development)
const STRIPE_CONFIG = {
	// Free plan (no Stripe price needed)
	FREE_PRODUCT_ID: process.env.STRIPE_FREE_PRODUCT_ID || '',

	// Pro plan
	PRO_PRODUCT_ID: process.env.STRIPE_PRO_PRODUCT_ID || '',
	PRO_PRICE_MONTHLY: process.env.STRIPE_PRO_PRICE_MONTHLY || '', // e.g., price_xxx
	PRO_PRICE_YEARLY: process.env.STRIPE_PRO_PRICE_YEARLY || '', // e.g., price_xxx

	// Enterprise plan
	ENTERPRISE_PRODUCT_ID: process.env.STRIPE_ENTERPRISE_PRODUCT_ID || '',
	ENTERPRISE_PRICE_MONTHLY: process.env.STRIPE_ENTERPRISE_PRICE_MONTHLY || '',
	ENTERPRISE_PRICE_YEARLY: process.env.STRIPE_ENTERPRISE_PRICE_YEARLY || '',
};

// Plan definitions
const PLANS = [
	{
		name: 'Free',
		description: 'Kostenlos starten mit grundlegenden Features',
		monthlyCredits: 150,
		priceMonthlyEuroCents: 0,
		priceYearlyEuroCents: 0,
		stripePriceIdMonthly: null,
		stripePriceIdYearly: null,
		stripeProductId: STRIPE_CONFIG.FREE_PRODUCT_ID || null,
		features: [
			'150 Credits pro Monat',
			'5 tägliche Gratis-Credits',
			'Zugang zu allen Apps',
			'Basis-Support',
		],
		maxTeamMembers: null,
		maxOrganizations: null,
		isDefault: true,
		isEnterprise: false,
		sortOrder: 0,
	},
	{
		name: 'Pro',
		description: 'Für Power-User mit mehr Credits und Features',
		monthlyCredits: 2000,
		priceMonthlyEuroCents: 999, // 9.99 EUR
		priceYearlyEuroCents: 9900, // 99 EUR (2 months free)
		stripePriceIdMonthly: STRIPE_CONFIG.PRO_PRICE_MONTHLY || null,
		stripePriceIdYearly: STRIPE_CONFIG.PRO_PRICE_YEARLY || null,
		stripeProductId: STRIPE_CONFIG.PRO_PRODUCT_ID || null,
		features: [
			'2.000 Credits pro Monat',
			'20 tägliche Gratis-Credits',
			'Prioritäts-Support',
			'Erweiterte AI-Modelle',
			'API-Zugang',
		],
		maxTeamMembers: 5,
		maxOrganizations: 3,
		isDefault: false,
		isEnterprise: false,
		sortOrder: 1,
	},
	{
		name: 'Enterprise',
		description: 'Für Teams und Unternehmen mit individuellen Anforderungen',
		monthlyCredits: 10000,
		priceMonthlyEuroCents: 4900, // 49 EUR
		priceYearlyEuroCents: 49000, // 490 EUR (2 months free)
		stripePriceIdMonthly: STRIPE_CONFIG.ENTERPRISE_PRICE_MONTHLY || null,
		stripePriceIdYearly: STRIPE_CONFIG.ENTERPRISE_PRICE_YEARLY || null,
		stripeProductId: STRIPE_CONFIG.ENTERPRISE_PRODUCT_ID || null,
		features: [
			'10.000 Credits pro Monat',
			'Unbegrenzte tägliche Credits',
			'Dedizierter Account Manager',
			'SLA-garantierte Verfügbarkeit',
			'Custom AI-Modelle',
			'SSO / SAML Integration',
			'Admin-Dashboard',
		],
		maxTeamMembers: null, // Unlimited
		maxOrganizations: null, // Unlimited
		isDefault: false,
		isEnterprise: true,
		sortOrder: 2,
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

		if (!STRIPE_CONFIG.PRO_PRICE_MONTHLY || !STRIPE_CONFIG.PRO_PRICE_YEARLY) {
			console.log('\n⚠️  Warning: Stripe Price IDs not configured.');
			console.log('   Set these environment variables:');
			console.log('   - STRIPE_PRO_PRODUCT_ID');
			console.log('   - STRIPE_PRO_PRICE_MONTHLY');
			console.log('   - STRIPE_PRO_PRICE_YEARLY');
			console.log('   - STRIPE_ENTERPRISE_PRODUCT_ID');
			console.log('   - STRIPE_ENTERPRISE_PRICE_MONTHLY');
			console.log('   - STRIPE_ENTERPRISE_PRICE_YEARLY');
		}
	} catch (error) {
		console.error('Error seeding plans:', error);
		process.exit(1);
	} finally {
		await client.end();
	}
}

// Run if called directly
seedPlans();
