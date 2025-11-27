<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	// Props
	export let blockType = '';
	export let blockName = '';
	export let color: number = 0xffffff;
	export let emissive: number | undefined = undefined;
	export let opacity: number = 1;
	export let selected = false;
	export let topColor: number | undefined = undefined;
	export let sideColor: number | undefined = undefined;

	const dispatch = createEventDispatcher();

	function handleClick() {
		dispatch('select', { blockType });
	}
</script>

<button
	type="button"
	class="block-button"
	class:selected
	title={blockName}
	on:click={handleClick}
	on:keydown={(e) => e.key === 'Enter' && handleClick()}
	aria-pressed={selected}
>
	{#if topColor !== undefined && sideColor !== undefined}
		<div class="grass-style">
			<div
				class="grass-preview-top"
				style="background-color: #{topColor ? topColor.toString(16).padStart(6, '0') : '559944'};"
			></div>
			<div
				class="grass-preview-bottom"
				style="background-color: #{sideColor ? sideColor.toString(16).padStart(6, '0') : '8B4513'};"
			></div>
		</div>
	{:else}
		<div
			class="color-style"
			style="
        background-color: #{color.toString(16).padStart(6, '0')};
        opacity: {opacity};
        box-shadow: {emissive
				? `inset 0 0 10px #${emissive.toString(16).padStart(6, '0')}`
				: 'none'};
      "
		></div>
	{/if}
</button>

<style>
	.block-button {
		width: 44px;
		height: 44px;
		border: 2px solid #718096;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease-in-out;
		display: flex;
		justify-content: center;
		align-items: center;
		overflow: hidden;
		position: relative;
		padding: 0;
	}

	.block-button.selected {
		border-color: #4fd1c5;
		box-shadow: 0 0 12px #4fd1c5;
	}

	.block-button:hover {
		transform: scale(1.1);
		border-color: #a0aec0;
	}

	.grass-style {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
	}

	.grass-preview-top {
		width: 100%;
		height: 40%;
	}

	.grass-preview-bottom {
		width: 100%;
		height: 60%;
	}

	.color-style {
		width: 100%;
		height: 100%;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
	}
</style>
