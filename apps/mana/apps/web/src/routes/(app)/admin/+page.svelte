<script lang="ts">
	/**
	 * /admin — renders the admin workbench card with the Overview tab.
	 */
	import ListView from '$lib/modules/admin/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<RoutePage appId="admin">
	<ListView initialTab="overview" />
</RoutePage>
