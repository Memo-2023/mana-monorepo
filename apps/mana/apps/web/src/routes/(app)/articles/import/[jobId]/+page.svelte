<script lang="ts">
	import { page } from '$app/stores';
	import JobDetailView from '$lib/modules/articles/components/JobDetailView.svelte';
	import { RoutePage } from '$lib/components/shell';

	const jobId = $derived($page.params.jobId ?? '');
</script>

<svelte:head>
	<title>Artikel-Import — Mana</title>
</svelte:head>

<RoutePage appId="articles" backHref="/articles/import">
	{#if jobId}
		<JobDetailView {jobId} />
	{/if}
</RoutePage>
