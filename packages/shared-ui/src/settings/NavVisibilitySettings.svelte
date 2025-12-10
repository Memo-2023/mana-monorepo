<script lang="ts">
	import type { UserSettingsStore } from '@manacore/shared-theme';
	import { getHideableRoutes } from '@manacore/shared-theme';

	interface Props {
		/** User settings store instance */
		userSettings: UserSettingsStore;
		/** Current app ID */
		appId: string;
	}

	let { userSettings, appId }: Props = $props();

	// Get hideable routes for the current app only
	const hideableRoutes = $derived(getHideableRoutes(appId));

	// Check if there are any routes to configure
	const hasRoutes = $derived(hideableRoutes.length > 0);

	function isRouteHidden(path: string): boolean {
		const hidden = userSettings.getHiddenNavItemsForApp(appId);
		return hidden.includes(path);
	}

	async function handleToggle(path: string): Promise<void> {
		await userSettings.toggleNavItemVisibility(appId, path);
	}
</script>

{#if hasRoutes}
	<div class="space-y-4">
		<div>
			<h3
				class="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider"
			>
				Navigation anpassen
			</h3>
			<p class="text-sm text-[hsl(var(--muted-foreground))] mt-1">
				Versteckte Seiten bleiben über die URL erreichbar
			</p>
		</div>

		<div class="space-y-1">
			{#each hideableRoutes as route (route.path)}
				{@const hidden = isRouteHidden(route.path)}
				<label
					class="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-[hsl(var(--muted))]/50 cursor-pointer transition-colors border border-transparent hover:border-[hsl(var(--border))]"
				>
					<span
						class="text-sm {hidden
							? 'text-[hsl(var(--muted-foreground))] line-through'
							: 'text-[hsl(var(--foreground))]'}"
					>
						{route.label}
					</span>
					<button
						type="button"
						class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors {!hidden
							? 'bg-[hsl(var(--primary))]'
							: 'bg-gray-200 dark:bg-gray-700'}"
						onclick={() => handleToggle(route.path)}
						aria-label={hidden ? 'Einblenden' : 'Ausblenden'}
					>
						<span
							class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm {!hidden
								? 'translate-x-5'
								: 'translate-x-0.5'}"
						></span>
					</button>
				</label>
			{/each}
		</div>
	</div>
{/if}
