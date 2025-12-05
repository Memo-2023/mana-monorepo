<script lang="ts">
	import NodeList from '$lib/components/NodeList.svelte';

	let { data } = $props();
</script>

<NodeList
	kind="object"
	kindLabel="Objekt"
	kindLabelPlural="Objekte"
	description="Verwalte wichtige Gegenstände und Artefakte deiner Welt"
	user={data.user}
/>
