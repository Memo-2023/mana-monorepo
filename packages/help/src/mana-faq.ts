/**
 * Shared Mana/Credits FAQ content
 * Reusable across all apps that have a /mana subscription page
 */

import type { FAQItem, FeatureItem } from './content.js';

/**
 * Returns shared FAQ items explaining the Mana credit system.
 * Apps can spread these into their help content's faq array.
 *
 * @example
 * ```ts
 * import { getManaFAQs } from './content';
 *
 * export function getMyAppHelpContent(locale: string): HelpContent {
 *   return {
 *     faq: [
 *       ...appSpecificFaqs,
 *       ...getManaFAQs(locale),
 *     ],
 *     ...
 *   };
 * }
 * ```
 */
export function getManaFAQs(locale: string): FAQItem[] {
	const isDE = locale === 'de';

	return [
		{
			id: 'faq-mana-what',
			question: isDE ? 'Was ist Mana?' : 'What is Mana?',
			answer: isDE
				? '<p><strong>Mana</strong> ist die universelle Währung im Mana-Ökosystem. Mit Mana bezahlst du für Premium-Funktionen wie KI-Generierungen, Cloud-Modelle und erweiterte Features — app-übergreifend mit einem einzigen Guthaben.</p><ul><li>1 Mana ≈ 1 Cent (im Abo)</li><li>Dein Guthaben gilt in <strong>allen Mana-Apps</strong></li><li>Jede App zeigt deinen aktuellen Stand unter <strong>Mana</strong> im Account-Menü</li></ul>'
				: '<p><strong>Mana</strong> is the universal currency in the Mana ecosystem. With Mana you pay for premium features like AI generations, cloud models, and advanced features — across all apps with a single balance.</p><ul><li>1 Mana ≈ 1 cent (with subscription)</li><li>Your balance works across <strong>all Mana apps</strong></li><li>Each app shows your current balance under <strong>Mana</strong> in the account menu</li></ul>',
			category: 'billing',
			order: 90,
			language: isDE ? 'de' : 'en',
			featured: true,
			tags: isDE
				? ['mana', 'credits', 'guthaben', 'währung']
				: ['mana', 'credits', 'balance', 'currency'],
		},
		{
			id: 'faq-mana-get',
			question: isDE ? 'Wie bekomme ich Mana?' : 'How do I get Mana?',
			answer: isDE
				? '<p>Es gibt drei Wege, Mana zu erhalten:</p><ul><li><strong>Free-Tier</strong>: Jeder Nutzer erhält <strong>50 Mana/Monat</strong> kostenlos</li><li><strong>Mana Quelle</strong> (Abo): Monatliche Mana-Pakete von 500 bis 10.000 Mana (ab 4,99€/Monat, 20% Jahresrabatt)</li><li><strong>Mana Trank</strong> (Einmalkauf): Sofort-Pakete von 350 bis 2.800 Mana (ab 4,90€)</li></ul><p>Abonnenten können außerdem Mana an andere Nutzer <strong>verschenken</strong>.</p>'
				: '<p>There are three ways to get Mana:</p><ul><li><strong>Free tier</strong>: Every user receives <strong>50 Mana/month</strong> for free</li><li><strong>Mana Source</strong> (subscription): Monthly Mana packages from 500 to 10,000 Mana (from €4.99/month, 20% yearly discount)</li><li><strong>Mana Potion</strong> (one-time purchase): Instant packages from 350 to 2,800 Mana (from €4.90)</li></ul><p>Subscribers can also <strong>gift</strong> Mana to other users.</p>',
			category: 'billing',
			order: 91,
			language: isDE ? 'de' : 'en',
			tags: isDE
				? ['mana', 'kaufen', 'abo', 'kostenlos', 'stream', 'trank']
				: ['mana', 'buy', 'subscription', 'free', 'stream', 'potion'],
		},
		{
			id: 'faq-mana-use',
			question: isDE ? 'Wofür wird Mana verwendet?' : 'What is Mana used for?',
			answer: isDE
				? '<p>Mana wird für Premium-Funktionen innerhalb der Mana-Apps verwendet:</p><ul><li><strong>Chat</strong>: Cloud-KI-Modelle (Claude, GPT, DeepSeek) — lokale Modelle sind kostenlos</li><li><strong>Picture</strong>: KI-Bildgenerierungen (nach 3 kostenlosen Generierungen)</li><li><strong>Context</strong>: KI-Textgenerierung und -analyse</li><li><strong>Weitere Apps</strong>: KI-gestützte Features in Planta, Questions, etc.</li></ul><p>Basis-Funktionen wie Aufgaben, Kalender, Kontakte, Dateien und Chats mit lokalen Modellen sind <strong>immer kostenlos</strong>.</p>'
				: '<p>Mana is used for premium features within Mana apps:</p><ul><li><strong>Chat</strong>: Cloud AI models (Claude, GPT, DeepSeek) — local models are free</li><li><strong>Picture</strong>: AI image generations (after 3 free generations)</li><li><strong>Context</strong>: AI text generation and analysis</li><li><strong>More apps</strong>: AI-powered features in Planta, Questions, etc.</li></ul><p>Core features like tasks, calendar, contacts, files, and chats with local models are <strong>always free</strong>.</p>',
			category: 'billing',
			order: 92,
			language: isDE ? 'de' : 'en',
			tags: isDE
				? ['mana', 'verbrauch', 'kosten', 'kostenlos']
				: ['mana', 'usage', 'costs', 'free'],
		},
	];
}

/**
 * Returns a shared feature item for the Mana credit system.
 */
export function getManaFeature(locale: string): FeatureItem {
	const isDE = locale === 'de';

	return {
		id: 'feature-mana',
		title: isDE ? 'Mana-Credits' : 'Mana Credits',
		description: isDE
			? 'Universelles Guthaben für Premium-Features in allen Mana-Apps — 150 Mana/Monat kostenlos.'
			: 'Universal balance for premium features across all Mana apps — 150 Mana/month for free.',
		icon: '✨',
		category: 'core',
		highlights: isDE
			? ['150 Mana/Monat kostenlos', 'App-übergreifend', 'Abos & Einmalkäufe', 'Mana verschenken']
			: ['150 Mana/month free', 'Cross-app', 'Subscriptions & one-time', 'Gift Mana'],
		content: '',
		order: 99,
		language: isDE ? 'de' : 'en',
	};
}
