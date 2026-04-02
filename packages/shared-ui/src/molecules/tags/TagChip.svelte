<script lang="ts">
	import { DEFAULT_TAG_COLOR } from './constants';

	/**
	 * Compact inline tag chip for use in list items, cards, and metadata rows.
	 * Smaller than TagBadge — designed to sit alongside other metadata like dates and icons.
	 */

	interface Props {
		name: string;
		color?: string | null;
		/** Extra CSS classes */
		class?: string;
	}

	let { name, color, class: className = '' }: Props = $props();

	const tagColor = $derived(color ?? DEFAULT_TAG_COLOR);
</script>

<span
	class="inline-block rounded-full px-1.5 py-0.5 text-[0.625rem] font-medium leading-tight {className}"
	style="background: color-mix(in srgb, {tagColor} 15%, transparent); color: {tagColor}"
>
	{name}
</span>
