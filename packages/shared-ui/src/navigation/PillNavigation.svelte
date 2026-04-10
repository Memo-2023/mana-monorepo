<script lang="ts">
	import type { Snippet } from 'svelte';
	import type {
		PillNavItem,
		PillDropdownItem,
		PillNavElement,
		PillTabGroupConfig,
		PillTagSelectorConfig,
		PillAppItem,
		SpotlightAction,
		ContentSearcher,
	} from './types';
	import PillDropdown from './PillDropdown.svelte';
	import PillTabGroup from './PillTabGroup.svelte';
	import PillTagSelector from './PillTagSelector.svelte';
	import AppDrawer from './AppDrawer.svelte';
	import GlobalSpotlight from './GlobalSpotlight.svelte';
	import { createGlobalSpotlightState } from './useGlobalSpotlight.svelte';
	// Phosphor Icons (via shared-icons)
	import {
		Archive,
		Bell,
		Buildings,
		CalendarBlank,
		CaretDown,
		CaretLeft,
		CaretRight,
		CaretUp,
		ChartBar,
		ChatCircle,
		Check,
		CheckCircle,
		CheckSquare,
		Clock,
		Columns,
		Compass,
		CreditCard,
		File,
		FileText,
		Fire,
		Folder,
		Funnel,
		Gear,
		Gift,
		Globe,
		GridFour,
		Heart,
		House,
		Key,
		List,
		MagnifyingGlass,
		Microphone,
		Moon,
		MusicNote,
		MusicNotes,
		Palette,
		Playlist,
		Plus,
		Question,
		Robot,
		Scales,
		ShareFat,
		ShareNetwork,
		Shield,
		SignOut,
		Sparkle,
		Spiral,
		Sun,
		Tag,
		Target,
		Timer,
		Trash,
		Tray,
		Upload,
		User,
		Users,
		Waveform,
	} from '@mana/shared-icons';

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
		chevronDown: CaretDown,
		chevronUp: CaretUp,
		chevronLeft: CaretLeft,
		menu: List,
		fire: Fire,
		grid: GridFour,
		gridSmall: GridFour,
		palette: Palette,
		creditCard: CreditCard,
		building: Buildings,
		scale: Scales,
		robot: Robot,
		key: Key,
		shield: Shield,
		gift: Gift,
		'music-notes': MusicNotes,
		playlist: Playlist,
		waveform: Waveform,
		'file-text': FileText,
		sparkle: Sparkle,
		sparkles: Sparkle,
		spiral: Spiral,
		share: ShareFat,
		trash: Trash,
		filter: Funnel,
	};

	// Convert app items to dropdown items (will be computed as derived)
	function createAppDropdownItems(
		apps: PillAppItem[],
		allAppsUrl?: string,
		allAppsText?: string,
		openInPanelHandler?: (appId: string, url: string) => void
	): PillDropdownItem[] {
		const items: PillDropdownItem[] = apps.map((app) => ({
			id: app.id,
			label: app.name,
			// Use image icon if available, otherwise use grid as fallback
			imageUrl: app.icon,
			icon: app.icon ? undefined : 'grid',
			onClick: (event?: MouseEvent) => {
				// Check for modifier keys (Ctrl/Cmd + Click opens in panel)
				if (
					event &&
					(event.ctrlKey || event.metaKey) &&
					openInPanelHandler &&
					app.url &&
					!app.isCurrent
				) {
					openInPanelHandler(app.id, app.url);
					return;
				}

				if (app.isCurrent) {
					// Navigate to home route for current app
					window.location.href = '/';
				} else if (app.url) {
					// Internal paths (same-origin) navigate directly, external URLs open in new tab
					const isInternal =
						app.url.startsWith('/') ||
						new URL(app.url, window.location.origin).origin === window.location.origin;
					if (isInternal) {
						window.location.href = app.url;
					} else {
						window.open(app.url, '_blank', 'noopener,noreferrer');
					}
				}
			},
			active: app.isCurrent,
			disabled: false,
			// Show split button if handler is provided and app is not current
			showSplitButton: !!openInPanelHandler && !app.isCurrent && !!app.url,
			onSplitClick:
				openInPanelHandler && app.url ? () => openInPanelHandler(app.id, app.url!) : undefined,
		}));

		// Add "All Apps" link at the end if href is provided
		if (allAppsUrl) {
			items.push(
				{ id: 'all-apps-divider', label: '', divider: true },
				{
					id: 'all-apps',
					label: allAppsText || 'Alle Apps',
					icon: 'grid',
					onClick: () => {
						window.location.href = allAppsUrl;
					},
					active: false,
				}
			);
		}

		return items;
	}

	interface Props {
		/** Navigation items */
		items: PillNavItem[];
		/** Current active path */
		currentPath?: string;
		/** Logo snippet */
		logo?: Snippet;
		/** App name */
		appName?: string;
		/** Home/default route */
		homeRoute?: string;
		/** Called when logout is clicked */
		onLogout?: () => void;
		/** Called when theme toggle is clicked */
		onToggleTheme?: () => void;
		/** Whether dark mode is active */
		isDark?: boolean;
		/** Use 'static' when inside a flex container (bottom-stack pattern). Default: 'fixed'. */
		positioning?: 'fixed' | 'static';
		/** Whether navigation is collapsed */
		isCollapsed?: boolean;
		/** Called when collapsed state changes */
		onCollapsedChange?: (isCollapsed: boolean) => void;
		/** Language dropdown items */
		languageItems?: PillDropdownItem[];
		/** Current language label */
		currentLanguageLabel?: string;
		/** Show language switcher */
		showLanguageSwitcher?: boolean;
		/** Show theme toggle (standalone button, hidden if showThemeVariants is true) */
		showThemeToggle?: boolean;
		/** Show AI tier selector dropdown */
		showAiTierSelector?: boolean;
		/** AI tier dropdown items (each representing a toggleable tier) */
		aiTierItems?: PillDropdownItem[];
		/** Current AI tier label, e.g. "Browser" or "Server" */
		currentAiTierLabel?: string;
		/** Primary color for active state (CSS custom property or hex) */
		primaryColor?: string;
		/** Elements to prepend before nav items (tab groups, dividers, nav items) */
		prependElements?: PillNavElement[];
		/** Additional elements (tab groups, dividers) to show after nav items */
		elements?: PillNavElement[];
		/** Show logout button */
		showLogout?: boolean;
		/** Theme variant dropdown items */
		themeVariantItems?: PillDropdownItem[];
		/** Current theme variant label */
		currentThemeVariantLabel?: string;
		/** Show theme variant selector */
		showThemeVariants?: boolean;
		/** Current theme mode ('light', 'dark', 'system') */
		themeMode?: 'light' | 'dark' | 'system';
		/** Called when theme mode changes */
		onThemeModeChange?: (mode: 'light' | 'dark' | 'system') => void;
		/** App items for app switcher dropdown */
		appItems?: PillAppItem[];
		/** Show app switcher dropdown */
		showAppSwitcher?: boolean;
		/** User email for user dropdown */
		userEmail?: string;
		/** Settings page href */
		settingsHref?: string;
		/** Mana/subscription page href */
		manaHref?: string;
		/** Profile page href */
		profileHref?: string;
		/** Login page href (shown when not logged in) */
		loginHref?: string;
		/** All Apps page href */
		allAppsHref?: string;
		/** All Apps label (default: "Alle Apps") */
		allAppsLabel?: string;
		// A11y Settings
		/** A11y contrast level */
		a11yContrast?: 'normal' | 'high';
		/** Called when a11y contrast changes */
		onA11yContrastChange?: (contrast: 'normal' | 'high') => void;
		/** A11y reduce motion setting */
		a11yReduceMotion?: boolean;
		/** Called when a11y reduce motion changes */
		onA11yReduceMotionChange?: (reduce: boolean) => void;
		/** Show a11y quick toggles in theme dropdown */
		showA11yQuickToggles?: boolean;
		/** Called when an app should be opened in a split panel */
		onOpenInPanel?: (appId: string, url: string) => void;
		/** Quick actions for Cmd+K spotlight (pass to enable spotlight) */
		spotlightActions?: SpotlightAction[];
		/** Placeholder text for spotlight search */
		spotlightPlaceholder?: string;
		/** Content searcher for cross-app search in spotlight */
		contentSearcher?: ContentSearcher;
		/** Accessible label for the nav element */
		ariaLabel?: string;
		/** Feedback page href (shown in user dropdown). Set to empty string to hide. */
		feedbackHref?: string;
		/** Themes page href (shown in user dropdown). Set to empty string to hide. */
		themesHref?: string;
		/** Spiral page href (shown in user dropdown). Set to empty string to hide. */
		spiralHref?: string;
		/** Help page href (shown in user dropdown). Set to empty string to hide. */
		helpHref?: string;
		/** Bottom offset from viewport bottom (default: '0px'). Use to position above other fixed bars. */
		bottomOffset?: string;
	}

	let {
		items,
		currentPath = '',
		logo,
		appName = 'App',
		homeRoute = '/',
		onLogout,
		onToggleTheme,
		isDark = false,
		positioning = 'fixed',
		isCollapsed: externalCollapsed,
		onCollapsedChange,
		languageItems = [],
		currentLanguageLabel = 'Language',
		showLanguageSwitcher = false,
		showThemeToggle = true,
		primaryColor,
		prependElements = [],
		elements = [],
		showLogout = true,
		themeVariantItems = [],
		currentThemeVariantLabel = 'Theme',
		showThemeVariants = false,
		showAiTierSelector = false,
		aiTierItems = [],
		currentAiTierLabel = 'KI',
		themeMode = 'system',
		onThemeModeChange,
		appItems = [],
		showAppSwitcher = false,
		userEmail,
		settingsHref = '/settings',
		manaHref,
		profileHref,
		loginHref,
		allAppsHref,
		allAppsLabel = 'Alle Apps',
		a11yContrast = 'normal',
		onA11yContrastChange,
		a11yReduceMotion = false,
		onA11yReduceMotionChange,
		showA11yQuickToggles = false,
		onOpenInPanel,
		spotlightActions,
		spotlightPlaceholder,
		contentSearcher,
		ariaLabel,
		feedbackHref = '/feedback',
		themesHref,
		spiralHref,
		helpHref,
		bottomOffset = '0px',
	}: Props = $props();

	// Type guards for elements
	function isTabGroup(element: PillNavElement): element is PillTabGroupConfig {
		return 'type' in element && element.type === 'tabs';
	}

	function isDivider(element: PillNavElement): element is { type: 'divider' } {
		return 'type' in element && element.type === 'divider';
	}

	function isTagSelector(element: PillNavElement): element is PillTagSelectorConfig {
		return 'type' in element && element.type === 'tag-selector';
	}

	function isNavItem(element: PillNavElement): element is PillNavItem {
		return 'href' in element;
	}

	// Truncate email for display (show first part before @, max 12 chars)
	function truncateEmail(email: string, maxLength = 12): string {
		const atIndex = email.indexOf('@');
		const localPart = atIndex > 0 ? email.substring(0, atIndex) : email;
		if (localPart.length <= maxLength) {
			return localPart;
		}
		return localPart.substring(0, maxLength) + '…';
	}

	// Dropdown direction: always up since nav is always at bottom
	const dropdownDirection = 'up' as const;

	// App drawer state
	let appDrawerOpen = $state(false);

	// Global spotlight (Cmd+K) — only active when spotlightActions are provided
	// svelte-ignore state_referenced_locally
	const spotlight = spotlightActions ? createGlobalSpotlightState() : null;

	function isActive(path: string) {
		return currentPath === path;
	}
