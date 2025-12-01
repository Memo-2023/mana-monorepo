<script lang="ts">
	import { AppsPage } from '@manacore/shared-ui';
</script>

<svelte:head>
	<title>Alle Apps - Wisekeep</title>
</svelte:head>

<div class="apps-page-wrapper">
	<AppsPage currentAppId="wisekeep" locale="de" title="Alle Apps" />
</div>

<style>
	.apps-page-wrapper {
		min-height: 100%;
	}
</style>
