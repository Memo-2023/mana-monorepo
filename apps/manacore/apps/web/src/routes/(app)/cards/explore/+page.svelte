<script lang="ts">
	import { MagnifyingGlass } from '@manacore/shared-icons';
</script>

<svelte:head>
	<title>Entdecken - Cards - ManaCore</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-foreground">Entdecken</h1>
		<p class="text-muted-foreground mt-1 text-sm">Offentliche Decks aus der Community entdecken</p>
	</div>

	<div class="rounded-xl border border-border bg-card">
		<div class="py-16 text-center">
			<div
				class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
			>
				<MagnifyingGlass size={32} class="text-primary" />
			</div>
			<h3 class="mb-2 text-xl font-semibold text-foreground">Entdecken-Feature</h3>
			<p class="text-muted-foreground">Offentliche Decks durchsuchen und entdecken — kommt bald!</p>
		</div>
	</div>
</div>
