<script lang="ts">
	import type { Tag } from '$lib/types/memo.types';

	let {
		tag,
		removable = false,
		clickable = false,
		onRemove,
		onClick
	}: {
		tag: Tag;
		removable?: boolean;
		clickable?: boolean;
		onRemove?: () => void;
		onClick?: () => void;
	} = $props();

	// Get tag color from either style.color (new format) or color (old format)
	const tagColor = tag.style?.color || tag.color || '#3b82f6';

	function handleClick() {
		if (clickable && onClick) {
			onClick();
		}
	}

	function handleRemove(e: Event) {
		e.stopPropagation();
		if (onRemove) {
			onRemove();
		}
	}
</script>

<span
	class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-all"
	class:cursor-pointer={clickable}
	class:hover:scale-105={clickable}
	style="background-color: {tagColor}20; color: {tagColor}"
	onclick={handleClick}
	role={clickable ? 'button' : undefined}
	tabindex={clickable ? 0 : undefined}
>
	<!-- Color indicator dot -->
	<div class="h-2 w-2 rounded-full" style="background-color: {tagColor}"></div>

	<span>{tag.name || tag.text}</span>
	{#if removable}
		<button
			onclick={handleRemove}
			class="ml-1 rounded-full hover:bg-black/10 p-0.5 transition-colors"
			title="Remove tag"
			aria-label="Remove tag"
		>
			<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
	{/if}
</span>
