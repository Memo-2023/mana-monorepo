<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { locale } from 'svelte-i18n';
	import {
		MANA_APPS,
		APP_URLS,
		APP_STATUS_LABELS,
		getAccessibleManaApps,
		type ManaApp,
		type AppIconId,
	} from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';
	import { ManaCoreEvents } from '@manacore/shared-utils/analytics';

	// Detect dev mode
	const isDev =
		typeof window !== 'undefined' &&
		(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

	// Current locale
	let currentLocale = $derived(($locale as 'de' | 'en') || 'de');
	let statusLabels = $derived(APP_STATUS_LABELS[currentLocale] || APP_STATUS_LABELS['de']);

	// Filter apps by user's access tier
	let userTier = $derived(authStore.user?.tier || 'public');
	let activeApps = $derived(getAccessibleManaApps(userTier));

	// Group apps by category
	interface AppCategory {
		id: string;
		titleDe: string;
		titleEn: string;
		descDe: string;
		descEn: string;
		icon: string;
		apps: ManaApp[];
	}

	const aiAppIds: AppIconId[] = ['chat', 'picture', 'questions', 'context', 'presi', 'mail'];
	const productivityIds: AppIconId[] = ['todo', 'calendar', 'contacts', 'manadeck', 'inventory'];
	const utilityIds: AppIconId[] = ['clock', 'zitare', 'storage', 'moodlit', 'matrix'];

	function getAppsForCategory(ids: AppIconId[], apps: ManaApp[]): ManaApp[] {
		return ids
			.map((id) => apps.find((app) => app.id === id))
			.filter((app): app is ManaApp => !!app);
	}

	let categories = $derived([
		{
			id: 'ai',
			titleDe: 'KI & Kreativ',
			titleEn: 'AI & Creative',
			descDe: 'Intelligente Assistenten und kreative Werkzeuge',
			descEn: 'Intelligent assistants and creative tools',
			icon: '🤖',
			apps: getAppsForCategory(aiAppIds, activeApps),
		},
		{
			id: 'productivity',
			titleDe: 'Produktivität',
			titleEn: 'Productivity',
			descDe: 'Organisiere deinen Alltag',
			descEn: 'Organize your daily life',
			icon: '📋',
			apps: getAppsForCategory(productivityIds, activeApps),
		},
		{
			id: 'utility',
			titleDe: 'Tools & Utilities',
			titleEn: 'Tools & Utilities',
			descDe: 'Praktische Helferlein',
			descEn: 'Handy helpers',
			icon: '🔧',
			apps: getAppsForCategory(utilityIds, activeApps),
		},
	] satisfies AppCategory[]);

	function getStatusColor(status: ManaApp['status']): string {
		const colors = {
			published: '#22c55e',
			beta: '#eab308',
			development: '#f97316',
			planning: '#6b7280',
		};
		return colors[status];
	}

	function getStatusBgColor(status: ManaApp['status']): string {
		const colors = {
			published: 'rgba(34, 197, 94, 0.1)',
			beta: 'rgba(234, 179, 8, 0.1)',
			development: 'rgba(249, 115, 22, 0.1)',
			planning: 'rgba(107, 114, 128, 0.1)',
		};
		return colors[status];
	}

	function getAppUrl(appId: AppIconId): string | undefined {
		const urls = APP_URLS[appId];
		if (!urls) return undefined;
		return isDev ? urls.dev : urls.prod;
	}

	function handleAppClick(app: ManaApp) {
		ManaCoreEvents.appOpened(app.id);
		const url = getAppUrl(app.id);
		if (url) {
			window.open(url, '_blank', 'noopener,noreferrer');
		}
	}

	// Stats
	let totalApps = $derived(activeApps.length);
	let liveApps = $derived(
		activeApps.filter((a) => a.status === 'published' || a.status === 'beta').length
	);

	// Greeting based on time
	function getGreeting(): string {
		const hour = new Date().getHours();
		if (currentLocale === 'en') {
			if (hour < 12) return 'Good morning';
			if (hour < 18) return 'Good afternoon';
			return 'Good evening';
		}
		if (hour < 12) return 'Guten Morgen';
		if (hour < 18) return 'Guten Tag';
		return 'Guten Abend';
	}

	let greeting = $derived(getGreeting());
	let userName = $derived(authStore.user?.email?.split('@')[0] || 'User');
</script>

<div class="home-page">
	<!-- Hero Section -->
	<div class="hero">
		<div class="hero-content">
			<h1 class="hero-title">
				{greeting}, <span class="hero-name">{userName}</span>
			</h1>
			<p class="hero-subtitle">
				{#if currentLocale === 'en'}
					Your Mana ecosystem — {totalApps} apps, {liveApps} live
				{:else}
					Dein Mana-Ökosystem — {totalApps} Apps, {liveApps} live
				{/if}
			</p>
		</div>
		<div class="hero-stats">
			<a href="/dashboard" class="stat-card">
				<span class="stat-icon">📊</span>
				<span class="stat-label">Dashboard</span>
			</a>
			<a href="/credits" class="stat-card">
				<span class="stat-icon">💳</span>
				<span class="stat-label">Credits</span>
			</a>
			<a href="/settings" class="stat-card">
				<span class="stat-icon">⚙️</span>
				<span class="stat-label">{currentLocale === 'en' ? 'Settings' : 'Einstellungen'}</span>
			</a>
		</div>
	</div>

	<!-- App Categories -->
	{#each categories as category}
		<section class="category">
			<div class="category-header">
				<span class="category-icon">{category.icon}</span>
				<div>
					<h2 class="category-title">
						{currentLocale === 'en' ? category.titleEn : category.titleDe}
					</h2>
					<p class="category-desc">
						{currentLocale === 'en' ? category.descEn : category.descDe}
					</p>
				</div>
			</div>

			<div class="app-grid">
				{#each category.apps as app}
					<button
						class="app-card"
						style="--app-color: {app.color};"
						onclick={() => handleAppClick(app)}
					>
						<div class="app-card-top">
							<div class="app-icon-wrap">
								{#if app.icon}
									<img src={app.icon} alt={app.name} class="app-icon" />
								{:else}
									<div class="app-icon-fallback" style="color: {app.color};">
										{app.name.charAt(0)}
									</div>
								{/if}
							</div>
							<div
								class="status-badge"
								style="color: {getStatusColor(app.status)}; background: {getStatusBgColor(
									app.status
								)};"
							>
								<span class="status-dot" style="background: {getStatusColor(app.status)};"></span>
								{statusLabels[app.status]}
							</div>
						</div>

						<h3 class="app-name">{app.name}</h3>
						<p class="app-tagline">{app.description[currentLocale] || app.description.de}</p>

						<div class="app-card-footer">
							{#if app.comingSoon}
								<span class="coming-soon-label">
									{currentLocale === 'en' ? 'Coming Soon' : 'Demnächst'}
								</span>
							{:else}
								<span class="open-label" style="color: {app.color};">
									{currentLocale === 'en' ? 'Open' : 'Öffnen'} →
								</span>
							{/if}
						</div>
					</button>
				{/each}
			</div>
		</section>
	{/each}

	<!-- Legend -->
	<div class="legend">
		<span class="legend-title">{currentLocale === 'en' ? 'Status' : 'Status'}:</span>
		{#each Object.entries(statusLabels) as [status, label]}
			<span class="legend-item">
				<span class="legend-dot" style="background: {getStatusColor(status as ManaApp['status'])};"
				></span>
				{label}
			</span>
		{/each}
	</div>
</div>

<style>
	.home-page {
		max-width: 100%;
	}

	/* Hero */
	.hero {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin-bottom: 2.5rem;
	}

	@media (min-width: 768px) {
		.hero {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
		}
	}

	.hero-title {
		font-size: 1.75rem;
		font-weight: 700;
		color: hsl(var(--foreground, 0 0% 9%));
		margin: 0 0 0.25rem;
	}

	.hero-name {
		background: linear-gradient(135deg, #6366f1, #8b5cf6);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.hero-subtitle {
		font-size: 0.9375rem;
		color: hsl(var(--muted-foreground, 0 0% 45%));
		margin: 0;
	}

	.hero-stats {
		display: flex;
		gap: 0.75rem;
		flex-shrink: 0;
	}

	.stat-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
		border: 1px solid hsl(var(--border, 0 0% 90%));
		background: hsl(var(--card, 0 0% 100%));
		text-decoration: none;
		color: hsl(var(--foreground, 0 0% 9%));
		transition: all 0.15s ease;
		min-width: 5rem;
	}

	.stat-card:hover {
		border-color: hsl(var(--primary, 239 84% 67%));
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	}

	.stat-icon {
		font-size: 1.25rem;
	}

	.stat-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--muted-foreground, 0 0% 45%));
	}

	/* Categories */
	.category {
		margin-bottom: 2rem;
	}

	.category-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.category-icon {
		font-size: 1.5rem;
	}

	.category-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: hsl(var(--foreground, 0 0% 9%));
		margin: 0;
	}

	.category-desc {
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground, 0 0% 45%));
		margin: 0;
	}

	/* App Grid */
	.app-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 0.75rem;
	}

	@media (min-width: 1024px) {
		.app-grid {
			grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		}
	}

	/* App Card */
	.app-card {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		padding: 1rem;
		border-radius: 0.875rem;
		border: 1px solid hsl(var(--border, 0 0% 90%));
		background: hsl(var(--card, 0 0% 100%));
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
		width: 100%;
	}

	.app-card:hover {
		transform: translateY(-3px);
		box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.1);
		border-color: color-mix(in srgb, var(--app-color) 40%, hsl(var(--border, 0 0% 90%)));
	}

	:global(.dark) .app-card:hover {
		box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.3);
	}

	.app-card-top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		width: 100%;
		margin-bottom: 0.75rem;
	}

	.app-icon-wrap {
		width: 2.5rem;
		height: 2.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.app-icon {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.app-icon-fallback {
		width: 2.5rem;
		height: 2.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.25rem;
		font-weight: 700;
		border-radius: 0.5rem;
	}

	.status-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.125rem 0.5rem;
		border-radius: 1rem;
		font-size: 0.6875rem;
		font-weight: 500;
		white-space: nowrap;
	}

	.status-dot {
		width: 0.375rem;
		height: 0.375rem;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.app-name {
		font-size: 0.9375rem;
		font-weight: 600;
		color: hsl(var(--foreground, 0 0% 9%));
		margin: 0 0 0.25rem;
	}

	.app-tagline {
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground, 0 0% 45%));
		margin: 0;
		line-height: 1.4;
		flex: 1;
	}

	.app-card-footer {
		margin-top: 0.75rem;
	}

	.open-label {
		font-size: 0.8125rem;
		font-weight: 600;
		transition: opacity 0.15s;
	}

	.app-card:hover .open-label {
		opacity: 0.8;
	}

	.coming-soon-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--muted-foreground, 0 0% 45%));
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
		background: hsl(var(--muted, 0 0% 96%));
	}

	/* Legend */
	.legend {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 0;
		border-top: 1px solid hsl(var(--border, 0 0% 90%));
		margin-top: 1rem;
		flex-wrap: wrap;
	}

	.legend-title {
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--muted-foreground, 0 0% 45%));
	}

	.legend-item {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground, 0 0% 45%));
	}

	.legend-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		flex-shrink: 0;
	}
</style>
