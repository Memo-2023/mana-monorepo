<script lang="ts">
	import { goto } from '$app/navigation';
	import { theme } from '$lib/stores/theme.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { THEME_DEFINITIONS } from '@manacore/shared-theme';
	import type { ThemeVariant } from '@manacore/shared-theme';

	const themeVariants: ThemeVariant[] = [
		'lume',
		'nature',
		'stone',
		'ocean',
		'sunset',
		'midnight',
		'rose',
		'lavender',
	];

	async function handleLogout() {
		await authStore.signOut();
		goto('/login');
	}
</script>

<svelte:head>
	<title>Einstellungen - CityCorners</title>
</svelte:head>

<div class="space-y-8">
	<h1 class="text-2xl font-bold text-foreground">Einstellungen</h1>

	<!-- Theme Mode -->
	<section class="rounded-xl border border-border bg-background-card p-5">
		<h2 class="mb-4 text-lg font-semibold text-foreground">Erscheinungsbild</h2>

		<div class="space-y-4">
			<div>
				<label class="mb-2 block text-sm font-medium text-foreground-secondary">Modus</label>
				<div class="flex gap-2">
					{#each [{ value: 'light', label: '☀️ Hell' }, { value: 'dark', label: '🌙 Dunkel' }, { value: 'system', label: '💻 System' }] as opt}
						<button
							class="rounded-lg px-4 py-2 text-sm transition-colors {theme.mode === opt.value
								? 'bg-primary text-white'
								: 'bg-background text-foreground-secondary hover:bg-background-card-hover'}"
							onclick={() => theme.setMode(opt.value as 'light' | 'dark' | 'system')}
						>
							{opt.label}
						</button>
					{/each}
				</div>
			</div>

			<div>
				<label class="mb-2 block text-sm font-medium text-foreground-secondary">Farbschema</label>
				<div class="grid grid-cols-4 gap-2">
					{#each themeVariants as v}
						<button
							class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors {theme.variant ===
							v
								? 'bg-primary text-white'
								: 'bg-background text-foreground-secondary hover:bg-background-card-hover'}"
							onclick={() => theme.setVariant(v)}
						>
							<span>{THEME_DEFINITIONS[v]?.icon || '🎨'}</span>
							<span>{THEME_DEFINITIONS[v]?.label || v}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<!-- Account -->
	<section class="rounded-xl border border-border bg-background-card p-5">
		<h2 class="mb-4 text-lg font-semibold text-foreground">Account</h2>

		{#if authStore.isAuthenticated}
			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<span class="text-sm text-foreground-secondary">E-Mail</span>
					<span class="text-sm font-medium text-foreground">{authStore.user?.email}</span>
				</div>
				<hr class="border-border" />
				<button
					class="w-full rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/20"
					onclick={handleLogout}
				>
					Abmelden
				</button>
			</div>
		{:else}
			<div class="space-y-3">
				<p class="text-sm text-foreground-secondary">
					Melde dich an, um Favoriten zu speichern und alle Features zu nutzen.
				</p>
				<div class="flex gap-2">
					<a
						href="/login"
						class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
					>
						Anmelden
					</a>
					<a
						href="/register"
						class="rounded-lg bg-background px-4 py-2 text-sm font-medium text-foreground-secondary transition-colors hover:bg-background-card-hover"
					>
						Registrieren
					</a>
				</div>
			</div>
		{/if}
	</section>

	<!-- About -->
	<section class="rounded-xl border border-border bg-background-card p-5">
		<h2 class="mb-4 text-lg font-semibold text-foreground">Über CityCorners</h2>
		<p class="text-sm text-foreground-secondary">
			CityCorners ist ein Stadtführer für Konstanz am Bodensee. Entdecke Sehenswürdigkeiten,
			Restaurants, Museen und Läden.
		</p>
		<p class="mt-2 text-xs text-foreground-secondary/60">Version 0.0.1</p>
	</section>
</div>
