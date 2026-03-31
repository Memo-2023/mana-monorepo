<script lang="ts">
	import '../app.css';
	import '$lib/i18n';
	import { onMount } from 'svelte';
	import { isLoading as i18nLoading } from 'svelte-i18n';
	import { theme } from '@manacore/shared-theme';
	import { authStore } from '$lib/stores/auth.svelte';

	let { children } = $props();

	let loading = $state(true);
	let appReady = $derived(!loading && !$i18nLoading);

	onMount(() => {
		theme.initialize();
		authStore.initialize().then(() => {
			loading = false;
		});
	});
</script>

<svelte:head>
	<meta name="description" content="Schritt-für-Schritt Anleitungen, Playbooks und Lernpfade." />
	<meta property="og:title" content="Guides - Anleitungen & Playbooks" />
	<meta property="og:description" content="Erstelle und führe strukturierte Anleitungen aus." />
	<meta property="og:type" content="website" />
</svelte:head>

{#if !appReady}
	<div class="flex h-screen items-center justify-center bg-background">
		<div class="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
	</div>
{:else}
	<div class="min-h-screen bg-background text-foreground">
		{@render children()}
	</div>
{/if}
