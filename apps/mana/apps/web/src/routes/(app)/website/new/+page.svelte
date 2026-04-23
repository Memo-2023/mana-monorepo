<script lang="ts">
	import TemplatePicker from '$lib/modules/website/components/TemplatePicker.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>Neue Website – Mana</title>
</svelte:head>

<RoutePage appId="website" backHref="/website" title="Neue Website">
	<TemplatePicker />
</RoutePage>
