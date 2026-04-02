<!--
  AppPagePicker — Shows available apps to add as pages to the workbench.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { X } from '@manacore/shared-icons';
	import { APP_REGISTRY } from './app-registry';

	interface Props {
		onSelect: (appId: string) => void;
		onClose: () => void;
		activeAppIds?: string[];
	}

	let { onSelect, onClose, activeAppIds = [] }: Props = $props();

	let availableApps = $derived(APP_REGISTRY.filter((app) => !activeAppIds.includes(app.id)));
</script>

<div class="app-picker">
	<div class="picker-header">
		<h3 class="picker-title">App hinzufügen</h3>
		<button class="close-btn" onclick={onClose} title={$_('common.close')}><X size={16} /></button>
	</div>
	<div class="picker-list">
		{#each availableApps as app, i (app.id)}
			{#if i > 0}<div class="divider"></div>{/if}
			<button class="app-option" onclick={() => onSelect(app.id)}>
				<div class="app-dot" style="background-color: {app.color}"></div>
				<span class="app-name">{app.name}</span>
			</button>
		{/each}

		{#if availableApps.length === 0}
			<div class="empty-state"><p>Alle Apps sind bereits geöffnet</p></div>
		{/if}
	</div>
</div>

<style>
	.app-picker {
		flex: 0 0 auto;
		width: min(300px, 85vw);
		min-height: 60vh;
		max-height: 80vh;
		background: #fffef5;
		border-radius: 0.375rem;
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.08),
			0 0 0 1px rgba(0, 0, 0, 0.04);
		display: flex;
		flex-direction: column;
		animation: slideIn 0.25s ease-out;
	}
	:global(.dark) .app-picker {
		background-color: #252220;
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.25),
			0 0 0 1px rgba(255, 255, 255, 0.06);
	}
	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateX(20px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.picker-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		flex-shrink: 0;
	}
	.picker-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
		margin: 0;
	}
	:global(.dark) .picker-title {
		color: #f3f4f6;
	}
	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 0.375rem;
		border: none;
		background: transparent;
		color: #9ca3af;
		cursor: pointer;
		transition: all 0.15s;
	}
	.close-btn:hover {
		background: rgba(0, 0, 0, 0.06);
		color: #374151;
	}
	:global(.dark) .close-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #f3f4f6;
	}

	.picker-list {
		flex: 1;
		overflow-y: auto;
		padding: 0 0.5rem 0.75rem;
	}
	.divider {
		height: 1px;
		background: rgba(0, 0, 0, 0.06);
		margin: 0 0.5rem;
	}
	:global(.dark) .divider {
		background: rgba(255, 255, 255, 0.06);
	}

	.app-option {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.625rem 0.5rem;
		border: none;
		background: transparent;
		cursor: pointer;
		border-radius: 0.375rem;
		transition: background 0.15s;
		text-align: left;
	}
	.app-option:hover {
		background: rgba(0, 0, 0, 0.04);
	}
	:global(.dark) .app-option:hover {
		background: rgba(255, 255, 255, 0.06);
	}

	.app-dot {
		width: 10px;
		height: 10px;
		border-radius: 9999px;
		flex-shrink: 0;
	}

	.app-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}
	:global(.dark) .app-name {
		color: #f3f4f6;
	}

	.empty-state {
		padding: 2rem 1rem;
		text-align: center;
	}
	.empty-state p {
		font-size: 0.8125rem;
		color: #9ca3af;
	}
</style>
