<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { WarningCircle, ArrowLeft, House } from '@manacore/shared-icons';
</script>

<svelte:head>
	<title>{$page.status} - Manalink</title>
</svelte:head>

<div class="flex h-screen flex-col items-center justify-center gap-6 bg-background p-4">
	<div class="rounded-full bg-red-500/10 p-4">
		<WarningCircle class="h-16 w-16 text-red-500" />
	</div>

	<div class="text-center">
		<h1 class="text-4xl font-bold text-foreground">{$page.status}</h1>
		<p class="mt-2 max-w-md text-muted-foreground">
			{#if $page.status === 404}
				Diese Seite wurde nicht gefunden.
			{:else}
				Ein unerwarteter Fehler ist aufgetreten.
			{/if}
		</p>
		{#if $page.error?.message}
			<p class="mt-1 text-sm text-muted-foreground/70">{$page.error.message}</p>
		{/if}
	</div>

	<div class="flex gap-3">
		<button
			class="flex items-center gap-2 rounded-xl px-4 py-2 font-medium glass-button"
			onclick={() => history.back()}
		>
			<ArrowLeft class="h-4 w-4" />
			Zurück
		</button>
		<button
			class="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2 font-medium text-white shadow-md hover:shadow-lg transition-all"
			onclick={() => goto('/chat')}
		>
			<House class="h-4 w-4" />
			Startseite
		</button>
	</div>
</div>
