<script lang="ts">
	/**
	 * /spaces/members — legacy alias.
	 *
	 * The member-management UI moved to `/spaces` as the canonical route
	 * (and workbench card). This path stays as a passthrough so existing
	 * links (SpaceSwitcher, SpaceCreateDialog) keep working.
	 */

	import ListView from '$lib/modules/spaces/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<RoutePage appId="spaces" title="Spaces · Mitglieder">
	<ListView />
</RoutePage>
