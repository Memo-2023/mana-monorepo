<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';

	export interface TableColumn {
		key: string;
		label: string;
		width?: string;
		align?: 'left' | 'center' | 'right';
		hideOnMobile?: boolean;
		hideOnTablet?: boolean;
	}

	interface Props {
		columns: TableColumn[];
		items: any[];
		title?: string;
		mobileBreakpoint?: number;
		tabletBreakpoint?: number;
		emptyMessage?: string;
		children: Snippet<[any, TableColumn[]]>;
		mobileCard?: Snippet<[any]>;
	}

	let {
		columns,
		items,
		title,
		mobileBreakpoint = 768,
		tabletBreakpoint = 1024,
		emptyMessage = 'No items found',
		children,
		mobileCard
	}: Props = $props();

	let windowWidth = $state(typeof window !== 'undefined' ? window.innerWidth : 1200);
	let isMobile = $derived(windowWidth < mobileBreakpoint);
	let isTablet = $derived(windowWidth >= mobileBreakpoint && windowWidth < tabletBreakpoint);
	let isDesktop = $derived(windowWidth >= tabletBreakpoint);

	// Filter columns based on screen size
	let visibleColumns = $derived(
		columns.filter(col => {
			if (isMobile && col.hideOnMobile) return false;
			if (isTablet && col.hideOnTablet) return false;
			return true;
		})
	);

	// Generate grid template columns
	let gridTemplate = $derived(() => {
		if (isMobile) return 'grid-cols-1';
		
		const widths = visibleColumns.map(col => {
			if (col.width === 'flex') return '1fr';
			if (col.width) return col.width;
			return 'auto';
		});
		
		// For Tailwind, we need to use predefined classes or inline styles
		return widths.join(' ');
	});

	onMount(() => {
		const handleResize = () => {
			windowWidth = window.innerWidth;
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});

	function getAlignment(align?: string) {
		switch (align) {
			case 'center': return 'text-center justify-center';
			case 'right': return 'text-right justify-end';
			default: return 'text-left justify-start';
		}
	}
</script>

{#if items && items.length > 0}
	<div class="rounded-xl border border-theme-border bg-theme-surface shadow-xl overflow-hidden">
		{#if title}
			<div class="border-b border-theme-border bg-theme-surface-hover px-6 py-4">
				<h2 class="text-xl font-semibold text-theme-text">
					{title}
				</h2>
			</div>
		{/if}

		{#if isMobile && renderMobileCard}
			<!-- Mobile Card View -->
			<div class="divide-y divide-theme-border">
				{#each items as item}
					{@html renderMobileCard(item)}
				{/each}
			</div>
		{:else}
			<!-- Desktop/Tablet Table View -->
			<!-- Table Header -->
			<div 
				class="hidden md:grid items-center gap-4 border-b border-theme-border bg-theme-surface-hover px-6 py-3 text-sm font-medium text-theme-text"
				style="grid-template-columns: {visibleColumns.map(col => col.width === 'flex' ? '1fr' : (col.width || 'auto')).join(' ')}"
			>
				{#each visibleColumns as column}
					<div class={getAlignment(column.align)}>
						{column.label}
					</div>
				{/each}
			</div>

			<!-- Table Body -->
			<div class="divide-y divide-theme-border">
				{#each items as item}
					<!-- Desktop Row -->
					<div 
						class="hidden md:grid items-center gap-4 px-6 py-4 transition-colors hover:bg-theme-surface-hover"
						style="grid-template-columns: {visibleColumns.map(col => col.width === 'flex' ? '1fr' : (col.width || 'auto')).join(' ')}"
					>
						{#each visibleColumns as column}
							<div class={getAlignment(column.align)}>
								{#if column.render}
									{@html column.render(item)}
								{:else if column.key.includes('.')}
									<!-- Handle nested properties -->
									{@const keys = column.key.split('.')}
									{@const value = keys.reduce((obj, key) => obj?.[key], item)}
									{value || '-'}
								{:else}
									{item[column.key] || '-'}
								{/if}
							</div>
						{/each}
					</div>

					<!-- Mobile Card -->
					<div class="md:hidden p-4 space-y-3 bg-theme-surface hover:bg-theme-surface-hover transition-colors">
						{#if renderMobileCard}
							{@html renderMobileCard(item)}
						{:else}
							<!-- Default mobile layout -->
							<div class="space-y-2">
								{#each columns.filter(col => !col.hideOnMobile) as column}
									<div class="flex justify-between items-center text-sm">
										<span class="font-medium text-theme-text-muted">{column.label}:</span>
										<span class="text-theme-text">
											{#if column.render}
												{@html column.render(item)}
											{:else if column.key.includes('.')}
												{@const keys = column.key.split('.')}
												{@const value = keys.reduce((obj, key) => obj?.[key], item)}
												{value || '-'}
											{:else}
												{item[column.key] || '-'}
											{/if}
										</span>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
{:else}
	<div class="rounded-lg border border-theme-border bg-theme-surface p-8 text-center shadow-md">
		<p class="text-theme-text-muted">
			{emptyMessage}
		</p>
	</div>
{/if}

<style>
	/* Add any custom styles if needed */
</style>