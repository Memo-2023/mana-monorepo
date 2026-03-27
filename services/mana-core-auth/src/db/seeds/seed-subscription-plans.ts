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
 * Stripe Products (Live) - "Mana Quelle" subscriptions:
 *   - Mana Quelle S:   prod_UDzZl1uKIHplam (4.99€/month, 47.90€/year, 500 credits)
 *   - Mana Quelle M:   prod_UDzZXZxEVoyQMF (9.99€/month, 95.90€/year, 1000 credits)
 *   - Mana Quelle L:   prod_UDzZcDxsDS3q1T (19.99€/month, 191.90€/year, 2000 credits)
 *   - Mana Quelle XL:  prod_UDzZum6MMQkc0b (39.99€/month, 383.90€/year, 4000 credits)
 *   - Mana Quelle XXL: prod_UDzZreFcbGxdJj (99.99€/month, 959.90€/year, 10000 credits)
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

	// Mana Quelle S
	S_PRODUCT_ID: process.env.STRIPE_S_PRODUCT_ID || 'prod_UDzZl1uKIHplam',
	S_PRICE_MONTHLY: process.env.STRIPE_S_PRICE_MONTHLY || 'price_1TFXaKAZjQCYS0ZJGQFSxm8v',
	S_PRICE_YEARLY: process.env.STRIPE_S_PRICE_YEARLY || 'price_1TFXaLAZjQCYS0ZJwFnGP29S',

	// Mana Quelle M
	M_PRODUCT_ID: process.env.STRIPE_M_PRODUCT_ID || 'prod_UDzZXZxEVoyQMF',
	M_PRICE_MONTHLY: process.env.STRIPE_M_PRICE_MONTHLY || 'price_1TFXaMAZjQCYS0ZJMRmTgQvb',
	M_PRICE_YEARLY: process.env.STRIPE_M_PRICE_YEARLY || 'price_1TFXaNAZjQCYS0ZJ6AS1vRkx',

	// Mana Quelle L
	L_PRODUCT_ID: process.env.STRIPE_L_PRODUCT_ID || 'prod_UDzZcDxsDS3q1T',
	L_PRICE_MONTHLY: process.env.STRIPE_L_PRICE_MONTHLY || 'price_1TFXaNAZjQCYS0ZJaqXjJ0HC',
	L_PRICE_YEARLY: process.env.STRIPE_L_PRICE_YEARLY || 'price_1TFXaOAZjQCYS0ZJVndo98Pf',

	// Mana Quelle XL
	XL_PRODUCT_ID: process.env.STRIPE_XL_PRODUCT_ID || 'prod_UDzZum6MMQkc0b',
	XL_PRICE_MONTHLY: process.env.STRIPE_XL_PRICE_MONTHLY || 'price_1TFXaPAZjQCYS0ZJ0q7OysMg',
	XL_PRICE_YEARLY: process.env.STRIPE_XL_PRICE_YEARLY || 'price_1TFXaQAZjQCYS0ZJ6rDqh2FU',

	// Mana Quelle XXL
	XXL_PRODUCT_ID: process.env.STRIPE_XXL_PRODUCT_ID || 'prod_UDzZreFcbGxdJj',
	XXL_PRICE_MONTHLY: process.env.STRIPE_XXL_PRICE_MONTHLY || 'price_1TFXaQAZjQCYS0ZJ3A6QB2sv',
	XXL_PRICE_YEARLY: process.env.STRIPE_XXL_PRICE_YEARLY || 'price_1TFXaRAZjQCYS0ZJCuYSesCA',
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
		name: 'Mana Quelle S',
		description: '500 Mana pro Monat – Basis-Zugang zu allen ManaCore Apps',
		monthlyCredits: 500,
		priceMonthlyEuroCents: 499, // 4.99 EUR
		priceYearlyEuroCents: 4790, // 47.90 EUR (20% Rabatt)
		stripePriceIdMonthly: STRIPE_CONFIG.S_PRICE_MONTHLY || null,
		stripePriceIdYearly: STRIPE_CONFIG.S_PRICE_YEARLY || null,
		stripeProductId: STRIPE_CONFIG.S_PRODUCT_ID || null,
		features: [
			'500 Mana pro Monat',
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
		name: 'Mana Quelle M',
		description: '1.000 Mana pro Monat – Erweiterter Zugang mit mehr AI-Power',
		monthlyCredits: 1000,
		priceMonthlyEuroCents: 999, // 9.99 EUR
		priceYearlyEuroCents: 9590, // 95.90 EUR (20% Rabatt)
		stripePriceIdMonthly: STRIPE_CONFIG.M_PRICE_MONTHLY || null,
		stripePriceIdYearly: STRIPE_CONFIG.M_PRICE_YEARLY || null,
		stripeProductId: STRIPE_CONFIG.M_PRODUCT_ID || null,
		features: ['1.000 Mana pro Monat', 'Alle AI-Modelle', 'Priority-Support', 'API-Zugang'],
		maxTeamMembers: 3,
		maxOrganizations: 2,
		isDefault: false,
		isEnterprise: false,
		sortOrder: 2,
	},
	{
		name: 'Mana Quelle L',
		description: '2.000 Mana pro Monat – Premium-Zugang für Power-User',
		monthlyCredits: 2000,
		priceMonthlyEuroCents: 1999, // 19.99 EUR
		priceYearlyEuroCents: 19190, // 191.90 EUR (20% Rabatt)
		stripePriceIdMonthly: STRIPE_CONFIG.L_PRICE_MONTHLY || null,
		stripePriceIdYearly: STRIPE_CONFIG.L_PRICE_YEARLY || null,
		stripeProductId: STRIPE_CONFIG.L_PRODUCT_ID || null,
		features: [
			'2.000 Mana pro Monat',
			'Alle Premium AI-Modelle',
			'Priority-Support',
			'Erweiterte Exportoptionen',
			'API-Zugang',
		],
		maxTeamMembers: 5,
		maxOrganizations: 3,
		isDefault: false,
		isEnterprise: false,
		sortOrder: 3,
	},
	{
		name: 'Mana Quelle XL',
		description: '4.000 Mana pro Monat – Maximale Power für Teams und Profis',
		monthlyCredits: 4000,
		priceMonthlyEuroCents: 3999, // 39.99 EUR
		priceYearlyEuroCents: 38390, // 383.90 EUR (20% Rabatt)
		stripePriceIdMonthly: STRIPE_CONFIG.XL_PRICE_MONTHLY || null,
		stripePriceIdYearly: STRIPE_CONFIG.XL_PRICE_YEARLY || null,
		stripeProductId: STRIPE_CONFIG.XL_PRODUCT_ID || null,
		features: [
			'4.000 Mana pro Monat',
			'Alle Premium AI-Modelle',
			'Dedizierter Support',
			'Team-Features',
			'Unlimitierte API-Calls',
		],
		maxTeamMembers: 10,
		maxOrganizations: 5,
		isDefault: false,
		isEnterprise: false,
		sortOrder: 4,
	},
	{
		name: 'Mana Quelle XXL',
		description: '10.000 Mana pro Monat – Enterprise-Power ohne Limits',
		monthlyCredits: 10000,
		priceMonthlyEuroCents: 9999, // 99.99 EUR
		priceYearlyEuroCents: 95990, // 959.90 EUR (20% Rabatt)
		stripePriceIdMonthly: STRIPE_CONFIG.XXL_PRICE_MONTHLY || null,
		stripePriceIdYearly: STRIPE_CONFIG.XXL_PRICE_YEARLY || null,
		stripeProductId: STRIPE_CONFIG.XXL_PRODUCT_ID || null,
		features: [
			'10.000 Mana pro Monat',
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
		sortOrder: 5,
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
		console.log('   S:   ', STRIPE_CONFIG.S_PRODUCT_ID || '(not set)');
		console.log('   M:   ', STRIPE_CONFIG.M_PRODUCT_ID || '(not set)');
		console.log('   L:   ', STRIPE_CONFIG.L_PRODUCT_ID || '(not set)');
		console.log('   XL:  ', STRIPE_CONFIG.XL_PRODUCT_ID || '(not set)');
		console.log('   XXL: ', STRIPE_CONFIG.XXL_PRODUCT_ID || '(not set)');
	} catch (error) {
		console.error('Error seeding plans:', error);
		process.exit(1);
	} finally {
		await client.end();
	}
}

// Run if called directly
seedPlans();
