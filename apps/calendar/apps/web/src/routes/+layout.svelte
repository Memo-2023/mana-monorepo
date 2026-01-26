<script lang="ts">
	import '../app.css';
	import '$lib/i18n';
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import ToastContainer from '$lib/components/ToastContainer.svelte';
	import { AppLoadingSkeleton } from '$lib/components/skeletons';
	import { isLoading as i18nLoading } from 'svelte-i18n';
	import { onMount } from 'svelte';

	let { children } = $props();

	let loading = $state(true);
	let appReady = $derived(!loading && !$i18nLoading);

	onMount(async () => {
		theme.initialize();
		await authStore.initialize();
		loading = false;
	});
</script>

{#if !appReady}
	<AppLoadingSkeleton />
{:else}
	<div class="h-screen flex flex-col bg-background text-foreground overflow-hidden">
		{@render children()}
	</div>
{/if}

<ToastContainer />
