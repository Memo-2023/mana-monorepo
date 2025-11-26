<script lang="ts">
	import type { ContentModuleProps } from '../types';

	let {
		text = '',
		html = '',
		items = [],
		truncate = false,
		maxLines = 3
	}: ContentModuleProps = $props();

	let truncateClass = $derived(truncate ? `line-clamp-${maxLines}` : '');
</script>

<div class="content-module">
	{#if html}
		{@html html}
	{:else if text}
		<p class="text-theme-text {truncateClass}">{text}</p>
	{:else if items.length > 0}
		<ul class="space-y-2">
			{#each items as item}
				<li class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						{#if item.icon}
							<span class="text-theme-text-muted">{item.icon}</span>
						{/if}
						<span class="text-sm text-theme-text">{item.label}</span>
					</div>
					<span class="font-medium text-theme-text">{item.value}</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.line-clamp-1 {
		overflow: hidden;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 1;
	}

	.line-clamp-2 {
		overflow: hidden;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
	}

	.line-clamp-3 {
		overflow: hidden;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
	}

	.line-clamp-4 {
		overflow: hidden;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 4;
	}

	.line-clamp-5 {
		overflow: hidden;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 5;
	}
</style>
