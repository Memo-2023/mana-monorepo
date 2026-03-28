<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { HelpPage, getHelpTranslations } from '@manacore/help';
	import { getContactsHelpContent } from '$lib/content/help/index.js';

	const content = $derived(getContactsHelpContent($locale ?? 'en'));
	const translations = $derived(
		getHelpTranslations($locale ?? 'en', {
			subtitle:
				$locale === 'de'
					? 'Finde Antworten und lerne die App kennen'
					: 'Find answers and learn how to use the app',
		})
	);
</script>

<svelte:head>
	<title>{translations.title} | Contacts</title>
</svelte:head>

<HelpPage
	{content}
	appName="Contacts"
	appId="contacts"
	{translations}
	showBackButton
	onBack={() => goto('/')}
	showGettingStarted={false}
	showChangelog={false}
	defaultSection="faq"
/>
