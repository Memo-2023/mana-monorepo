<!--
  Writing — Module-root ListView.
  Mirrors the library/ convention: a thin wrapper that delegates to the
  real view in views/ so the route file doesn't need to know about the
  internal structure.
-->
<script lang="ts">
	import ListView from './views/ListView.svelte';
</script>

<ListView />
