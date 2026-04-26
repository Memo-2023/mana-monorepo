<!--
  Community Workbench-Card view — wraps the main ListView for the
  Workbench/Homepage carousel. Renders the public feed in the card.
  Power-user views (Roadmap, single item) live as own routes.
-->
<script lang="ts">
	import ListView from './views/ListView.svelte';
</script>

<div class="community-card">
	<ListView />
</div>

<style>
	.community-card {
		height: 100%;
		overflow-y: auto;
	}
</style>
