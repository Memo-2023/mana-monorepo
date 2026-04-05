<script lang="ts">
	/**
	 * SidebarSection - Grouped navigation section within a sidebar
	 *
	 * Provides a labeled section for organizing related navigation items.
	 * Supports collapsible behavior and minimized sidebar mode.
	 *
	 * @example Basic usage
	 * ```svelte
	 * <SidebarSection title="Main" items={mainNavItems} {currentPath} />
	 * ```
	 *
	 * @example Collapsible section
	 * ```svelte
	 * <SidebarSection
	 *   title="Settings"
	 *   items={settingsItems}
	 *   collapsible
	 *   expanded={false}
	 * />
	 * ```
	 */

	import type { NavItem } from './types';
	import NavLink from './NavLink.svelte';
	import { Text } from '../atoms';
	import { CaretDown } from '@mana/shared-icons';

	interface Props {
		/** Section title (hidden when minimized) */
		title?: string;
		/** Navigation items in this section */
		items: NavItem[];
		/** Current path for active state */
		currentPath?: string;
		/** Whether sidebar is minimized */
		minimized?: boolean;
		/** Whether section can be collapsed */
		collapsible?: boolean;
		/** Whether section is expanded (when collapsible) */
		expanded?: boolean;
		/** Divider above section */
		divider?: boolean;
		/** Additional CSS classes */
		class?: string;
	}

	let {
		title,
		items,
		currentPath = '',
		minimized = false,
		collapsible = false,
		expanded = $bindable(true),
		divider = false,
		class: className = '',
	}: Props = $props();

	function isActive(item: NavItem): boolean {
		if (item.active !== undefined) return item.active;
		return currentPath === item.href || currentPath.startsWith(item.href + '/');
	}

	function toggleExpanded() {
		if (collapsible) {
			expanded = !expanded;
		}
	}
</script>

<div class="sidebar-section {className}">
	{#if divider && !minimized}
		<div class="border-t border-theme my-2 mx-3"></div>
	{/if}

	{#if title && !minimized}
		{#if collapsible}
			<button
				type="button"
				class="w-full flex items-center justify-between px-3 py-1.5 text-left hover:bg-menu-hover rounded transition-colors"
				onclick={toggleExpanded}
			>
				<Text variant="small" class="text-theme-tertiary uppercase tracking-wider">
					{title}
				</Text>
				<CaretDown
					size={14}
					class="text-theme-tertiary transition-transform {expanded ? '' : '-rotate-90'}"
				/>
			</button>
		{:else}
			<div class="px-3 py-1.5">
				<Text variant="small" class="text-theme-tertiary uppercase tracking-wider">
					{title}
				</Text>
			</div>
		{/if}
	{/if}

	{#if expanded || !collapsible}
		<nav class="space-y-0.5 {title && !minimized ? 'mt-1' : ''}">
			{#each items as item}
				<NavLink {item} variant="sidebar" {minimized} active={isActive(item)} />
			{/each}
		</nav>
	{/if}
</div>
