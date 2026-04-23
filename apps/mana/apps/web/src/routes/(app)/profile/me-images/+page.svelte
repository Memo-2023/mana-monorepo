<script lang="ts">
	import { RoutePage } from '$lib/components/shell';
	import MeImagesView from '$lib/modules/profile/MeImagesView.svelte';
</script>

<svelte:head>
	<title>Meine Bilder · Mana</title>
</svelte:head>

<RoutePage appId="profile" backHref="/profile">
	<MeImagesView />
</RoutePage>
