<script lang="ts">
	import { page } from '$app/stores';
	import { RoutePage } from '$lib/components/shell';
	import SubmissionsView from '$lib/modules/website/views/SubmissionsView.svelte';
	import { useAllSites, findSite } from '$lib/modules/website/queries';

	const siteId = $derived($page.params.siteId ?? '');
	const sites = useAllSites();
	const site = $derived(findSite(sites.value, siteId));
</script>

<svelte:head>
	<title>{site?.name ?? 'Website'} – Submissions</title>
</svelte:head>

<RoutePage
	appId="website"
	backHref={`/website/${siteId}`}
	title={site ? `${site.name} – Submissions` : 'Submissions'}
>
	<SubmissionsView {siteId} />
</RoutePage>
