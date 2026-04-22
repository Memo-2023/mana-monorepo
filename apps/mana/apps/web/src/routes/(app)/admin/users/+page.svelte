<script lang="ts">
	/**
	 * /admin/users — deep-links into the Users tab of the admin card.
	 */
	import ListView from '$lib/modules/admin/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<RoutePage appId="admin">
	<ListView initialTab="users" />
</RoutePage>
