<script lang="ts">
	/**
	 * SkeletonAvatar - Circular skeleton for profile pictures/avatars
	 *
	 * @example
	 * ```svelte
	 * <SkeletonAvatar size="40px" />
	 * <SkeletonAvatar size="64px" />
	 * ```
	 */

	import SkeletonBox from './SkeletonBox.svelte';

	interface Props {
		/** Size of the avatar (width & height) */
		size?: string;
		/** Additional CSS classes */
		class?: string;
	}

	let { size = '40px', class: className = '' }: Props = $props();
</script>

<SkeletonBox width={size} height={size} circle class={className} />
