<script lang="ts">
	import SeenplatteScene from '$lib/components/observatory/SeenplatteScene.svelte';

	let selectedApp = $state<string | null>(null);

	function handleSelectApp(appId: string) {
		selectedApp = appId;
	}
</script>

<div style="display: flex; flex-direction: column; gap: 1rem;">
	<div style="height: calc(100vh - 12rem); min-height: 500px; width: 100%;">
		<SeenplatteScene onSelectApp={handleSelectApp} />
	</div>

	{#if selectedApp}
		<div class="rounded-xl bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:bg-gray-800/80">
			<p class="text-sm text-gray-600 dark:text-gray-300">
				Selected: <strong>{selectedApp}</strong> — Detail panel coming in Phase 5
			</p>
		</div>
	{/if}
</div>
