<!--
  Help — Workbench-embedded help page with FAQ, guides, and support info.
-->
<script lang="ts">
	import { locale } from 'svelte-i18n';
	import { HelpPage, getHelpTranslations } from '@mana/help';
	import { getManaHelpContent } from '$lib/content/help/index.js';

	const content = $derived(getManaHelpContent($locale ?? 'de'));
	const translations = $derived(
		getHelpTranslations($locale ?? 'de', {
			subtitle:
				$locale === 'de'
					? 'Finde Antworten und lerne Mana kennen'
					: 'Find answers and learn how to use Mana',
		})
	);
</script>

<div class="help-page">
	<HelpPage
		{content}
		appName="Mana"
		appId="mana"
		{translations}
		showBackButton={false}
		showGettingStarted={false}
		showChangelog={false}
		defaultSection="faq"
	/>
</div>

<style>
	.help-page {
		padding: 0.75rem;
		height: 100%;
		overflow-y: auto;
	}
</style>
