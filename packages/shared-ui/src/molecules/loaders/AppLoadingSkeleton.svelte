<script lang="ts">
	/**
	 * AppLoadingSkeleton - Full page loading skeleton for app initialization
	 *
	 * A flexible loading skeleton that supports different layout presets:
	 * - list: Default list view with search bar and item rows
	 * - centered: Centered content (ideal for clock, calendar previews)
	 * - sidebar: Sidebar + main content layout
	 * - tasks: Task list with quick-add bar
	 * - minimal: Just a centered spinner placeholder
	 *
	 * @example
	 * ```svelte
	 * <AppLoadingSkeleton />
	 * <AppLoadingSkeleton layout="centered" appLogo="/logo.svg" />
	 * <AppLoadingSkeleton layout="sidebar" />
	 * ```
	 */

	import SkeletonBox from './SkeletonBox.svelte';
	import type { Snippet } from 'svelte';

	type LayoutPreset = 'list' | 'centered' | 'sidebar' | 'tasks' | 'minimal';

	interface Props {
		/** Layout preset for the content area */
		layout?: LayoutPreset;
		/** Show header skeleton (default: true, false for minimal) */
		showHeader?: boolean;
		/** Number of list items to show (for list/tasks layouts) */
		listItemCount?: number;
		/** App logo URL (shown in centered layout) */
		appLogo?: string;
		/** Loading text for screen readers */
		loadingLabel?: string;
		/** Custom content slot (overrides preset content) */
		children?: Snippet;
	}

	let {
		layout = 'list',
		showHeader = true,
		listItemCount = 5,
		appLogo,
		loadingLabel = 'App wird geladen...',
		children,
	}: Props = $props();

	// Hide header in minimal layout by default
	const displayHeader = $derived(layout === 'minimal' ? false : showHeader);
</script>

<div
	class="app-loading-skeleton"
	class:minimal-layout={layout === 'minimal'}
	class:sidebar-layout={layout === 'sidebar'}
	role="status"
	aria-label={loadingLabel}
