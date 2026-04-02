<script lang="ts">
	import { _ } from 'svelte-i18n';
</script>

<svelte:head>
	<title>Offline | Inventar</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-[hsl(var(--background))] p-4">
	<div class="text-center">
		<div
			class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[hsl(var(--muted))]"
		>
			<span class="text-4xl">📦</span>
		</div>
		<h1 class="mb-2 text-2xl font-bold text-[hsl(var(--foreground))]">Offline</h1>
		<p class="mb-6 text-[hsl(var(--muted-foreground))]">
			Du bist gerade nicht mit dem Internet verbunden.
		</p>
		<button
			onclick={() => window.location.reload()}
			class="rounded-lg bg-[hsl(var(--primary))] px-6 py-3 font-medium text-[hsl(var(--primary-foreground))] transition-colors hover:opacity-90"
		>
			Erneut versuchen
		</button>
	</div>
</div>
