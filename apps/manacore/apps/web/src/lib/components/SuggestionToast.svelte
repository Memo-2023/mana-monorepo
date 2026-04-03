<!--
  SuggestionToast — Global inline suggestion for cross-module automations.
  Listens for 'mana:automation-suggest' events and shows a dismissable toast.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { automationsStore } from '$lib/modules/automations/stores/automations.svelte';
	import { dismissSuggestion } from '$lib/triggers/inline-suggest';
	import type { AutomationSuggestion } from '$lib/triggers/suggestions';

	let suggestion = $state<AutomationSuggestion | null>(null);
	let visible = $state(false);

	onMount(() => {
		const handler = (e: Event) => {
			const detail = (e as CustomEvent<AutomationSuggestion>).detail;
			suggestion = detail;
			visible = true;
			// Auto-dismiss after 8 seconds
			setTimeout(() => {
				if (visible && suggestion?.id === detail.id) visible = false;
			}, 8000);
		};
		window.addEventListener('mana:automation-suggest', handler);
		return () => window.removeEventListener('mana:automation-suggest', handler);
	});

	async function accept() {
		if (!suggestion) return;
		await automationsStore.create({
			name: suggestion.name,
			sourceApp: suggestion.sourceApp,
			sourceCollection: suggestion.sourceCollection,
			sourceOp: suggestion.sourceOp,
			conditionField: suggestion.conditionField,
			conditionOp: suggestion.conditionOp,
			conditionValue: suggestion.conditionValue,
			targetApp: suggestion.targetApp,
			targetAction: suggestion.targetAction,
			targetParams: suggestion.targetParams,
		});
		visible = false;
	}

	function dismiss() {
		if (suggestion) dismissSuggestion(suggestion.id);
		visible = false;
	}
</script>

{#if visible && suggestion}
	<div class="toast" role="alert">
		<div class="toast-content">
			<span class="toast-icon">&#9889;</span>
			<span class="toast-text">{suggestion.description}</span>
		</div>
		<div class="toast-actions">
			<button class="toast-accept" onclick={accept}>Aktivieren</button>
			<button class="toast-dismiss" onclick={dismiss}>&times;</button>
		</div>
	</div>
{/if}

<style>
	.toast {
		position: fixed;
		bottom: 1rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 9999;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.625rem 1rem;
		border-radius: 0.75rem;
		background: rgba(30, 30, 40, 0.95);
		border: 1px solid rgba(139, 92, 246, 0.3);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(12px);
		max-width: min(90vw, 480px);
		animation: slide-up 0.3s ease-out;
	}

	.toast-content {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		min-width: 0;
	}

	.toast-icon {
		font-size: 1rem;
		flex-shrink: 0;
	}

	.toast-text {
		font-size: 0.75rem;
		color: #e5e7eb;
		line-height: 1.3;
	}

	.toast-actions {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-shrink: 0;
	}

	.toast-accept {
		padding: 0.25rem 0.625rem;
		border-radius: 0.375rem;
		border: none;
		background: #8b5cf6;
		color: white;
		font-size: 0.6875rem;
		font-weight: 600;
		cursor: pointer;
		transition: filter 0.15s;
		white-space: nowrap;
	}
	.toast-accept:hover {
		filter: brightness(1.15);
	}

	.toast-dismiss {
		border: none;
		background: transparent;
		color: #6b7280;
		font-size: 1rem;
		cursor: pointer;
		padding: 0.125rem 0.25rem;
		line-height: 1;
	}
	.toast-dismiss:hover {
		color: #ef4444;
	}

	@keyframes slide-up {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(1rem);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}
</style>
