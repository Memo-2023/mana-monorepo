<script lang="ts">
	import ListView from '$lib/modules/drink/ListView.svelte';
	import AiProposalInbox from '$lib/components/ai/AiProposalInbox.svelte';
</script>

<svelte:head>
	<title>Drink - Mana</title>
</svelte:head>

<div class="px-4 pt-4">
	<AiProposalInbox module="drink" />
</div>
<ListView />
