<script lang="ts">
	/**
	 * /spaces — Spaces top-level route.
	 *
	 * Renders the workbench-card ListView from `$lib/modules/spaces/`.
	 * Same component runs inside the workbench via registerApp and here
	 * as a standalone page.
	 */

	import ListView from '$lib/modules/spaces/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<RoutePage appId="spaces">
	<ListView />
</RoutePage>
