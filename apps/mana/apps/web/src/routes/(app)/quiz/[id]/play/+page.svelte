<script lang="ts">
	import { page } from '$app/stores';
	import PlayView from '$lib/modules/quiz/PlayView.svelte';

	const quizId = $derived($page.params.id ?? '');
</script>

<svelte:head>
	<title>Quiz spielen - Mana</title>
</svelte:head>

{#key quizId}
	<PlayView {quizId} />
{/key}
