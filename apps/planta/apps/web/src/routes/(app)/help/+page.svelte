<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { HelpPage, getHelpTranslations } from '@manacore/shared-help-ui';
	import { getPlantaHelpContent } from '$lib/content/help/index.js';

	const content = $derived(getPlantaHelpContent($locale ?? 'de'));
	const translations = $derived(
		getHelpTranslations($locale ?? 'de', {
			subtitle:
				$locale === 'de'
					? 'Finde Antworten und lerne Planta kennen'
					: 'Find answers and learn how to use Planta',
		})
	);
</script>

<svelte:head>
	<title>{translations.title} | Planta</title>
</svelte:head>

<HelpPage
	{content}
	appName="Planta"
	appId="planta"
	{translations}
	showBackButton
	onBack={() => goto('/dashboard')}
	showGettingStarted={false}
	showChangelog={false}
	defaultSection="faq"
/>
