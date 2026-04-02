<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { HelpPage, getHelpTranslations } from '@manacore/help';
	import { getPictureHelpContent } from '$lib/content/help/index.js';

	const content = $derived(getPictureHelpContent($locale ?? 'de'));
	const translations = $derived(
		getHelpTranslations($locale ?? 'de', {
			subtitle:
				$locale === 'de'
					? 'Finde Antworten und lerne Picture kennen'
					: 'Find answers and learn how to use Picture',
		})
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
