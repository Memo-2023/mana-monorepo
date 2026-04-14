<script lang="ts">
	import ListView from '$lib/modules/places/ListView.svelte';
	import AiProposalInbox from '$lib/components/ai/AiProposalInbox.svelte';
</script>

<svelte:head>
	<title>Places - Mana</title>
</svelte:head>

<div class="px-4 pt-4">
	<AiProposalInbox module="places" />
</div>
<ListView navigate={() => {}} goBack={() => history.back()} params={{}} />
