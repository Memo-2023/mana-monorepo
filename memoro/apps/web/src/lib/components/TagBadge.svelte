<script lang="ts">
	/**
	 * Memoro TagBadge
	 * Re-exports from @manacore/shared-ui for backward compatibility
	 */
	import { TagBadge } from '@manacore/shared-ui';
	import type { Tag } from '$lib/types/memo.types';

	let {
		tag,
		removable = false,
		clickable = false,
		onRemove,
		onClick
	}: {
		tag: Tag;
		removable?: boolean;
		clickable?: boolean;
		onRemove?: () => void;
		onClick?: () => void;
	} = $props();
</script>

<TagBadge {tag} {removable} {clickable} {onRemove} {onClick} />
