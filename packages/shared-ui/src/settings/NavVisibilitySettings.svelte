<script lang="ts">
	import type { UserSettingsStore, AppRoute } from '@manacore/shared-theme';
	import { getHideableRoutes, APP_ROUTES } from '@manacore/shared-theme';

	interface Props {
		/** User settings store instance */
		userSettings: UserSettingsStore;
		/** Current app ID */
		appId: string;
		/** Translation function (optional, falls back to German) */
		t?: (key: string) => string;
	}

	let { userSettings, appId, t = (key: string) => key }: Props = $props();

	// Get all apps that have configurable routes
	const configurableApps = $derived(
		Object.entries(APP_ROUTES)
			.filter(([, config]) => {
				const hideableRoutes = config.availableRoutes.filter((r) => !r.alwaysVisible);
				return hideableRoutes.length > 0;
			})
			.map(([id, config]) => ({
				id,
				label: getAppLabel(id),
				routes: config.availableRoutes.filter((r) => !r.alwaysVisible),
			}))
	);

	// Sort so current app is first
	const sortedApps = $derived(
		[...configurableApps].sort((a, b) => {
			if (a.id === appId) return -1;
			if (b.id === appId) return 1;
			return a.label.localeCompare(b.label);
		})
	);

	function getAppLabel(id: string): string {
		const labels: Record<string, string> = {
			clock: 'Uhr',
			calendar: 'Kalender',
			contacts: 'Kontakte',
			mail: 'Mail',
			todo: 'Aufgaben',
			storage: 'Speicher',
			chat: 'Chat',
			picture: 'Bilder',
			manadeck: 'ManaDeck',
			zitare: 'Zitare',
			presi: 'Präsentation',
			manacore: 'ManaCore',
		};
		return labels[id] || id;
	}

	function isRouteHidden(targetAppId: string, path: string): boolean {
		const hidden = userSettings.getHiddenNavItemsForApp(targetAppId);
		return hidden.includes(path);
	}

	async function handleToggle(targetAppId: string, path: string): Promise<void> {
		await userSettings.toggleNavItemVisibility(targetAppId, path);
	}

	// Expanded state per app
	let expandedApps = $state<Record<string, boolean>>({});

	// Initialize with current app expanded
	$effect(() => {
		if (appId && expandedApps[appId] === undefined) {
			expandedApps[appId] = true;
		}
	});

	function toggleApp(id: string): void {
		expandedApps[id] = !expandedApps[id];
	}
</script>

<div class="space-y-4">
	<div>
		<h3 class="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
			Navigation anpassen
		</h3>
		<p class="text-sm text-[hsl(var(--muted-foreground))] mt-1">
			Versteckte Seiten bleiben über die URL erreichbar
		</p>
	</div>

	<div class="space-y-2">
		{#each sortedApps as app (app.id)}
			<div class="border border-[hsl(var(--border))] rounded-lg overflow-hidden">
				<!-- App Header (collapsible) -->
				<button
					type="button"
					class="w-full flex items-center justify-between px-4 py-3 bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))]/80 transition-colors"
					onclick={() => toggleApp(app.id)}
				>
					<span class="font-medium text-[hsl(var(--foreground))] flex items-center gap-2">
						{app.label}
						{#if app.id === appId}
							<span
								class="text-xs px-1.5 py-0.5 rounded bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
							>
								Aktuell
							</span>
						{/if}
					</span>
					<svg
						class="w-5 h-5 text-[hsl(var(--muted-foreground))] transition-transform {expandedApps[
							app.id
						]
							? 'rotate-180'
							: ''}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"
						></path>
					</svg>
				</button>

				<!-- Routes List (collapsible) -->
				{#if expandedApps[app.id]}
					<div class="p-3 space-y-1 bg-[hsl(var(--background))]">
						{#each app.routes as route (route.path)}
							{@const hidden = isRouteHidden(app.id, route.path)}
							<label
								class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[hsl(var(--muted))]/50 cursor-pointer transition-colors"
							>
								<span
									class="text-sm {hidden
										? 'text-[hsl(var(--muted-foreground))] line-through'
										: 'text-[hsl(var(--foreground))]'}"
								>
									{t(route.labelKey)}
								</span>
								<button
									type="button"
									class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors {!hidden
										? 'bg-[hsl(var(--primary))]'
										: 'bg-gray-200 dark:bg-gray-700'}"
									onclick={() => handleToggle(app.id, route.path)}
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
				{/if}
			</div>
		{/each}
	</div>
</div>
