<script lang="ts">
	import { page } from '$app/stores';
	import DetailView from '$lib/modules/articles/views/DetailView.svelte';
	import { RoutePage } from '$lib/components/shell';

	const id = $derived($page.params.id ?? '');
</script>

<RoutePage appId="articles" backHref="/articles" title="Artikel">
	<DetailView {id} />
</RoutePage>
