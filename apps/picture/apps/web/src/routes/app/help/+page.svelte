<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { HelpPage } from '@manacore/shared-help-ui';
	import type { HelpPageTranslations } from '@manacore/shared-help-ui';
	import { getPictureHelpContent } from '$lib/content/help/index.js';

	const content = $derived(getPictureHelpContent($locale ?? 'de'));

	const translations: HelpPageTranslations = $derived(
		$locale === 'de'
			? {
					title: 'Hilfe & Support',
					subtitle: 'Finde Antworten und lerne Picture kennen',
					searchPlaceholder: 'Hilfe durchsuchen...',
					sections: {
						faq: 'FAQ',
						features: 'Features',
						shortcuts: 'Tastenkürzel',
						gettingStarted: 'Erste Schritte',
						changelog: 'Änderungen',
						contact: 'Kontakt',
					},
					search: {
						noResults: 'Keine Ergebnisse für "{query}"',
						resultsCount: '{count} Ergebnisse',
						searching: 'Suche...',
					},
					faq: {
						noItems: 'Keine häufigen Fragen verfügbar.',
						allCategories: 'Alle',
						categories: {
							general: 'Allgemein',
							account: 'Konto',
							billing: 'Abrechnung',
							features: 'Funktionen',
							technical: 'Technisch',
							privacy: 'Datenschutz',
						},
					},
					features: {
						noItems: 'Keine Features verfügbar.',
						comingSoon: 'Demnächst',
						learnMore: 'Mehr erfahren',
					},
					shortcuts: {
						noItems: 'Keine Tastenkürzel verfügbar.',
						columns: { shortcut: 'Kürzel', action: 'Aktion', description: 'Beschreibung' },
					},
					gettingStarted: {
						noItems: 'Keine Anleitungen verfügbar.',
						estimatedTime: 'Geschätzte Zeit',
						difficulty: {
							beginner: 'Einsteiger',
							intermediate: 'Fortgeschritten',
							advanced: 'Experte',
						},
					},
					changelog: {
						noItems: 'Keine Änderungen verfügbar.',
						showAll: 'Alle Versionen anzeigen',
						types: { major: 'Hauptversion', minor: 'Nebenversion', patch: 'Patch', beta: 'Beta' },
						labels: {
							features: 'Neue Funktionen',
							improvements: 'Verbesserungen',
							bugFixes: 'Fehlerbehebungen',
						},
					},
					contact: {
						noInfo: 'Keine Kontaktinformationen verfügbar.',
						email: 'E-Mail senden',
						responseTime: 'Antwortzeit',
					},
					common: { back: 'Zurück', showMore: 'Mehr anzeigen', showLess: 'Weniger anzeigen' },
				}
			: {
					title: 'Help & Support',
					subtitle: 'Find answers and learn how to use Picture',
					searchPlaceholder: 'Search help...',
					sections: {
						faq: 'FAQ',
						features: 'Features',
						shortcuts: 'Shortcuts',
						gettingStarted: 'Getting Started',
						changelog: 'Changelog',
						contact: 'Contact',
					},
					search: {
						noResults: 'No results for "{query}"',
						resultsCount: '{count} results',
						searching: 'Searching...',
					},
					faq: {
						noItems: 'No FAQs available.',
						allCategories: 'All',
						categories: {
							general: 'General',
							account: 'Account',
							billing: 'Billing',
							features: 'Features',
							technical: 'Technical',
							privacy: 'Privacy',
						},
					},
					features: {
						noItems: 'No features available.',
						comingSoon: 'Coming Soon',
						learnMore: 'Learn More',
					},
					shortcuts: {
						noItems: 'No shortcuts available.',
						columns: { shortcut: 'Shortcut', action: 'Action', description: 'Description' },
					},
					gettingStarted: {
						noItems: 'No guides available.',
						estimatedTime: 'Estimated time',
						difficulty: {
							beginner: 'Beginner',
							intermediate: 'Intermediate',
							advanced: 'Advanced',
						},
					},
					changelog: {
						noItems: 'No changelog available.',
						showAll: 'Show all releases',
						types: { major: 'Major', minor: 'Minor', patch: 'Patch', beta: 'Beta' },
						labels: {
							features: 'New Features',
							improvements: 'Improvements',
							bugFixes: 'Bug Fixes',
						},
					},
					contact: {
						noInfo: 'No contact info available.',
						email: 'Send email',
						responseTime: 'Response time',
					},
					common: { back: 'Back', showMore: 'Show more', showLess: 'Show less' },
				}
	);
</script>

<svelte:head>
	<title>{translations.title} | Picture</title>
</svelte:head>

<HelpPage
	{content}
	appName="Picture"
	appId="picture"
	{translations}
	showBackButton
	onBack={() => goto('/app/gallery')}
	showGettingStarted={false}
	showChangelog={false}
	defaultSection="faq"
/>
