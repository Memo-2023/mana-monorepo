<script lang="ts">
	let { open = false, onclose }: { open: boolean; onclose: () => void } = $props();

	const shortcuts = [
		{ keys: ['Ctrl', '1-8'], description: 'Navigation (Home, Dashboard, Observatory, ...)' },
		{ keys: ['Esc'], description: 'Modal/Panel schliessen' },
		{ keys: ['?'], description: 'Tastaturkurzel anzeigen' },
	];

	function handleKeydown(e: KeyboardEvent) {
		if (open && e.key === 'Escape') onclose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<button type="button" class="modal-backdrop" onclick={onclose} tabindex="-1" aria-label="Close"
	></button>

	<div class="modal" role="dialog" aria-label="Tastaturkurzel">
		<div class="modal-header">
			<h2 class="modal-title">Tastaturkurzel</h2>
			<button type="button" class="close-btn" onclick={onclose} aria-label="Close">&times;</button>
		</div>

		<div class="shortcut-list">
			{#each shortcuts as shortcut}
				<div class="shortcut-row">
					<div class="shortcut-keys">
						{#each shortcut.keys as key}
							<kbd class="key">{key}</kbd>
						{/each}
					</div>
					<span class="shortcut-desc">{shortcut.description}</span>
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 50;
		background: rgba(0, 0, 0, 0.4);
		border: none;
		cursor: default;
	}

	.modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 55;
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		border-radius: 12px;
		padding: 24px;
		min-width: 320px;
		max-width: 90vw;
		box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
	}

	.modal-title {
		font-size: 16px;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin: 0;
	}

	.close-btn {
		background: none;
		border: none;
		color: hsl(var(--color-muted-foreground));
		font-size: 20px;
		cursor: pointer;
		padding: 4px 8px;
		border-radius: 6px;
	}

	.close-btn:hover {
		background: hsl(var(--color-muted));
	}

	.shortcut-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.shortcut-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
	}

	.shortcut-keys {
		display: flex;
		gap: 4px;
	}

	.key {
		display: inline-flex;
		align-items: center;
		padding: 2px 8px;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
		border-radius: 5px;
		font-size: 12px;
		font-family: system-ui, sans-serif;
		color: hsl(var(--color-foreground));
		font-weight: 500;
	}

	.shortcut-desc {
		font-size: 13px;
		color: hsl(var(--color-muted-foreground));
	}
</style>
