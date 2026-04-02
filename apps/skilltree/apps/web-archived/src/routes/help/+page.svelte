<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { HelpPage, getHelpTranslations } from '@manacore/help';
	import { getSkillTreeHelpContent } from '$lib/content/help/index.js';

	const content = $derived(getSkillTreeHelpContent($locale ?? 'de'));
	const translations = $derived(
		getHelpTranslations($locale ?? 'de', {
			subtitle:
				$locale === 'de'
					? 'Finde Antworten und lerne SkillTree kennen'
					: 'Find answers and learn how to use SkillTree',
		})
	);
</script>

<svelte:head>
	<title>{translations.title} | SkillTree</title>
</svelte:head>

<HelpPage
	{content}
	appName="SkillTree"
	appId="skilltree"
	{translations}
	showBackButton
	onBack={() => goto('/')}
	showGettingStarted={false}
	showChangelog={false}
	defaultSection="faq"
/>
