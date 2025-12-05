<script lang="ts">
	import NodeList from '$lib/components/NodeList.svelte';

	let { data } = $props();
</script>

<NodeList
	kind="place"
	kindLabel="Ort"
	kindLabelPlural="Orte"
	description="Erschaffe magische Orte und Schauplätze für deine Geschichten"
	user={data.user}
/>
