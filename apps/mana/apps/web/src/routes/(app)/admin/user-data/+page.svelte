<script lang="ts">
	/**
	 * /admin/user-data — renders the workbench-card ListView.
	 * Admin-role guard lives in the parent layout and inside the ListView.
	 * The per-user detail route /admin/user-data/[userId] stays route-based.
	 */

	import ListView from '$lib/modules/admin-user-data/ListView.svelte';
</script>

<ListView />
