<script lang="ts">
	/**
	 * Icon Component - Uses @manacore/shared-icons
	 * Phosphor Icons (Bold weight)
	 */
	import { iconPaths } from '@manacore/shared-icons';

	interface Props {
		name: keyof typeof iconPaths;
		size?: number;
		class?: string;
		color?: string;
	}

	let { name, size = 24, class: className = '', color }: Props = $props();

	const path = $derived(iconPaths[name]);
</script>

{#if path}
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width={size}
		height={size}
		fill={color || 'currentColor'}
		viewBox="0 0 256 256"
		class={className}
		aria-hidden="true"
	>
		{@html path}
	</svg>
{:else}
	<span class="text-red-500" title="Icon '{name}' not found">⚠</span>
{/if}
