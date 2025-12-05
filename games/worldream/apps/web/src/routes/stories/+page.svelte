<script lang="ts">
	import NodeList from '$lib/components/NodeList.svelte';

	let { data } = $props();
</script>

<NodeList
	kind="story"
	kindLabel="Story"
	kindLabelPlural="Stories"
	description="Erzähle Geschichten mit deinen Charakteren und Welten"
	user={data.user}
/>
