<script lang="ts">
	import type { AppId } from './types';
	import { APP_BRANDING } from './config';

	interface Props {
		/** App to show logo for */
		app: AppId;
		/** Size in pixels */
		size?: number;
		/** Override color */
		color?: string;
		/** Additional CSS classes */
		class?: string;
	}

	let {
		app,
		size = 32,
		color,
		class: className = ''
	}: Props = $props();

	const branding = $derived(APP_BRANDING[app]);
	const fillColor = $derived(color ?? branding.primaryColor);
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width={size}
	height={size}
	viewBox={branding.logoViewBox ?? '0 0 24 24'}
	class={className}
	aria-label="{branding.name} logo"
>
	{#if branding.logoStroke}
		<path
			d={branding.logoPath}
			fill="none"
			stroke={fillColor}
			stroke-width={branding.logoStrokeWidth ?? 2}
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	{:else}
		<path
			d={branding.logoPath}
			fill={fillColor}
			fill-rule="evenodd"
			clip-rule="evenodd"
		/>
	{/if}
</svg>
