<script lang="ts">
	import '../app.css';
	import '$lib/i18n';
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import { isLoading as i18nLoading, _ as t } from 'svelte-i18n';
	import { theme } from '$lib/stores/theme';
	import { ToastContainer, setupGlobalErrorHandler } from '@manacore/shared-ui';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	onMount(() => {
		const cleanupErrorHandler = setupGlobalErrorHandler();
		const cleanupTheme = theme.initialize();

		return () => {
			cleanupErrorHandler();
			cleanupTheme();
		};
	});
</script>

<svelte:head>
	<title>{$i18nLoading ? 'Matrix Chat' : $t('app.name')}</title>
	<meta name="description" content="Self-hosted Matrix chat client" />
</svelte:head>

{#if $i18nLoading}
	<!-- Loading state while i18n initializes -->
	<div class="min-h-screen bg-background flex items-center justify-center">
		<div class="animate-pulse text-muted-foreground">Laden...</div>
	</div>
{:else}
	<div class="min-h-screen bg-background text-foreground">
		{@render children()}
	</div>

	<!-- Global Toast notifications -->
	<ToastContainer />
{/if}
