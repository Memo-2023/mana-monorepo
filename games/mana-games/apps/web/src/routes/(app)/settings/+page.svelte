<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { locale } from 'svelte-i18n';
	import { theme } from '$lib/stores/theme.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { setLocale, supportedLocales } from '$lib/i18n';
	import { goto } from '$app/navigation';
	import { gameStatsCollection } from '$lib/data/local-store';

	async function clearStats() {
		const all = await gameStatsCollection.getAll();
		for (const stat of all) {
			await gameStatsCollection.remove(stat.id);
		}
	}

	async function handleLogout() {
		await authStore.signOut();
		goto('/login');
	}
</script>

<svelte:head>
	<title>{$_('nav.settings')} - Mana Games</title>
</svelte:head>

<div class="settings-page">
	<header class="mb-8">
		<h1 class="text-2xl font-bold text-foreground">{$_('nav.settings')}</h1>
		<p class="text-muted-foreground text-sm mt-1">Passe Mana Games an deine Bedürfnisse an</p>
	</header>

	<!-- Theme -->
	<section class="settings-section">
		<h2 class="text-lg font-bold text-foreground mb-4">Darstellung</h2>

		<div class="setting-row">
			<div>
				<div class="setting-label">Farbmodus</div>
				<div class="setting-desc">Hell, Dunkel oder System</div>
			</div>
			<div class="flex gap-1">
				{#each ['light', 'dark', 'system'] as mode}
					<button
						class="px-3 py-1.5 text-sm rounded-lg transition-colors {theme.mode === mode
							? 'bg-primary text-primary-foreground'
							: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
						onclick={() => theme.setMode(mode as 'light' | 'dark' | 'system')}
					>
						{mode === 'light' ? 'Hell' : mode === 'dark' ? 'Dunkel' : 'System'}
					</button>
				{/each}
			</div>
		</div>
	</section>

	<!-- Language -->
	<section class="settings-section">
		<h2 class="text-lg font-bold text-foreground mb-4">Sprache</h2>

		<div class="setting-row">
			<div>
				<div class="setting-label">App-Sprache</div>
				<div class="setting-desc">Sprache der Benutzeroberfläche</div>
			</div>
			<select
				value={$locale}
				onchange={(e) => setLocale((e.target as HTMLSelectElement).value as any)}
				class="h-9 px-3 rounded-lg bg-background border border-border text-foreground text-sm"
			>
				{#each supportedLocales as loc}
					<option value={loc}>{loc === 'de' ? 'Deutsch' : 'English'}</option>
				{/each}
			</select>
		</div>
	</section>

	<!-- Account -->
	<section class="settings-section">
		<h2 class="text-lg font-bold text-foreground mb-4">Konto</h2>

		{#if authStore.isAuthenticated}
			<div class="setting-row">
				<div>
					<div class="setting-label">Eingeloggt als</div>
					<div class="setting-desc">{authStore.user?.email}</div>
				</div>
				<button
					class="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm"
					onclick={handleLogout}
				>
					Abmelden
				</button>
			</div>
		{:else}
			<div class="setting-row">
				<div>
					<div class="setting-label">Gast-Modus</div>
					<div class="setting-desc">Melde dich an, um Stats zu synchronisieren</div>
				</div>
				<a
					href="/login"
					class="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm"
				>
					Anmelden
				</a>
			</div>
		{/if}
	</section>

	<!-- Data -->
	<section class="settings-section">
		<h2 class="text-lg font-bold text-foreground mb-4">Daten</h2>

		<div class="setting-row">
			<div>
				<div class="setting-label">Spielstatistiken löschen</div>
				<div class="setting-desc">Alle Highscores und Spielzeiten zurücksetzen</div>
			</div>
			<button
				class="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm"
				onclick={clearStats}
			>
				Löschen
			</button>
		</div>
	</section>
</div>

<style>
	.settings-page {
		max-width: 600px;
		margin: 0 auto;
	}

	.settings-section {
		margin-bottom: 2rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid hsl(var(--border));
	}

	.settings-section:last-child {
		border-bottom: none;
	}

	.setting-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem 0;
	}

	.setting-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--foreground));
	}

	.setting-desc {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		margin-top: 2px;
	}
</style>
