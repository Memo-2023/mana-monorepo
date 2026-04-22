<script lang="ts">
	/**
	 * /admin/user-data — deep-links into the User Data tab of the admin card.
	 * The per-user detail route /admin/user-data/[userId] stays route-based.
	 */
	import ListView from '$lib/modules/admin/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<RoutePage appId="admin">
	<ListView initialTab="user-data" />
</RoutePage>
