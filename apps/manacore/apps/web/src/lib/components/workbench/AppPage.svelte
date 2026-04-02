<!--
  AppPage — Workbench app card. Lazy-loads the app's component inside a PageShell.
-->
<script lang="ts">
	import { SpinnerGap } from '@manacore/shared-icons';
	import { PageShell } from '$lib/components/page-carousel';
	import { getAppEntry } from './app-registry';
	import type { Component } from 'svelte';

	interface Props {
		appId: string;
		widthPx: number;
		maximized?: boolean;
		onClose: () => void;
		onMinimize?: () => void;
		onMaximize?: () => void;
		onResize?: (widthPx: number) => void;
	}

	let {
		appId,
		widthPx,
		maximized = false,
		onClose,
		onMinimize,
		onMaximize,
		onResize,
	}: Props = $props();

	let appEntry = $derived(getAppEntry(appId));
	let appName = $derived(appEntry?.name ?? appId);
	let appColor = $derived(appEntry?.color ?? '#6B7280');

	// Lazy-load app component
	let AppComponent = $state<Component | null>(null);
	let loadError = $state(false);

	$effect(() => {
		AppComponent = null;
		loadError = false;
		if (appEntry) {
			appEntry.load().then(
				(mod) => (AppComponent = mod.default),
				() => (loadError = true)
			);
		}
	});
</script>

<PageShell
	{widthPx}
	{maximized}
	title={appName}
	color={appColor}
	{onClose}
	{onMinimize}
	{onMaximize}
	{onResize}
>
	{#if loadError}
		<div class="load-state">
			<p>App konnte nicht geladen werden</p>
		</div>
	{:else if AppComponent}
		<AppComponent />
	{:else}
		<div class="load-state">
			<SpinnerGap size={24} class="spinner" />
		</div>
	{/if}
</PageShell>

<style>
	.load-state {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		min-height: 200px;
		color: #9ca3af;
		font-size: 0.8125rem;
	}

	.load-state :global(.spinner) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
