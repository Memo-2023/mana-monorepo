<script lang="ts">
	import DetailView from '$lib/modules/wishes/views/DetailView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<RoutePage appId="wishes" backHref="/wishes" title="Wunsch">
	<DetailView />
</RoutePage>
