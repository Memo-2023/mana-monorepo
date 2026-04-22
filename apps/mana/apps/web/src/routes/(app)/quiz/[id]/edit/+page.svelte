<script lang="ts">
	import { page } from '$app/stores';
	import EditView from '$lib/modules/quiz/EditView.svelte';
	import { RoutePage } from '$lib/components/shell';

	const quizId = $derived($page.params.id ?? '');
</script>

<svelte:head>
	<title>Quiz bearbeiten - Mana</title>
</svelte:head>

<RoutePage appId="quiz" backHref="/quiz" title="Quiz">
	{#key quizId}
		<EditView {quizId} />
	{/key}
</RoutePage>
