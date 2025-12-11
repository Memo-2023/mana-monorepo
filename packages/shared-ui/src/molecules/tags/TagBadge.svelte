<script lang="ts">
	/**
	 * Generic tag badge component
	 * Displays a colored badge with optional remove button
	 */

	interface TagData {
		/** Tag display name */
		name?: string;
		/** Alternative name field (for compatibility) */
		text?: string;
		/** Tag color (hex) */
		color?: string | null;
		/** Nested style object with color */
		style?: { color?: string };
	}

	interface Props {
		/** Tag data object */
		tag: TagData;
		/** Show remove button */
		removable?: boolean;
		/** Enable click interaction */
		clickable?: boolean;
		/** Remove callback */
		onRemove?: () => void;
		/** Click callback */
		onClick?: () => void;
	}

	let { tag, removable = false, clickable = false, onRemove, onClick }: Props = $props();

	// Get tag color from either style.color (new format) or color (old format)
	const tagColor = $derived(tag.style?.color || tag.color || '#3b82f6');
	const tagName = $derived(tag.name || tag.text || '');

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

	function handleKeyDown(e: KeyboardEvent) {
		if (clickable && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault();
			handleClick();
		}
	}
</script>

{#if clickable}
	<span
		class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-all cursor-pointer hover:scale-105"
		style="background-color: {tagColor}20; color: {tagColor}"
		onclick={handleClick}
		onkeydown={handleKeyDown}
		role="button"
		tabindex="0"
	>
		<!-- Color indicator dot -->
		<div class="h-2 w-2 rounded-full" style="background-color: {tagColor}"></div>

		<span>{tagName}</span>

		{#if removable}
			<button
				onclick={handleRemove}
				class="ml-1 rounded-full hover:bg-black/10 p-0.5 transition-colors"
				type="button"
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
{:else}
	<span
		class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium"
		style="background-color: {tagColor}20; color: {tagColor}"
	>
		<!-- Color indicator dot -->
		<div class="h-2 w-2 rounded-full" style="background-color: {tagColor}"></div>

		<span>{tagName}</span>

		{#if removable}
			<button
				onclick={handleRemove}
				class="ml-1 rounded-full hover:bg-black/10 p-0.5 transition-colors"
				type="button"
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
