<script lang="ts">
	import '../app.css';
	import '$lib/i18n';
	import { onMount } from 'svelte';
	import { isLoading as i18nLoading } from 'svelte-i18n';
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';
	import { memoroStore } from '$lib/data/local-store';
	import { AppLoadingSkeleton } from '@manacore/shared-ui';

	let { children } = $props();

	let loading = $state(true);

	let appReady = $derived(!loading && !$i18nLoading);

	onMount(async () => {
		theme.initialize();
		await memoroStore.initialize();
		await authStore.initialize();

		if (authStore.isAuthenticated) {
			memoroStore.startSync();
		}

		loading = false;
	});
</script>

<svelte:head>
	<meta
		name="description"
		content="AI-powered voice recording and memo management. Record, transcribe, and organize your thoughts."
	/>
	<meta property="og:title" content="Memoro - Voice Memos" />
	<meta property="og:description" content="AI-powered voice recording and memo management." />
	<meta property="og:type" content="website" />
</svelte:head>

{#if !appReady}
	<AppLoadingSkeleton layout="list" />
{:else}
	<div class="min-h-screen bg-background text-foreground">
		{@render children()}
	</div>
{/if}
