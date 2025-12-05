<script lang="ts">
	import NodeList from '$lib/components/NodeList.svelte';

	let { data } = $props();
</script>

<NodeList
	kind="world"
	kindLabel="Welt"
	kindLabelPlural="Welten"
	description="Erschaffe und verwalte deine fiktionalen Welten"
	user={data.user}
/>
