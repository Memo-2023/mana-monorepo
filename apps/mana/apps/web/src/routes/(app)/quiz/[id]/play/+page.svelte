<script lang="ts">
	import { page } from '$app/stores';
	import PlayView from '$lib/modules/quiz/PlayView.svelte';
	import { RoutePage } from '$lib/components/shell';

	const quizId = $derived($page.params.id ?? '');
</script>

<svelte:head>
	<title>Quiz spielen - Mana</title>
</svelte:head>

<RoutePage appId="quiz" backHref="/quiz" title="Quiz">
	{#key quizId}
		<PlayView {quizId} />
	{/key}
</RoutePage>
