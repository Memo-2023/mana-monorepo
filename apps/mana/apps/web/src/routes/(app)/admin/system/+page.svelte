<script lang="ts">
	/**
	 * /admin/system — deep-links into the System tab of the admin card.
	 */
	import ListView from '$lib/modules/admin/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<RoutePage appId="admin">
	<ListView initialTab="system" />
</RoutePage>