>
	{#if displayHeader}
		<!-- Header Skeleton -->
		<div class="header-skeleton">
			<SkeletonBox width="120px" height="32px" borderRadius="8px" />
			<div class="header-nav">
				<SkeletonBox width="80px" height="32px" borderRadius="16px" />
				<SkeletonBox width="80px" height="32px" borderRadius="16px" />
				<SkeletonBox width="80px" height="32px" borderRadius="16px" />
			</div>
			<SkeletonBox width="36px" height="36px" borderRadius="50%" />
		</div>
	{/if}

	<!-- Content Area -->
	{#if children}
		<!-- Custom content via slot -->
		<div class="content-skeleton custom-content">
			{@render children()}
		</div>
	{:else if layout === 'minimal'}
		<!-- Minimal: Centered spinner placeholder -->
		<div class="minimal-content">
			<SkeletonBox width="64px" height="64px" borderRadius="50%" />
			<SkeletonBox width="120px" height="16px" borderRadius="4px" />
		</div>
	{:else if layout === 'centered'}
		<!-- Centered: Logo + preview card -->
		<div class="centered-content">
			{#if appLogo}
				<img src={appLogo} alt="" class="app-logo" />
			{:else}
				<SkeletonBox width="64px" height="64px" borderRadius="16px" />
			{/if}
			<SkeletonBox width="180px" height="24px" borderRadius="8px" />

			<div class="centered-card">
				<div class="card-header">
					<SkeletonBox width="120px" height="20px" />
					<div class="card-actions">
						<SkeletonBox width="32px" height="32px" borderRadius="8px" />
						<SkeletonBox width="32px" height="32px" borderRadius="8px" />
					</div>
				</div>
				<div class="card-content">
					{#each Array(4) as _, i}
						<SkeletonBox
							width="100%"
							height="32px"
							borderRadius="8px"
							class="opacity-{Math.max(30, 100 - i * 20)}"
						/>
					{/each}
				</div>
			</div>

			<SkeletonBox width="140px" height="16px" borderRadius="4px" />
		</div>
	{:else if layout === 'sidebar'}
		<!-- Sidebar: Left sidebar + main content -->
		<div class="sidebar-wrapper">
			<aside class="sidebar-skeleton">
				<div class="sidebar-header">
					<SkeletonBox width="100%" height="40px" borderRadius="8px" />
				</div>
				<nav class="sidebar-nav">
					<SkeletonBox width="100%" height="40px" borderRadius="8px" />
					<div class="sidebar-divider">
						<SkeletonBox width="80px" height="12px" />
					</div>
					{#each Array(4) as _}
						<SkeletonBox width="100%" height="40px" borderRadius="8px" />
					{/each}
				</nav>
			</aside>
			<main class="main-skeleton">
				<div class="main-header">
					<SkeletonBox width="200px" height="32px" />
					<SkeletonBox width="120px" height="16px" />
				</div>
				<div class="main-toolbar">
					<SkeletonBox width="100%" height="40px" borderRadius="8px" class="flex-1" />
					<SkeletonBox width="120px" height="40px" borderRadius="8px" />
					<SkeletonBox width="100px" height="40px" borderRadius="8px" />
				</div>
				<div class="main-content">
					{#each Array(listItemCount) as _, i}
						<div style="opacity: {Math.max(0.3, 1 - i * 0.15)}">
							<SkeletonBox width="100%" height="80px" borderRadius="12px" />
						</div>
					{/each}
				</div>
			</main>
		</div>
	{:else if layout === 'tasks'}
		<!-- Tasks: Quick-add + task sections -->
		<div class="content-skeleton tasks-content">
			<div class="tasks-header">
				<SkeletonBox width="180px" height="28px" />
				<SkeletonBox width="220px" height="16px" />
			</div>

			<div class="quick-add">
				<SkeletonBox width="100%" height="52px" borderRadius="12px" />
			</div>

			<div class="task-section">
				<div class="section-header">
					<SkeletonBox width="100px" height="20px" />
					<SkeletonBox width="28px" height="28px" borderRadius="50%" />
				</div>
				<div class="task-list">
					{#each Array(listItemCount) as _, i}
						<div class="task-item" style="opacity: {Math.max(0.3, 1 - i * 0.18)}">
							<SkeletonBox width="22px" height="22px" borderRadius="6px" />
							<div class="task-content">
								<SkeletonBox width="{70 - i * 8}%" height="18px" />
								<SkeletonBox width="{40 + i * 5}%" height="14px" />
							</div>
							<SkeletonBox width="24px" height="24px" borderRadius="4px" />
						</div>
					{/each}
				</div>
			</div>
		</div>
	{:else}
		<!-- List (default): Search + item rows -->
		<div class="content-skeleton list-content">
			<div class="title-row">
				<SkeletonBox width="200px" height="32px" />
				<SkeletonBox width="120px" height="40px" borderRadius="8px" />
			</div>

			<SkeletonBox width="100%" height="48px" borderRadius="12px" />

			<div class="list-skeleton">
				{#each Array(listItemCount) as _, i}
					<div class="list-item" style="opacity: {Math.max(0.3, 1 - i * 0.15)}">
						<SkeletonBox width="48px" height="48px" borderRadius="50%" />
						<div class="item-content">
							<SkeletonBox width="60%" height="18px" />
							<SkeletonBox width="40%" height="14px" />
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.app-loading-skeleton {
		min-height: 100vh;
		background: hsl(var(--color-background));
	}

	.app-loading-skeleton.sidebar-layout {
		display: flex;
		flex-direction: column;
	}

	/* Header */
	.header-skeleton {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 2rem;
		border-bottom: 1px solid hsl(var(--color-border));
	}

	.header-nav {
		display: flex;
		gap: 0.5rem;
	}

	/* Content Areas */
	.content-skeleton {
		max-width: 80rem;
		margin: 0 auto;
		padding: 2rem;
	}

	.custom-content {
		padding: 0;
		max-width: none;
	}

	/* Minimal Layout */
	.minimal-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		gap: 1rem;
	}

	/* Centered Layout */
	.centered-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: calc(100vh - 80px);
		padding: 2rem;
		gap: 1.5rem;
	}

	.app-logo {
		width: 64px;
		height: 64px;
		object-fit: contain;
	}

	.centered-card {
		width: 100%;
		max-width: 400px;
		background: hsl(var(--color-card));
		border-radius: 16px;
		padding: 1.5rem;
	}

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.card-actions {
		display: flex;
		gap: 0.5rem;
	}

	.card-content {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	/* Sidebar Layout */
	.sidebar-wrapper {
		display: flex;
		flex: 1;
		min-height: calc(100vh - 65px);
	}

	.sidebar-skeleton {
		width: 16rem;
		border-right: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-card));
		padding: 1rem;
	}

	.sidebar-header {
		padding-bottom: 1rem;
		border-bottom: 1px solid hsl(var(--color-border));
		margin-bottom: 1rem;
	}

	.sidebar-nav {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.sidebar-divider {
		padding: 1rem 0.75rem 0.5rem;
	}

	.main-skeleton {
		flex: 1;
		padding: 1.5rem;
	}

	.main-header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.main-toolbar {
		display: flex;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.main-content {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	/* Tasks Layout */
	.tasks-content {
		max-width: 48rem;
	}

	.tasks-header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.quick-add {
		margin: 1.5rem 0;
	}

	.task-section {
		margin-top: 1.5rem;
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 0;
		margin-bottom: 0.5rem;
	}

	.task-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.task-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		border-radius: 12px;
	}

	.task-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	/* List Layout (Default) */
	.list-content {
		padding: 2rem;
	}

	.title-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.5rem;
	}

	.list-skeleton {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}

	.list-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		border-radius: 12px;
	}

	.item-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.header-nav {
			display: none;
		}

		.header-skeleton {
			padding: 1rem;
		}

		.content-skeleton {
			padding: 1rem;
		}

		.sidebar-skeleton {
			display: none;
		}

		.sidebar-wrapper {
			min-height: calc(100vh - 57px);
		}

		.centered-content {
			padding: 1rem;
		}
	}
</style>
