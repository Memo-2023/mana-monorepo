<script lang="ts">
	import { page } from '$app/stores';
	import EditView from '$lib/modules/quiz/EditView.svelte';

	const quizId = $derived($page.params.id ?? '');
</script>

<svelte:head>
	<title>Quiz bearbeiten - Mana</title>
</svelte:head>

{#key quizId}
	<EditView {quizId} />
{/key}
