<!--
  FeedbackQuickModal — Modal wrapper around FeedbackForm. Used outside
  the workbench (e.g. PillNav user-menu, /todo direct route, settings
  pages). Workbench cards render the same form inline instead.
-->
<script lang="ts">
	import { X } from '@mana/shared-icons';
	import type { FeedbackCategory } from '@mana/feedback';
	import FeedbackForm from './FeedbackForm.svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
		moduleContext?: string;
		defaultCategory?: FeedbackCategory;
		title?: string;
	}

	let props: Props = $props();
	let title = $derived(props.title ?? 'Idee oder Feedback?');

	let formRef = $state<{ reset: () => void } | null>(null);

	function handleClose() {
		formRef?.reset();
		props.onClose();
	}

	function onBackdropKey(e: KeyboardEvent) {
		if (e.key === 'Escape') handleClose();
	}
</script>

{#if props.open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="backdrop"
		role="dialog"
		aria-modal="true"
		onclick={handleClose}
		onkeydown={onBackdropKey}
		tabindex="-1"
	>
		<div class="modal" role="document" onclick={(e) => e.stopPropagation()}>
			<header class="modal-header">
				<h2>{title}</h2>
				<button class="close-btn" onclick={handleClose} aria-label="Schließen">
					<X size={18} weight="bold" />
				</button>
			</header>

			<div class="body">
				<FeedbackForm
					bind:this={formRef}
					moduleContext={props.moduleContext}
					defaultCategory={props.defaultCategory}
					onCancel={handleClose}
				/>
			</div>
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 200;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		background: hsl(0 0% 0% / 0.5);
		backdrop-filter: blur(2px);
	}

	.modal {
		width: 100%;
		max-width: 520px;
		max-height: calc(100dvh - 2rem);
		display: flex;
		flex-direction: column;
		background: hsl(var(--color-card));
		color: hsl(var(--color-foreground));
		border: 2px solid hsl(0 0% 0% / 0.12);
		border-radius: 1rem;
		box-shadow:
			0 16px 32px hsl(0 0% 0% / 0.18),
			0 6px 12px hsl(0 0% 0% / 0.1);
		overflow: hidden;
	}

	:global(.dark) .modal {
		border-color: hsl(0 0% 0% / 0.28);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.875rem 1rem 0.5rem;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 700;
		letter-spacing: -0.01em;
	}

	.close-btn {
		width: 28px;
		height: 28px;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		border-radius: 50%;
		cursor: pointer;
	}

	.close-btn:hover {
		background: hsl(var(--color-surface-hover, var(--color-muted)));
		color: hsl(var(--color-foreground));
	}

	.body {
		padding: 0.5rem 1rem 1rem;
		overflow-y: auto;
	}
</style>
