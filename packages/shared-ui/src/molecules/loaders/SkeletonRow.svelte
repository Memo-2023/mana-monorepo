<script lang="ts">
	/**
	 * SkeletonRow - Single row skeleton with avatar and text
	 *
	 * @example
	 * ```svelte
	 * <SkeletonRow showAvatar />
	 * <SkeletonRow opacity={0.5} />
	 * ```
	 */

	import SkeletonBox from './SkeletonBox.svelte';
	import SkeletonAvatar from './SkeletonAvatar.svelte';

	interface Props {
		/** Show avatar placeholder */
		showAvatar?: boolean;
		/** Avatar size */
		avatarSize?: string;
		/** Opacity for fade effect */
		opacity?: number;
		/** Show secondary line */
		showSecondaryLine?: boolean;
		/** Show right-side content */
		showRightContent?: boolean;
		/** Additional CSS classes */
		class?: string;
	}

	let {
		showAvatar = true,
		avatarSize = '40px',
		opacity = 1,
		showSecondaryLine = true,
		showRightContent = true,
		class: className = '',
	}: Props = $props();
</script>

<div
	class="skeleton-row flex items-center gap-3 border-b border-border px-4 py-3 {className}"
	style="opacity: {opacity};"
	role="status"
	aria-label="Loading"
>
	{#if showAvatar}
		<SkeletonAvatar size={avatarSize} />
	{/if}
	<div class="flex-1 min-w-0">
		<SkeletonBox width="45%" height="16px" />
		{#if showSecondaryLine}
			<div class="mt-1.5">
				<SkeletonBox width="65%" height="13px" />
			</div>
		{/if}
	</div>
	{#if showRightContent}
		<SkeletonBox width="70px" height="13px" />
	{/if}
</div>
