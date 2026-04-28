<script lang="ts">
	import { ModuleShell } from '$lib/components/shell';
	import MyWishesView from '$lib/modules/feedback/views/MyWishesView.svelte';
	import { Megaphone } from '@mana/shared-icons';
</script>

<svelte:head>
	<title>Meine Wünsche · Mana</title>
</svelte:head>

<ModuleShell
	variant="fill"
	title="Meine Wünsche"
	color="#F59E0B"
	icon={Megaphone}
	backHref="/feedback"
	moduleId="community"
	hideFeedback
>
	<div class="page">
		<MyWishesView />
	</div>
</ModuleShell>

<style>
	.page {
		padding: 0.5rem 0.75rem;
	}
</style>
