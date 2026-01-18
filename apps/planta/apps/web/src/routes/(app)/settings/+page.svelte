<script lang="ts">
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';

	let isDark = $derived(theme.isDark);
</script>

<svelte:head>
	<title>Einstellungen - Planta</title>
</svelte:head>

<div class="max-w-xl space-y-6">
	<h1 class="text-2xl font-bold">Einstellungen</h1>

	<!-- Theme -->
	<div class="card">
		<h2 class="font-semibold mb-4">Darstellung</h2>
		<div class="flex items-center justify-between">
			<div>
				<p class="font-medium">Dunkles Design</p>
				<p class="text-sm text-muted-foreground">Wechsle zwischen hellem und dunklem Modus</p>
			</div>
			<button
				type="button"
				class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
				class:bg-primary={isDark}
				class:bg-muted={!isDark}
				onclick={() => theme.toggleMode()}
			>
				<span
					class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
					class:translate-x-6={isDark}
					class:translate-x-1={!isDark}
				></span>
			</button>
		</div>
	</div>

	<!-- Account -->
	<div class="card">
		<h2 class="font-semibold mb-4">Konto</h2>
		<div class="space-y-4">
			<div>
				<p class="text-sm text-muted-foreground">E-Mail</p>
				<p class="font-medium">{authStore.user?.email || '-'}</p>
			</div>
		</div>
	</div>

	<!-- About -->
	<div class="card">
		<h2 class="font-semibold mb-4">Über Planta</h2>
		<p class="text-sm text-muted-foreground">
			Planta hilft dir, deine Pflanzen zu dokumentieren und zu pflegen. Mache ein Foto und die KI
			erstellt automatisch einen Steckbrief mit Pflegehinweisen und Gießvorschlägen.
		</p>
		<p class="text-sm text-muted-foreground mt-2">Version 1.0.0</p>
	</div>
</div>
