<script lang="ts">
	/**
	 * Memoro GlassCard
	 * Re-exports from @manacore/shared-ui for backward compatibility
	 */
	import { GlassCard } from '@manacore/shared-ui';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		class?: string;
	}

	let { children, class: className = '' }: Props = $props();
</script>

<GlassCard class={className}>
	{@render children()}
</GlassCard>
