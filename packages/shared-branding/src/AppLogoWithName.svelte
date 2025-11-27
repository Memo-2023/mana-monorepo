<script lang="ts">
	import type { AppId } from './types';
	import { APP_BRANDING } from './config';
	import AppLogo from './AppLogo.svelte';

	interface Props {
		/** App to show logo for */
		app: AppId;
		/** Logo size in pixels */
		size?: number;
		/** Override color */
		color?: string;
		/** Show app name */
		showName?: boolean;
		/** Name font size */
		nameFontSize?: string;
		/** Gap between logo and name */
		gap?: string;
		/** Additional CSS classes */
		class?: string;
	}

	let {
		app,
		size = 28,
		color,
		showName = true,
		nameFontSize = '1.25rem',
		gap = '0.5rem',
		class: className = '',
	}: Props = $props();

	const branding = $derived(APP_BRANDING[app]);
</script>

<a href="/" class="app-logo-with-name {className}" style="gap: {gap};">
	<AppLogo {app} {size} {color} />
	{#if showName}
		<span
			class="app-logo-with-name__text"
			style="font-size: {nameFontSize}; color: {color ?? 'inherit'};"
		>
			{branding.name}
		</span>
	{/if}
</a>

<style>
	.app-logo-with-name {
		display: flex;
		align-items: center;
		text-decoration: none;
	}

	.app-logo-with-name__text {
		font-weight: 700;
		white-space: nowrap;
	}
</style>