</script>

{#if !(externalCollapsed ?? false)}
	<nav
		class="pill-nav"
		class:pill-nav-static={positioning === 'static'}
		style="{primaryColor
			? `--pill-primary-color: ${primaryColor};`
			: ''}--pill-nav-bottom: {bottomOffset}"
		aria-label={ariaLabel}
	>
		<div class="pill-nav-container">
			<!-- Logo pill / App Switcher -->
			{#if showAppSwitcher && appItems.length > 0}
				<AppDrawer
					apps={appItems}
					isOpen={appDrawerOpen}
					onToggle={(open) => (appDrawerOpen = open)}
					{onOpenInPanel}
					{allAppsHref}
					{allAppsLabel}
					triggerLabel={appName}
				/>
			{:else}
				<a href={homeRoute} class="pill glass-pill logo-pill">
					{#if logo}
						{@render logo()}
					{:else}
						<span class="pill-label font-bold">{appName}</span>
					{/if}
				</a>
			{/if}

			<!-- Prepended Elements (Tab Groups, Dividers, Nav Items, Tag Selectors) -->
			{#each prependElements as element}
				{#if isTabGroup(element)}
					<PillTabGroup
						options={element.options}
						value={element.value}
						onChange={element.onChange}
						sectionLabel={element.sectionLabel}
						onContextMenu={element.onContextMenu}
						{primaryColor}
					/>
				{:else if isDivider(element)}
					<div class="pill-divider"></div>
				{:else if isTagSelector(element)}
					<PillTagSelector
						tags={element.tags}
						selectedIds={element.selectedIds}
						onToggle={element.onToggle}
						onClear={element.onClear}
						onCreate={element.onCreate}
						loading={element.loading}
						label={element.label}
						direction={dropdownDirection}
					/>
				{:else if isNavItem(element)}
					<a href={element.href} class="pill glass-pill" class:active={isActive(element.href)}>
						{#if element.icon}
							{#if phosphorIcons[element.icon]}
								{@const IconComponent = phosphorIcons[element.icon]}
								<IconComponent size={18} class="pill-icon" />
							{/if}
						{/if}
						<span class="pill-label">{element.label}</span>
					</a>
				{/if}
			{/each}

			<!-- Navigation Items -->
			{#each items as item}
				{#if item.onClick}
					<button
						onclick={item.onClick}
						oncontextmenu={item.onContextMenu}
						class="pill glass-pill"
						class:active={item.active}
					>
						{#if item.icon}
							{#if item.icon === 'mana'}
								<svg class="pill-icon" viewBox="0 0 24 24" fill="currentColor">
									<path
										d="M12.3047 1C12.3392 1.04573 19.608 10.6706 19.6084 14.6953C19.6084 18.7293 16.3386 21.9998 12.3047 22C8.27061 22 5 18.7294 5 14.6953C5.00041 10.661 12.3047 1 12.3047 1ZM12.3047 7.3916C12.2811 7.42276 8.65234 12.2288 8.65234 14.2393C8.65241 16.2562 10.2877 17.8916 12.3047 17.8916C14.3217 17.8916 15.957 16.2562 15.957 14.2393C15.957 12.2301 12.3331 7.42917 12.3047 7.3916Z"
									/>
								</svg>
							{:else if item.iconSvg}
								{@html item.iconSvg}
							{:else if phosphorIcons[item.icon]}
								{@const IconComponent = phosphorIcons[item.icon]}
								<IconComponent size={18} class="pill-icon" />
							{/if}
						{/if}
						<span class="pill-label">{item.label}</span>
					</button>
				{:else}
					<a
						href={item.href}
						oncontextmenu={item.onContextMenu}
						class="pill glass-pill"
						class:active={isActive(item.href)}
					>
						{#if item.icon}
							{#if item.icon === 'mana'}
								<svg class="pill-icon" viewBox="0 0 24 24" fill="currentColor">
									<path
										d="M12.3047 1C12.3392 1.04573 19.608 10.6706 19.6084 14.6953C19.6084 18.7293 16.3386 21.9998 12.3047 22C8.27061 22 5 18.7294 5 14.6953C5.00041 10.661 12.3047 1 12.3047 1ZM12.3047 7.3916C12.2811 7.42276 8.65234 12.2288 8.65234 14.2393C8.65241 16.2562 10.2877 17.8916 12.3047 17.8916C14.3217 17.8916 15.957 16.2562 15.957 14.2393C15.957 12.2301 12.3331 7.42917 12.3047 7.3916Z"
									/>
								</svg>
							{:else if item.iconSvg}
								{@html item.iconSvg}
							{:else if phosphorIcons[item.icon]}
								{@const IconComponent = phosphorIcons[item.icon]}
								<IconComponent size={18} class="pill-icon" />
							{/if}
						{/if}
						<span class="pill-label">{item.label}</span>
					</a>
				{/if}
			{/each}

			<!-- Additional Elements (Tab Groups, Dividers, Tag Selectors) -->
			{#each elements as element}
				{#if isTabGroup(element)}
					<PillTabGroup
						options={element.options}
						value={element.value}
						onChange={element.onChange}
						sectionLabel={element.sectionLabel}
						onContextMenu={element.onContextMenu}
						{primaryColor}
					/>
				{:else if isDivider(element)}
					<div class="pill-divider"></div>
				{:else if isTagSelector(element)}
					<PillTagSelector
						tags={element.tags}
						selectedIds={element.selectedIds}
						onToggle={element.onToggle}
						onClear={element.onClear}
						onCreate={element.onCreate}
						loading={element.loading}
						label={element.label}
						direction={dropdownDirection}
					/>
				{:else if isNavItem(element)}
					<a href={element.href} class="pill glass-pill" class:active={isActive(element.href)}>
						{#if element.icon}
							{#if phosphorIcons[element.icon]}
								{@const IconComponent = phosphorIcons[element.icon]}
								<IconComponent size={18} class="pill-icon" />
							{/if}
						{/if}
						<span class="pill-label">{element.label}</span>
					</a>
				{/if}
			{/each}

			<!-- Theme Variant Selector -->
			{#if showThemeVariants && themeVariantItems.length > 0}
				<PillDropdown
					items={themeVariantItems}
					direction={dropdownDirection}
					label={currentThemeVariantLabel}
					icon="palette"
				>
					{#snippet header()}
						<div class="theme-mode-selector glass-pill">
							<button
								type="button"
								onclick={() => onThemeModeChange?.('light')}
								class="mode-btn"
								class:active={themeMode === 'light'}
								title="Light mode"
							>
								<Sun size={16} class="mode-icon" />
							</button>
							<button
								type="button"
								onclick={() => onThemeModeChange?.('dark')}
								class="mode-btn"
								class:active={themeMode === 'dark'}
								title="Dark mode"
							>
								<Moon size={16} class="mode-icon" />
							</button>
							<button
								type="button"
								onclick={() => onThemeModeChange?.('system')}
								class="mode-btn"
								class:active={themeMode === 'system'}
								title="System mode"
							>
								<svg class="mode-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<rect x="2" y="3" width="20" height="14" rx="2" stroke-width="2" />
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M8 21h8M12 17v4"
									/>
								</svg>
							</button>
						</div>
					{/snippet}
					{#snippet footer()}
						{#if showA11yQuickToggles}
							<div class="a11y-quick-toggles glass-pill">
								<!-- Contrast Toggle -->
								<button
									type="button"
									onclick={() =>
										onA11yContrastChange?.(a11yContrast === 'high' ? 'normal' : 'high')}
									class="a11y-btn"
									class:active={a11yContrast === 'high'}
									title="Hoher Kontrast"
									aria-pressed={a11yContrast === 'high'}
								>
									<Sun size={20} class="a11y-icon" />
								</button>
								<!-- Reduce Motion Toggle -->
								<button
									type="button"
									onclick={() => onA11yReduceMotionChange?.(!a11yReduceMotion)}
									class="a11y-btn"
									class:active={a11yReduceMotion}
									title="Animationen reduzieren"
									aria-pressed={a11yReduceMotion}
								>
									<svg
										class="a11y-icon"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										{#if a11yReduceMotion}
											<rect x="6" y="4" width="4" height="16" rx="1" />
											<rect x="14" y="4" width="4" height="16" rx="1" />
										{:else}
											<polygon points="5 3 19 12 5 21 5 3" />
										{/if}
									</svg>
								</button>
							</div>
						{/if}
					{/snippet}
				</PillDropdown>
			{/if}

			<!-- AI Tier Selector -->
			{#if showAiTierSelector && aiTierItems.length > 0}
				<PillDropdown
					items={aiTierItems}
					direction={dropdownDirection}
					label={currentAiTierLabel}
					icon="cpu"
				/>
			{/if}

			<!-- Theme Toggle (only show when not using theme variants dropdown) -->
			{#if showThemeToggle && onToggleTheme && !showThemeVariants}
				<button
					onclick={onToggleTheme}
					class="pill glass-pill"
					title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
				>
					{#if !isDark}
						<Moon size={18} class="pill-icon" />
					{:else}
						<Sun size={18} class="pill-icon" />
					{/if}
					<span class="pill-label">{isDark ? 'Light' : 'Dark'}</span>
				</button>
			{/if}

			<!-- User Menu Dropdown -->
			{#if userEmail}
				<PillDropdown
					items={[
						...(profileHref
							? [
									{
										id: 'profile',
										label: 'Profil',
										icon: 'user',
										onClick: () => {
											window.location.href = profileHref;
										},
										active: currentPath === profileHref,
									},
								]
							: []),
						{
							id: 'settings',
							label: 'Einstellungen',
							icon: 'settings',
							onClick: () => {
								window.location.href = settingsHref;
							},
							active: currentPath === settingsHref,
						},
						...(manaHref
							? [
									{
										id: 'mana',
										label: 'Mana',
										icon: 'sparkle',
										onClick: () => {
											window.location.href = manaHref;
										},
										active: currentPath === manaHref,
									},
								]
							: []),
						...(feedbackHref
							? [
									{
										id: 'feedback',
										label: 'Feedback',
										icon: 'chat',
										onClick: () => {
											window.location.href = feedbackHref;
										},
										active: currentPath === feedbackHref,
									},
								]
							: []),
						...(themesHref
							? [
									{
										id: 'themes',
										label: 'Themes',
										icon: 'palette',
										onClick: () => {
											window.location.href = themesHref;
										},
										active: currentPath === themesHref,
									},
								]
							: []),
						...(spiralHref
							? [
									{
										id: 'spiral',
										label: 'Spiral',
										icon: 'sparkles',
										onClick: () => {
											window.location.href = spiralHref;
										},
										active: currentPath === spiralHref,
									},
								]
							: []),
						...(helpHref
							? [
									{
										id: 'help',
										label: 'Hilfe',
										icon: 'help',
										onClick: () => {
											window.location.href = helpHref;
										},
										active: currentPath === helpHref,
									},
								]
							: []),
						...(showLanguageSwitcher && languageItems.length > 0
							? [
									{ id: 'language-divider', label: '', divider: true },
									{
										id: 'language',
										label: currentLanguageLabel,
										submenu: languageItems.map((item) => ({
											...item,
											id: `lang-${item.id}`,
										})),
									},
								]
							: []),
						{ id: 'auth-divider', label: '', divider: true },
						...(showLogout && onLogout
							? [
									{
										id: 'logout',
										label: 'Logout',
										icon: 'logout',
										onClick: () => onLogout?.(),
										danger: true,
									},
								]
							: loginHref
								? [
										{
											id: 'login',
											label: 'Login',
											icon: 'user',
											onClick: () => {
												window.location.href = loginHref;
											},
										},
									]
								: []),
					]}
					direction={dropdownDirection}
					label={truncateEmail(userEmail)}
					icon="user"
				/>
			{:else if onLogout && showLogout}
				<!-- Fallback to standalone logout if no user email -->
				<button onclick={onLogout} class="pill glass-pill logout-pill" title="Logout">
					<SignOut size={18} class="pill-icon" />
					<span class="pill-label">Logout</span>
				</button>
			{:else if loginHref && !userEmail}
				<!-- Guest mode: prominent login button -->
				<a href={loginHref} class="pill glass-pill login-pill" title="Anmelden">
					<User size={18} class="pill-icon" />
					<span class="pill-label">Anmelden</span>
				</a>
			{/if}
		</div>
	</nav>
{/if}

<!-- Global Spotlight (Cmd+K) -->
{#if spotlight && spotlightActions}
	<GlobalSpotlight
		open={spotlight.isOpen}
		onClose={spotlight.close}
		apps={appItems}
		quickActions={spotlightActions}
		placeholder={spotlightPlaceholder}
		{contentSearcher}
	/>
{/if}

<style>
	.pill-nav {
		position: fixed;
		bottom: var(--pill-nav-bottom, 0px);
		left: 0;
		right: 0;
		z-index: 1000;
		padding: 1rem 0 calc(env(safe-area-inset-bottom, 0px) + 0.75rem);
		pointer-events: none;
		/* Container query context */
		container-type: inline-size;
		container-name: pillnav;
	}

	.pill-nav-static {
		position: relative;
		bottom: auto;
		z-index: auto;
	}

	.pill-nav-container {
		display: flex;
		align-items: center;
		gap: 1rem;
		overflow-x: auto;
		scrollbar-width: none;
		-ms-overflow-style: none;
		pointer-events: auto;
		padding: 0.5rem 2rem;
		/* Default: left-aligned with fit-content */
		width: fit-content;
		max-width: 100%;
	}

	/* Center when container has enough space (> 600px) */
	@container pillnav (min-width: 600px) {
		.pill-nav-container {
			margin-left: auto;
			margin-right: auto;
		}
	}

	.pill-nav-container::-webkit-scrollbar {
		display: none;
	}

	/* Mobile: tighter padding, icon-only pills */
	@media (max-width: 640px) {
		.pill-nav-container {
			padding: 0.375rem 0.75rem;
			gap: 0.5rem;
		}

		.pill-label {
			display: none;
		}

		.pill {
			padding: 0.625rem;
			min-width: 44px;
			min-height: 44px;
			justify-content: center;
		}

		.pill-icon {
			width: 1.25rem;
			height: 1.25rem;
		}
	}

	/* Base pill styles */
	.pill {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
		white-space: nowrap;
		text-decoration: none;
		transition: all 0.2s;
		border: none;
		cursor: pointer;
	}

	/* Glass effect */
	.glass-pill {
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
		color: #374151;
	}

	:global(.dark) .glass-pill {
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.15);
		color: #f3f4f6;
	}

	.glass-pill:hover {
		background: rgba(255, 255, 255, 0.95);
		border-color: rgba(0, 0, 0, 0.15);
		transform: translateY(-2px);
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.1),
			0 4px 6px -2px rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .glass-pill:hover {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.25);
	}

	/* Active state - uses CSS custom property for theming */
	.pill.active {
		background: var(--pill-primary-color, var(--color-primary-500, rgba(248, 214, 43, 0.9)));
		background: color-mix(
			in srgb,
			var(--pill-primary-color, var(--color-primary-500, #f8d62b)) 20%,
			white 80%
		);
		border-color: var(--pill-primary-color, var(--color-primary-500, rgba(248, 214, 43, 0.5)));
		color: #1a1a1a;
	}

	:global(.dark) .pill.active {
		background: color-mix(
			in srgb,
			var(--pill-primary-color, var(--color-primary-500, #f8d62b)) 30%,
			transparent 70%
		);
		border-color: var(--pill-primary-color, var(--color-primary-500, rgba(248, 214, 43, 0.4)));
		color: var(--pill-primary-color, var(--color-primary-500, #f8d62b));
	}

	/* Divider */
	.pill-divider {
		width: 1px;
		height: 1.5rem;
		background: rgba(0, 0, 0, 0.15);
		flex-shrink: 0;
		margin: 0 0.25rem;
	}

	:global(.dark) .pill-divider {
		background: rgba(255, 255, 255, 0.2);
	}

	/* Logout pill */
	.logout-pill {
		color: #dc2626;
	}

	:global(.dark) .logout-pill {
		color: #ef4444;
	}

	.logout-pill:hover {
		background: rgba(220, 38, 38, 0.15);
		border-color: rgba(220, 38, 38, 0.3);
	}

	/* Guest login pill — prominent with primary color */
	.login-pill {
		background: var(--pill-primary-color, var(--color-primary-500, #3b82f6));
		color: #fff;
		border-color: transparent;
		font-weight: 600;
		text-decoration: none;
	}

	.login-pill:hover {
		filter: brightness(1.1);
		transform: scale(1.03);
	}

	.pill-icon {
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
	}

	.pill-label {
		display: inline;
	}

	/* Transitions */
	.pill-nav {
		transition: all 0.3s ease;
	}

	.pill-nav-container {
		transition: all 0.3s ease;
	}

	/* Theme mode selector in dropdown header */
	:global(.theme-mode-selector) {
		display: flex !important;
		align-items: center !important;
		gap: 0.25rem !important;
		padding: 0.25rem !important;
		border-radius: 9999px !important;
		background: rgba(245, 245, 245, 0.95) !important;
		border: 1px solid rgba(0, 0, 0, 0.1) !important;
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
		color: #374151 !important;
	}

	:global(.dark .theme-mode-selector) {
		background: rgba(40, 40, 40, 0.95) !important;
		border: 1px solid rgba(255, 255, 255, 0.15) !important;
		color: #f3f4f6 !important;
	}

	:global(.mode-btn) {
		display: flex;
		flex: 1;
		align-items: center;
		justify-content: center;
		padding: 0.375rem;
		border: none;
		background: transparent;
		border-radius: 9999px;
		cursor: pointer;
		color: #374151;
		transition: all 0.15s;
	}

	:global(.dark .mode-btn) {
		color: #f3f4f6;
	}

	:global(.mode-btn:hover:not(.active)) {
		background: rgba(0, 0, 0, 0.05);
	}

	:global(.dark .mode-btn:hover:not(.active)) {
		background: rgba(255, 255, 255, 0.1);
	}

	:global(.mode-btn.active) {
		background: var(--pill-primary-color, var(--color-primary-500, rgba(248, 214, 43, 0.2)));
		background: color-mix(
			in srgb,
			var(--pill-primary-color, var(--color-primary-500, #3b82f6)) 20%,
			white 80%
		);
	}

	:global(.dark .mode-btn.active) {
		background: color-mix(
			in srgb,
			var(--pill-primary-color, var(--color-primary-500, #3b82f6)) 30%,
			transparent 70%
		);
	}

	:global(.mode-icon) {
		width: 1rem;
		height: 1rem;
	}

	/* A11y quick toggles in dropdown footer */
	:global(.a11y-quick-toggles) {
		display: flex !important;
		align-items: center !important;
		gap: 0.25rem !important;
		padding: 0.25rem !important;
		border-radius: 9999px !important;
		background: rgba(245, 245, 245, 0.95) !important;
		border: 1px solid rgba(0, 0, 0, 0.1) !important;
		color: #374151 !important;
	}

	:global(.dark .a11y-quick-toggles) {
		background: rgba(40, 40, 40, 0.95) !important;
		border: 1px solid rgba(255, 255, 255, 0.15) !important;
		color: #f3f4f6 !important;
	}

	:global(.a11y-btn) {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.375rem;
		border: none;
		background: transparent;
		border-radius: 9999px;
		cursor: pointer;
		color: #6b7280;
		transition: all 0.15s;
	}

	:global(.dark .a11y-btn) {
		color: #9ca3af;
	}

	:global(.a11y-btn:hover:not(.active)) {
		background: rgba(0, 0, 0, 0.05);
		color: #374151;
	}

	:global(.dark .a11y-btn:hover:not(.active)) {
		background: rgba(255, 255, 255, 0.1);
		color: #f3f4f6;
	}

	:global(.a11y-btn.active) {
		background: color-mix(
			in srgb,
			var(--pill-primary-color, var(--color-primary-500, #3b82f6)) 20%,
			white 80%
		);
		color: var(--pill-primary-color, var(--color-primary-500, #3b82f6));
	}

	:global(.dark .a11y-btn.active) {
		background: color-mix(
			in srgb,
			var(--pill-primary-color, var(--color-primary-500, #3b82f6)) 30%,
			transparent 70%
		);
	}

	:global(.a11y-icon) {
		width: 1rem;
		height: 1rem;
	}
</style>
