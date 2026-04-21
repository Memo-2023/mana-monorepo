<script lang="ts">
	import { page } from '$app/stores';
	import DetailView from '$lib/modules/articles/views/DetailView.svelte';

	const id = $derived($page.params.id ?? '');
</script>

<DetailView {id} />
