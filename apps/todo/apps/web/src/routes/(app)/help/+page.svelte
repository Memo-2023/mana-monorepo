<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { HelpPage, getHelpTranslations } from '@manacore/help';
	import { getTodoHelpContent } from '$lib/content/help/index.js';

	const content = $derived(getTodoHelpContent($locale ?? 'de'));
	const translations = $derived(
		getHelpTranslations($locale ?? 'de', {
			subtitle:
				$locale === 'de'
					? 'Finde Antworten und lerne Todo kennen'
					: 'Find answers and learn how to use Todo',
		})
	);
</script>

<svelte:head>
	<title>{translations.title} | Todo</title>
</svelte:head>

<HelpPage
	{content}
	appName="Todo"
	appId="todo"
	{translations}
	showBackButton
	onBack={() => goto('/')}
	showGettingStarted={false}
	showChangelog={false}
	defaultSection="faq"
/>
