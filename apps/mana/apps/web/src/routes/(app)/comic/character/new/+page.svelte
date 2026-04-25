<script lang="ts">
	import { RoutePage } from '$lib/components/shell';
	import CharacterBuilder from '$lib/modules/comic/components/CharacterBuilder.svelte';
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
		<CharacterBuilder />
	</div>
</RoutePage>
