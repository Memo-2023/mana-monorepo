/**
 * Help content for Mana app — reads from i18n locale files.
 */

import type { HelpContent } from '@mana/help';
import { getPrivacyFAQs } from '@mana/help';
import { get } from 'svelte/store';
import { _, locale } from 'svelte-i18n';

function t(key: string): string {
	return get(_)(key) || key;
}

export function getManaHelpContent(loc?: string): HelpContent {
	const currentLocale = loc || get(locale) || 'de';

	return {
		faq: [
			{
				id: 'faq-what-is-mana',
				question: t('help.faq.what_is_mana.question'),
				answer: t('help.faq.what_is_mana.answer'),
				category: 'general',
				order: 1,
				language: currentLocale,
				tags: t('help.faq.what_is_mana.tags').split(','),
			},
			{
				id: 'faq-sso',
				question: t('help.faq.sso.question'),
				answer: t('help.faq.sso.answer'),
				category: 'account',
				order: 2,
				language: currentLocale,
				tags: t('help.faq.sso.tags').split(','),
			},
			{
				id: 'faq-organizations',
				question: t('help.faq.organizations.question'),
				answer: t('help.faq.organizations.answer'),
				category: 'features',
				order: 3,
				language: currentLocale,
				tags: t('help.faq.organizations.tags').split(','),
			},
			{
				id: 'faq-switch-apps',
				question: t('help.faq.switch_apps.question'),
				answer: t('help.faq.switch_apps.answer'),
				category: 'general',
				order: 4,
				language: currentLocale,
				tags: t('help.faq.switch_apps.tags').split(','),
			},
			...getPrivacyFAQs(currentLocale, { dataTypeDE: 'Daten', dataTypeEN: 'data' }),
		],
		features: [
			{
				id: 'feature-sso',
				title: t('help.features.sso.title'),
				description: t('help.features.sso.description'),
				icon: '🔐',
				category: 'core',
				highlights: t('help.features.sso.highlights').split(','),
				content: '',
				order: 1,
				language: currentLocale,
			},
			{
				id: 'feature-app-ecosystem',
				title: t('help.features.app_ecosystem.title'),
				description: t('help.features.app_ecosystem.description'),
				icon: '🌐',
				category: 'core',
				highlights: t('help.features.app_ecosystem.highlights').split(','),
				content: '',
				order: 2,
				language: currentLocale,
			},
			{
				id: 'feature-organizations',
				title: t('help.features.organizations.title'),
				description: t('help.features.organizations.description'),
				icon: '👥',
				category: 'advanced',
				highlights: t('help.features.organizations.highlights').split(','),
				content: '',
				order: 3,
				language: currentLocale,
			},
			{
				id: 'feature-unified-profile',
				title: t('help.features.unified_profile.title'),
				description: t('help.features.unified_profile.description'),
				icon: '👤',
				category: 'core',
				highlights: t('help.features.unified_profile.highlights').split(','),
				content: '',
				order: 4,
				language: currentLocale,
			},
		],
		shortcuts: [],
		gettingStarted: [],
		changelog: [],
		contact: {
			id: 'contact-support',
			title: t('help.contact.title'),
			content: t('help.contact.content'),
			language: currentLocale,
			order: 1,
			supportEmail: 'support@mana.how',
			documentationUrl: 'https://mana.how/docs',
			responseTime: t('help.contact.response_time'),
		},
	};
}
