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
	<title>{$t('app.name')}</title>
	<meta name="description" content="Self-hosted Matrix chat client" />
</svelte:head>

<div class="min-h-screen bg-background text-foreground">
	{@render children()}
</div>

<!-- Global Toast notifications -->
<ToastContainer />
