<script lang="ts">
	/**
	 * SkeletonCard - Configurable card skeleton with avatar, title, body, footer
	 *
	 * @example
	 * ```svelte
	 * <SkeletonCard showAvatar titleLines={1} bodyLines={2} />
	 * <SkeletonCard showFooter />
	 * ```
	 */

	import SkeletonBox from './SkeletonBox.svelte';
	import SkeletonText from './SkeletonText.svelte';
	import SkeletonAvatar from './SkeletonAvatar.svelte';

	interface Props {
		/** Show avatar/image placeholder */
		showAvatar?: boolean;
		/** Avatar size */
		avatarSize?: string;
		/** Number of title lines */
		titleLines?: number;
		/** Number of body text lines */
		bodyLines?: number;
		/** Show footer section */
		showFooter?: boolean;
		/** Opacity for fade effect in lists */
		opacity?: number;
		/** Additional CSS classes */
		class?: string;
	}

	let {
		showAvatar = false,
		avatarSize = '48px',
		titleLines = 1,
		bodyLines = 2,
		showFooter = false,
		opacity = 1,
		class: className = '',
	}: Props = $props();
</script>

<div
	class="skeleton-card rounded-lg border border-border bg-card p-4 {className}"
	style="opacity: {opacity};"
>
	<div class="flex gap-3">
		{#if showAvatar}
			<SkeletonAvatar size={avatarSize} />
		{/if}
		<div class="flex-1 min-w-0">
			{#if titleLines > 0}
				<SkeletonText lines={titleLines} lineHeight="18px" gap="6px" lastLineWidth="60%" />
			{/if}
			{#if bodyLines > 0}
				<div class="mt-2">
					<SkeletonText lines={bodyLines} lineHeight="14px" gap="6px" lastLineWidth="80%" />
				</div>
			{/if}
		</div>
	</div>
	{#if showFooter}
		<div class="mt-4 flex items-center justify-between border-t border-border pt-4">
			<SkeletonBox width="80px" height="14px" />
			<SkeletonBox width="60px" height="14px" />
		</div>
	{/if}
</div>
