<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { useAllPages, pagesForSite } from '$lib/modules/website/queries';

	const siteId = $derived($page.params.siteId ?? '');
	const pages = useAllPages();
	const sitePages = $derived(pagesForSite(pages.value, siteId));

	// Redirect to the first (ordered) page's editor as soon as pages load.
	$effect(() => {
		if (siteId && sitePages.length > 0) {
			const first = sitePages[0];
			void goto(`/website/${siteId}/edit/${first.id}`, { replaceState: true });
		}
	});
</script>

<svelte:head>
	<title>Website - Mana</title>
</svelte:head>

<div class="wb-redirect">
	<p>Öffne Editor…</p>
</div>

<style>
	.wb-redirect {
		padding: 3rem;
		text-align: center;
		opacity: 0.5;
	}
</style>
