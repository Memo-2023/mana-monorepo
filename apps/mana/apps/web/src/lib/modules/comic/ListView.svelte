<!--
  Comic module root — thin wrapper around the story grid. Wardrobe-
  style face-banner is kept in ListView.svelte (the list) rather
  than here, because creating a story already has its own face-ref
  check in CharacterPicker. Module root is as small as possible.
-->
<script lang="ts">
	import ListView from './views/ListView.svelte';
</script>

<div class="comic-root">
	<ListView />
</div>

<style>
	.comic-root {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		height: 100%;
		padding: 0.5rem 0.75rem 0.75rem;
		container-type: inline-size;
	}
	@container (min-width: 640px) {
		.comic-root {
			padding: 0.75rem 1rem 1rem;
			gap: 1rem;
		}
	}
</style>
