<script lang="ts">
	/**
	 * PanelControls Component
	 * Controls overlay for split panel (swap, close).
	 */

	interface Props {
		panelName: string;
		onSwap: () => void;
		onClose: () => void;
	}

	let { panelName, onSwap, onClose }: Props = $props();
</script>

<div class="panel-controls">
	<span class="panel-label">{panelName}</span>

	<div class="control-buttons">
		<button class="control-btn" title="Swap panels" onclick={onSwap}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M16 3l4 4-4 4" />
				<path d="M20 7H4" />
				<path d="M8 21l-4-4 4-4" />
				<path d="M4 17h16" />
			</svg>
		</button>

		<button class="control-btn close" title="Close panel" onclick={onClose}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<line x1="18" y1="6" x2="6" y2="18" />
				<line x1="6" y1="6" x2="18" y2="18" />
			</svg>
		</button>
	</div>
</div>

<style>
	.panel-controls {
		position: absolute;
		top: 8px;
		right: 8px;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 4px 8px;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(8px);
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		z-index: 20;
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.app-panel:hover .panel-controls,
	.panel-controls:focus-within {
		opacity: 1;
	}

	.panel-label {
		font-size: 12px;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.8);
		padding: 0 4px;
	}

	.control-buttons {
		display: flex;
		gap: 4px;
	}

	.control-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		padding: 0;
		background: rgba(255, 255, 255, 0.1);
		border: none;
		border-radius: 6px;
		cursor: pointer;
		color: rgba(255, 255, 255, 0.8);
		transition: all 0.15s ease;
	}

	.control-btn:hover {
		background: rgba(255, 255, 255, 0.2);
		color: white;
	}

	.control-btn.close:hover {
		background: rgba(239, 68, 68, 0.3);
		color: #ef4444;
	}
</style>
