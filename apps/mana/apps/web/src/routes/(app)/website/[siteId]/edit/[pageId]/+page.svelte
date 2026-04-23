<script lang="ts">
	import { page } from '$app/stores';
	import EditorView from '$lib/modules/website/views/EditorView.svelte';
	import { RoutePage } from '$lib/components/shell';
	import { useAllSites, findSite } from '$lib/modules/website/queries';

	const siteId = $derived($page.params.siteId ?? '');
	const pageId = $derived($page.params.pageId ?? '');

	const sites = useAllSites();
	const site = $derived(findSite(sites.value, siteId));
	const title = $derived(site ? `${site.name} – Editor` : 'Website – Editor');
</script>

<svelte:head>
	<title>{title} - Mana</title>
</svelte:head>

<RoutePage appId="website" backHref="/website" title={site?.name ?? 'Website'}>
	{#key pageId}
		<EditorView {siteId} {pageId} />
	{/key}
</RoutePage>
