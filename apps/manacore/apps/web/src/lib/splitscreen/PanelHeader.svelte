<!--
  PanelHeader — Header bar for the split-screen right panel.
  Shows app name and close button.
-->
<script lang="ts">
	import { SPLIT_APP_LABELS, type SplitAppId } from './registry';

	let {
		appId,
		onClose,
		onSwap,
	}: {
		appId: SplitAppId | null;
		onClose: () => void;
		onSwap?: () => void;
	} = $props();

	const label = $derived(appId ? SPLIT_APP_LABELS[appId] : '');
</script>

<div
	class="flex h-10 shrink-0 items-center justify-between border-b border-white/10 bg-white/5 px-3"
>
	<span class="text-sm font-medium text-white/70">{label}</span>

	<div class="flex items-center gap-1">
		{#if onSwap}
			<button
				onclick={onSwap}
				class="rounded p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
				title="Panels tauschen"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="14"
					height="14"
					viewBox="0 0 256 256"
					fill="currentColor"
				>
					<path
						d="M224,48V152a8,8,0,0,1-13.66,5.66L180,127.31l-42.34,42.35a8,8,0,0,1-11.32,0L96,139.31,45.66,189.66a8,8,0,0,1-11.32-11.32l56-56a8,8,0,0,1,11.32,0L132,152.69,168.69,116,138.34,85.66A8,8,0,0,1,144,72H216A8,8,0,0,1,224,48Z"
					/>
				</svg>
			</button>
		{/if}

		<button
			onclick={onClose}
			class="rounded p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
			title="Panel schliessen"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="14"
				height="14"
				viewBox="0 0 256 256"
				fill="currentColor"
			>
				<path
					d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"
				/>
			</svg>
		</button>
	</div>
</div>
