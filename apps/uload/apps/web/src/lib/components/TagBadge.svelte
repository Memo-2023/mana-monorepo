<script lang="ts">
	import type { Tag } from '$lib/pocketbase';

	interface Props {
		tag: Tag;
		size?: 'xs' | 'sm' | 'md' | 'lg';
		clickable?: boolean;
		removable?: boolean;
		onclick?: () => void;
		onremove?: () => void;
	}

	let {
		tag,
		size = 'sm',
		clickable = false,
		removable = false,
		onclick,
		onremove,
	}: Props = $props();

	const sizeClasses = {
		xs: 'px-1.5 py-0 text-[10px]',
		sm: 'px-2 py-0.5 text-xs',
		md: 'px-3 py-1 text-sm',
		lg: 'px-4 py-1.5 text-base',
	};

	function handleClick(e: MouseEvent) {
		if (clickable && onclick) {
			e.stopPropagation();
			onclick();
		}
	}

	function handleRemove(e: MouseEvent) {
		e.stopPropagation();
		if (onremove) {
			onremove();
		}
	}
</script>

{#if tag && tag.name}
	<span
		class="inline-flex items-center gap-1 rounded-full font-medium transition-all {sizeClasses[
			size
		]} {clickable ? 'cursor-pointer hover:scale-105' : ''}"
		style="background-color: {tag.color || '#3B82F6'}20; color: {tag.color || '#3B82F6'}"
		onclick={handleClick}
		role={clickable ? 'button' : undefined}
		tabindex={clickable ? 0 : -1}
	>
		{#if tag.icon && tag.icon.trim()}
			<span>{tag.icon}</span>
		{/if}
		<span>{tag.name}</span>
		{#if removable}
			<button
				onclick={handleRemove}
				class="ml-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
				aria-label="Remove tag"
			>
				<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		{/if}
	</span>
{/if}
