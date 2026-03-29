<script lang="ts">
	import type { LocalManaLink, ManaRecordRef } from '../types.js';
	import { useLinksForRecord } from '../queries.svelte.js';
	import { linkMutations } from '../mutations.svelte.js';
	import ManaLinkBadge from './ManaLinkBadge.svelte';

	interface Props {
		recordRef: ManaRecordRef;
		onclick?: (link: LocalManaLink) => void;
		editable?: boolean;
	}

	let { recordRef, onclick, editable = false }: Props = $props();

	const links = useLinksForRecord(recordRef);

	function handleRemove(pairId: string) {
		linkMutations.deleteLinkPair(pairId);
	}
</script>

{#if (links.value ?? []).length > 0}
	<div class="manalink-list">
		{#each links.value ?? [] as link (link.id)}
			<ManaLinkBadge {link} {onclick} onRemove={editable ? handleRemove : undefined} />
		{/each}
	</div>
{/if}

<style>
	.manalink-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}
</style>
