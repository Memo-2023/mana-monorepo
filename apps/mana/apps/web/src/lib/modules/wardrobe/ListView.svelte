<!--
  Wardrobe module root. For M2 it's just the Garments grid; M3 will add
  a second tab/section for Outfits. Keep the root thin so swapping the
  layout later doesn't cascade.
-->
<script lang="ts">
	import GridView from './views/GridView.svelte';
</script>

<div class="mx-auto max-w-5xl p-4 sm:p-6">
	<GridView />
</div>
