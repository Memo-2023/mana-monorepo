<script lang="ts">
	/**
	 * Central Icon Component for Memoro Web App
	 * Uses Phosphor Icons (Bold weight) from @phosphor-icons/core
	 *
	 * Usage:
	 * <Icon name="user-plus" size={24} />
	 * <Icon name="sign-in" size={20} class="text-primary" />
	 */
	import { iconPaths } from './icons/iconPaths';

	interface Props {
		name: keyof typeof iconPaths;
		size?: number;
		class?: string;
	}

	let { name, size = 24, class: className = '' }: Props = $props();

	const path = $derived(iconPaths[name]);
</script>

{#if path}
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width={size}
		height={size}
		fill="currentColor"
		viewBox="0 0 256 256"
		class={className}
		aria-hidden="true"
	>
		{@html path}
	</svg>
{:else}
	<span class="text-red-500" title="Icon '{name}' not found">⚠</span>
{/if}
