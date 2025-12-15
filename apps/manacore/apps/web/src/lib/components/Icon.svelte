<script lang="ts">
	/**
	 * Icon Component - Wrapper for phosphor-svelte icons
	 * NOTE: This is a legacy wrapper. Use phosphor-svelte icons directly instead.
	 * Example: import { House, User } from '@manacore/shared-icons';
	 */

	interface Props {
		name: string;
		size?: number;
		class?: string;
		color?: string;
	}

	let { name, size = 24, class: className = '', color }: Props = $props();
</script>

<span
	class="text-orange-500"
	title="Icon component is deprecated. Use direct imports from @manacore/shared-icons instead."
>
	⚠ {name}
</span>
