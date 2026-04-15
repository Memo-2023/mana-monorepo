<script lang="ts">
	import type { UserSettingsStore } from '@mana/shared-theme';
	import {
		House,
		Users,
		User,
		Tag,
		Heart,
		Gear,
		ChatCircle,
		Question,
		ShareNetwork,
		Bell,
		Clock,
		Timer,
		Target,
		Globe,
		Tray,
		Check,
		CheckCircle,
		CheckSquare,
		Plus,
		Columns,
		Microphone,
		CalendarBlank,
		Folder,
		Archive,
		Upload,
		MusicNote,
		File,
		ChartBar,
		MagnifyingGlass,
		List,
		Compass,
		Moon,
		Sun,
		SignOut,
		Fire,
		GridFour,
		Palette,
		CreditCard,
		Buildings,
		Scales,
		Robot,
		Key,
		Shield,
		Sparkle,
		Star,
		Image,
		Copy,
		DownloadSimple,
		Stack,
		TrendUp,
	} from '@mana/shared-icons';

	interface NavItem {
		href: string;
		label: string;
		icon?: string;
	}

	interface Props {
		/** User settings store instance */
		userSettings: UserSettingsStore;
		/** Current app ID */
		appId: string;
		/** Navigation items from the app layout */
		navItems: NavItem[];
		/** Items that should always be visible (e.g., home route) */
		alwaysVisibleHrefs?: string[];
	}

	let { userSettings, appId, navItems, alwaysVisibleHrefs = [] }: Props = $props();

	// Filter to only show hideable items (exclude always visible)
	const hideableItems = $derived(
		navItems.filter((item) => !alwaysVisibleHrefs.includes(item.href))
	);

	// Check if there are any routes to configure
	const hasRoutes = $derived(hideableItems.length > 0);

	// Reactive: get hidden items from nav settings (triggers re-render when hiddenNavItems changes)
	const hiddenItems = $derived(userSettings.nav.hiddenNavItems?.[appId] || []);

	async function handleToggle(href: string): Promise<void> {
		await userSettings.toggleNavItemVisibility(appId, href);
	}

	// Map icon names to Phosphor components
	const phosphorIcons: Record<string, any> = {
		home: House,
		users: Users,
		user: User,
		tag: Tag,
		heart: Heart,
		settings: Gear,
		chat: ChatCircle,
		'help-circle': Question,
		'share-2': ShareNetwork,
		bell: Bell,
		clock: Clock,
		timer: Timer,
		target: Target,
		globe: Globe,
		inbox: Tray,
		check: Check,
		checkCircle: CheckCircle,
		'check-square': CheckSquare,
		plus: Plus,
		columns: Columns,
		kanban: Columns,
		mic: Microphone,
		calendar: CalendarBlank,
		folder: Folder,
		archive: Archive,
		upload: Upload,
		music: MusicNote,
		document: File,
		chart: ChartBar,
		'bar-chart-3': ChartBar,
		search: MagnifyingGlass,
		list: List,
		compass: Compass,
		moon: Moon,
		sun: Sun,
		logout: SignOut,
		fire: Fire,
		grid: GridFour,
		palette: Palette,
		creditCard: CreditCard,
		building: Buildings,
		scale: Scales,
		robot: Robot,
		key: Key,
		shield: Shield,
		sparkle: Sparkle,
		star: Star,
		image: Image,
		copy: Copy,
		download: DownloadSimple,
		layers: Stack,
		trending: TrendUp,
	};
</script>

{#if hasRoutes}
	<div class="space-y-4">
		<div>
			<h3
				class="text-xs font-semibold text-[hsl(var(--color-muted-foreground))] uppercase tracking-wider"
			>
				Navigation anpassen
			</h3>
			<p class="text-sm text-[hsl(var(--color-muted-foreground))] mt-1">
				Versteckte Seiten bleiben über die URL erreichbar
			</p>
		</div>

		<div class="space-y-1">
			{#each hideableItems as item (item.href)}
				{@const hidden = hiddenItems.includes(item.href)}
				{@const IconComponent = item.icon ? phosphorIcons[item.icon] : null}
				<label
					class="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-[hsl(var(--color-muted))]/50 cursor-pointer transition-colors border border-transparent hover:border-[hsl(var(--color-border))]"
				>
					<span
						class="flex items-center gap-3 text-sm {hidden
							? 'text-[hsl(var(--color-muted-foreground))]'
							: 'text-[hsl(var(--color-foreground))]'}"
					>
						{#if IconComponent}
							<span class="flex-shrink-0 {hidden ? 'opacity-50' : ''}">
								<IconComponent size={16} />
							</span>
						{/if}
						<span class={hidden ? 'line-through' : ''}>{item.label}</span>
					</span>
					<button
						type="button"
						class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors {!hidden
							? 'bg-[hsl(var(--color-primary))]'
							: 'bg-gray-200 dark:bg-gray-700'}"
						onclick={() => handleToggle(item.href)}
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
