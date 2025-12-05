<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import { PageHeader } from '@manacore/shared-ui';
	import { authStore } from '$lib/stores/auth.svelte';
</script>

<svelte:head>
	<title>{$_('nav.settings')} - {$_('app.name')}</title>
</svelte:head>

<div class="p-6 max-w-2xl mx-auto">
	<PageHeader title={$_('nav.settings')} />

	<div class="mt-6 space-y-6">
		<!-- Account Section -->
		<div class="p-4 rounded-xl border border-theme bg-surface">
			<h3 class="font-medium text-theme mb-4">{$_('settings.account', { default: 'Account' })}</h3>
			<div class="space-y-3">
				<div>
					<p class="text-sm text-muted">{$_('settings.email', { default: 'Email' })}</p>
					<p class="text-theme">{authStore.user?.email || '-'}</p>
				</div>
				<button
					class="text-red-500 hover:text-red-600 text-sm font-medium"
					onclick={() => {
						authStore.signOut();
						goto('/login');
					}}
				>
					{$_('settings.logout', { default: 'Sign Out' })}
				</button>
			</div>
		</div>

		<!-- Appearance Section -->
		<div class="p-4 rounded-xl border border-theme bg-surface">
			<h3 class="font-medium text-theme mb-4">
				{$_('settings.appearance', { default: 'Appearance' })}
			</h3>
			<p class="text-sm text-muted">
				{$_('settings.themeInNavigation', {
					default: 'Theme settings are available in the navigation.',
				})}
			</p>
		</div>

		<!-- About Section -->
		<div class="p-4 rounded-xl border border-theme bg-surface">
			<h3 class="font-medium text-theme mb-4">{$_('settings.about', { default: 'About' })}</h3>
			<div class="space-y-1">
				<p class="text-sm text-muted">Inventory v1.0.0</p>
				<p class="text-sm text-muted">Part of the ManaCore Ecosystem</p>
			</div>
		</div>
	</div>
</div>
