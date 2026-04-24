<script lang="ts">
	import { RoutePage } from '$lib/components/shell';
	import StoryForm from '$lib/modules/comic/components/StoryForm.svelte';
</script>

<svelte:head>
	<title>Neuer Comic · Mana</title>
</svelte:head>

<RoutePage appId="comic" backHref="/comic">
	<div class="mx-auto max-w-2xl space-y-4 p-4 sm:p-6">
		<header class="space-y-1">
			<h1 class="text-lg font-semibold text-foreground">Neuer Comic</h1>
			<p class="text-sm text-muted-foreground">
				Wähle Stil + Protagonist, dann startest du mit dem ersten Panel.
			</p>
		</header>
		<StoryForm />
	</div>
</RoutePage>
