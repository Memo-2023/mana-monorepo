<script lang="ts">
	import type { AppData } from '../data/types';
	import TreePlant from './TreePlant.svelte';
	import ReedPlant from './ReedPlant.svelte';
	import WaterLily from './WaterLily.svelte';
	import Sprout from './Sprout.svelte';
	import MossCluster from './MossCluster.svelte';

	let { app, onclick }: { app: AppData; onclick?: () => void } = $props();
</script>

{#if app.plantType === 'oak' || app.plantType === 'birch' || app.plantType === 'youngTree'}
	<TreePlant {app} {onclick} />
{:else if app.plantType === 'reed'}
	<ReedPlant {app} {onclick} />
{:else if app.plantType === 'waterLily'}
	<WaterLily {app} {onclick} />
{:else if app.plantType === 'sprout'}
	<Sprout {app} {onclick} />
{:else if app.plantType === 'moss'}
	<MossCluster {app} {onclick} />
{:else}
	<!-- Fallback: render as sprout -->
	<Sprout {app} {onclick} />
{/if}
