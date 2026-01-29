<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { skillStore } from '$lib/stores/skills.svelte';
	import { authStore } from '$lib/stores/auth.svelte';

	let { children } = $props();

	let loading = $state(true);

	onMount(async () => {
		await Promise.all([authStore.initialize(), skillStore.initialize()]);
		loading = false;
	});
</script>

<svelte:head>
	<title>SkillTree - Level Up Your Life</title>
	<meta name="description" content="Track your skills like a game. Level up in real life." />
</svelte:head>

{#if loading}
	<div class="flex min-h-screen items-center justify-center bg-gray-900">
		<div class="text-center">
			<div class="mb-4 text-6xl">🌳</div>
			<div class="text-xl text-gray-300">Loading SkillTree...</div>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-gray-900 text-gray-100">
		{@render children()}
	</div>
{/if}
