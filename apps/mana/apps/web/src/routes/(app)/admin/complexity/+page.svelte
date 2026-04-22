<script lang="ts">
	/**
	 * /admin/complexity — renders the complexity workbench-card ListView.
	 * Same view as the `complexity` app, kept under /admin for parity with
	 * the other admin sub-pages.
	 */

	import ListView from '$lib/modules/complexity/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<RoutePage appId="complexity">
	<ListView />
</RoutePage>
