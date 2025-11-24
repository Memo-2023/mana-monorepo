<script lang="ts">
	/**
	 * Shared Icon Component for Manacore Web Apps
	 * Uses Phosphor Icons (Bold weight)
	 *
	 * Usage:
	 * import { Icon } from '@manacore/shared-icons';
	 * <Icon name="user-plus" size={24} />
	 * <Icon name="sign-in" size={20} class="text-primary" />
	 */
	import { iconPaths } from './iconPaths';

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
