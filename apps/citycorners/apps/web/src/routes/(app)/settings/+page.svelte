<script lang="ts">
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
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
	<title>{$_('settings.title')} - CityCorners</title>
</svelte:head>

<div class="space-y-8">
	<h1 class="text-2xl font-bold text-foreground">{$_('settings.title')}</h1>

	<section class="rounded-xl border border-border bg-background-card p-5">
		<h2 class="mb-4 text-lg font-semibold text-foreground">{$_('settings.appearance')}</h2>

		<div class="space-y-4">
			<div>
				<label class="mb-2 block text-sm font-medium text-foreground-secondary"
					>{$_('settings.mode')}</label
				>
				<div class="flex gap-2">
					{#each [{ value: 'light', label: `☀️ ${$_('settings.light')}` }, { value: 'dark', label: `🌙 ${$_('settings.dark')}` }, { value: 'system', label: `💻 ${$_('settings.system')}` }] as opt}
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
				<label class="mb-2 block text-sm font-medium text-foreground-secondary"
					>{$_('settings.colorScheme')}</label
				>
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

	<section class="rounded-xl border border-border bg-background-card p-5">
		<h2 class="mb-4 text-lg font-semibold text-foreground">{$_('settings.account')}</h2>

		{#if authStore.isAuthenticated}
			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<span class="text-sm text-foreground-secondary">{$_('settings.email')}</span>
					<span class="text-sm font-medium text-foreground">{authStore.user?.email}</span>
				</div>
				<hr class="border-border" />
				<button
					class="w-full rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/20"
					onclick={handleLogout}
				>
					{$_('settings.logout')}
				</button>
			</div>
		{:else}
			<div class="space-y-3">
				<p class="text-sm text-foreground-secondary">{$_('settings.loginPrompt')}</p>
				<div class="flex gap-2">
					<a
						href="/login"
						class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
					>
						{$_('settings.login')}
					</a>
					<a
						href="/register"
						class="rounded-lg bg-background px-4 py-2 text-sm font-medium text-foreground-secondary transition-colors hover:bg-background-card-hover"
					>
						{$_('settings.register')}
					</a>
				</div>
			</div>
		{/if}
	</section>

	<section class="rounded-xl border border-border bg-background-card p-5">
		<h2 class="mb-4 text-lg font-semibold text-foreground">{$_('settings.about')}</h2>
		<p class="text-sm text-foreground-secondary">{$_('settings.aboutText')}</p>
		<p class="mt-2 text-xs text-foreground-secondary/60">Version 0.0.1</p>
	</section>
</div>
