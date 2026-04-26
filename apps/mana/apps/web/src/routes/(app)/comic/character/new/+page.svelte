<script lang="ts">
	import { page } from '$app/state';
	import { RoutePage } from '$lib/components/shell';
	import CharacterBuilder from '$lib/modules/comic/components/CharacterBuilder.svelte';
	import type { ComicStyle } from '$lib/modules/comic/types';

	const VALID_STYLES: ComicStyle[] = ['comic', 'manga', 'cartoon', 'graphic-novel', 'webtoon'];

	function isValidStyle(s: string | null): s is ComicStyle {
		return s !== null && (VALID_STYLES as string[]).includes(s);
	}

	// Optional URL-param prefill — used by the Mc5 wardrobe-hook
	// ("Als Comic-Character"-Button auf einem Outfit/Garment): we land
	// here with `?prompt=wearing+the+Bühnenoutfit&style=manga`, the
	// builder picks them up as initial state. Plain user creates
	// (no params) are unaffected.
	const initialName = $derived(page.url.searchParams.get('title') ?? undefined);
	const initialAddPrompt = $derived(page.url.searchParams.get('prompt') ?? undefined);
	const styleParam = $derived(page.url.searchParams.get('style'));
	const initialStyle = $derived(isValidStyle(styleParam) ? styleParam : undefined);
</script>

<svelte:head>
	<title>Neuer Comic-Character · Mana</title>
</svelte:head>

<RoutePage appId="comic" backHref="/comic/character">
	<div class="mx-auto max-w-2xl space-y-4 p-4 sm:p-6">
		<header class="space-y-1">
			<h1 class="text-lg font-semibold text-foreground">Neuer Comic-Character</h1>
			<p class="text-sm text-muted-foreground">
				Wähle Stil + optionalen Add-Prompt — wir rendern direkt 4 Varianten zur Auswahl. Aus dem
				Detail kannst du jederzeit weitere generieren.
			</p>
		</header>
		<CharacterBuilder {initialName} {initialAddPrompt} {initialStyle} />
	</div>
</RoutePage>
