/**
 * A/B Testing Variant Configurations
 * Defines content and styling for each variant using multilingual messages
 */

import * as m from '$paraglide/messages';

export interface VariantContent {
	id: string;
	name: string;
	headline: string;
	subheadline: string;
	ctaText: string;
	ctaStyle?: string;
	features?: string[];
	socialProof?: {
		type: 'numbers' | 'logos' | 'testimonial';
		content: string;
	};
	layout?: 'standard' | 'split' | 'centered';
}

// Get variant content with multilingual support
export function getVariantContent(variantId: string): VariantContent {
	switch (variantId) {
		case 'control':
			return {
				id: 'control',
				name: 'Control (Baseline)',
				headline: m.hero_control_headline(),
				subheadline: m.hero_control_subheadline(),
				ctaText: m.hero_control_cta(),
				ctaStyle: 'bg-theme-primary hover:bg-theme-primary-hover',
				layout: 'standard',
			};

		// Variant A - Value Focused
		case 'a1':
			return {
				id: 'a1',
				name: 'Value Generic',
				headline: m.hero_a1_headline(),
				subheadline: m.hero_a1_subheadline(),
				ctaText: m.hero_a1_cta(),
				ctaStyle: 'bg-blue-600 hover:bg-blue-700',
				features: [m.hero_a1_feature_1(), m.hero_a1_feature_2(), m.hero_a1_feature_3()],
				layout: 'standard',
			};

		case 'a2':
			return {
				id: 'a2',
				name: 'Value Specific',
				headline: 'Save 3 Hours Per Week on Link Management',
				subheadline: 'Join teams who reduced their link management tasks by 75%',
				ctaText: 'Calculate Your Savings',
				ctaStyle:
					'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700',
				features: ['3 hours saved weekly', '75% faster workflows', 'ROI in 2 weeks'],
				layout: 'standard',
			};

		case 'a3':
			return {
				id: 'a3',
				name: 'Value Transform',
				headline: 'Your Links, 10x More Powerful',
				subheadline: 'Transform every URL into a conversion machine with analytics and automation',
				ctaText: 'Unlock Link Power →',
				ctaStyle: 'bg-black hover:bg-gray-800',
				features: ['10x more clicks', 'Conversion tracking', 'Smart redirects'],
				layout: 'centered',
			};

		// Variant B - Social Proof
		case 'b1':
			return {
				id: 'b1',
				name: 'Social Numbers',
				headline: m.hero_b1_headline(),
				subheadline: m.hero_b1_subheadline(),
				ctaText: m.hero_b1_cta(),
				ctaStyle: 'bg-purple-600 hover:bg-purple-700',
				socialProof: {
					type: 'numbers',
					content: m.hero_b1_social(),
				},
				layout: 'standard',
			};

		case 'b2':
			return {
				id: 'b2',
				name: 'Social Logos',
				headline: 'Trusted by Google, Meta, and Microsoft Teams',
				subheadline: 'Enterprise-grade URL management for companies of all sizes',
				ctaText: 'See Why They Chose Us',
				ctaStyle:
					'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
				socialProof: {
					type: 'logos',
					content: 'Google • Meta • Microsoft • Spotify • Netflix',
				},
				layout: 'standard',
			};

		case 'b3':
			return {
				id: 'b3',
				name: 'Social Testimonial',
				headline: 'Rated #1 URL Shortener by Marketing Teams',
				subheadline: '"uLoad saved us 5 hours per week and increased our CTR by 40%"',
				ctaText: 'Read Success Stories',
				ctaStyle: 'bg-green-600 hover:bg-green-700',
				socialProof: {
					type: 'testimonial',
					content: '⭐⭐⭐⭐⭐ 4.9/5 from 1,000+ reviews',
				},
				layout: 'centered',
			};

		// Variant C - Feature Focused
		case 'c1':
			return {
				id: 'c1',
				name: 'Features All-in-One',
				headline: m.hero_c1_headline(),
				subheadline: m.hero_c1_subheadline(),
				ctaText: m.hero_c1_cta(),
				ctaStyle: 'bg-indigo-600 hover:bg-indigo-700',
				features: [
					m.hero_c1_feature_1(),
					m.hero_c1_feature_2(),
					m.hero_c1_feature_3(),
					m.hero_c1_feature_4(),
					m.hero_c1_feature_5(),
					m.hero_c1_feature_6(),
				],
				layout: 'standard',
			};

		case 'c2':
			return {
				id: 'c2',
				name: 'Features QR Focus',
				headline: 'QR Codes That Actually Convert',
				subheadline: 'Create dynamic QR codes with real-time analytics and custom branding',
				ctaText: 'Create Your First QR Code',
				ctaStyle: 'bg-orange-600 hover:bg-orange-700',
				features: ['Dynamic QR codes', 'Custom designs', 'Scan analytics', 'Bulk generation'],
				layout: 'split',
			};

		case 'c3':
			return {
				id: 'c3',
				name: 'Features Integration',
				headline: 'Works With Your Favorite Tools',
				subheadline: 'Seamless integration with Zapier, Slack, WordPress & 100+ platforms',
				ctaText: 'Connect Your Tools',
				ctaStyle: 'bg-teal-600 hover:bg-teal-700',
				features: [
					'Zapier automation',
					'Slack notifications',
					'WordPress plugin',
					'API & Webhooks',
				],
				layout: 'standard',
			};

		// Default to control
		default:
			return {
				id: 'control',
				name: 'Control (Baseline)',
				headline: m.hero_control_headline(),
				subheadline: m.hero_control_subheadline(),
				ctaText: m.hero_control_cta(),
				ctaStyle: 'bg-theme-primary hover:bg-theme-primary-hover',
				layout: 'standard',
			};
	}
}

// Get all active variant IDs
export function getActiveVariantIds(): string[] {
	return ['control', 'a1', 'a2', 'a3', 'b1', 'b2', 'b3', 'c1', 'c2', 'c3'];
}

// Check if variant exists
export function isValidVariant(variantId: string): boolean {
	return getActiveVariantIds().includes(variantId);
}

// Get trust badges with translations
export function getTrustBadges(): Array<{ icon: string; text: string }> {
	return [
		{ icon: '🔒', text: m.hero_trust_badge_1() },
		{ icon: '🇪🇺', text: m.hero_trust_badge_2() },
		{ icon: '⚡', text: m.hero_trust_badge_3() },
		{ icon: '🚀', text: m.hero_trust_badge_4() },
	];
}

// Get free text
export function getFreeText(): string {
	return m.hero_free_text();
}
