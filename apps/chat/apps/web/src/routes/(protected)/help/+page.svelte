<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { HelpPage, getHelpTranslations } from '@manacore/help';
	import { getChatHelpContent } from '$lib/content/help/index.js';

	const content = $derived(getChatHelpContent($locale ?? 'de'));
	const translations = $derived(
		getHelpTranslations($locale ?? 'de', {
			subtitle:
				$locale === 'de'
					? 'Finde Antworten und lerne Chat kennen'
					: 'Find answers and learn how to use Chat',
		})
	);
</script>

<svelte:head>
	<title>{translations.title} | Chat</title>
</svelte:head>

<HelpPage
	{content}
	appName="Chat"
	appId="chat"
	{translations}
	showBackButton
	onBack={() => goto('/chat')}
	showGettingStarted={false}
	showChangelog={false}
	defaultSection="faq"
/>
