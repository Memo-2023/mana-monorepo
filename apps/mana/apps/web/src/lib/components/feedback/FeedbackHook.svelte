<!--
  FeedbackHook — Inline icon-button that opens the FeedbackQuickModal
  pre-filled with the calling module's id. Drops into ModuleShell's
  window-actions row by default; can be placed anywhere by callers.

  Two render modes:
   - Standalone (`onClick` not provided): renders the heart-half button +
     opens its own FeedbackQuickModal. Used outside the workbench
     (e.g. /todo direct route, settings pages).
   - Hosted (`onClick` provided): just the icon button — the host owns
     the open-state and renders feedback inline (workbench AppPage).

  ModuleShell auto-injects the standalone variant in its header. The
  workbench's AppPage suppresses that and wires its own onFeedback to
  flip into the inline feedback panel (like the Hilfe panel).
-->
<script lang="ts">
	import { HeartHalf } from '@mana/shared-icons';
	import { authStore } from '$lib/stores/auth.svelte';
	import FeedbackQuickModal from './FeedbackQuickModal.svelte';

	interface Props {
		moduleId?: string;
		size?: number;
		/** When set, the button just calls this — host renders the form. */
		onClick?: () => void;
		/** When the host renders inline feedback, pass `true` to highlight
		 *  the trigger like the help button does. */
		active?: boolean;
	}

	let { moduleId, size = 22, onClick, active = false }: Props = $props();

	let open = $state(false);

	function handleClick(e: MouseEvent) {
		e.stopPropagation();
		// Submit requires login. Guests would just see an auth-error toast,
		// so silently skip — global pill catches them elsewhere.
		if (!authStore.user) return;
		if (onClick) {
			onClick();
		} else {
			open = true;
		}
	}
</script>

{#if authStore.user}
	<button
		type="button"
		class="feedback-hook-btn"
		class:active
		onclick={handleClick}
		title="Idee oder Feedback?"
		aria-label="Feedback geben"
	>
		<HeartHalf {size} weight="bold" />
	</button>

	{#if !onClick}
		<FeedbackQuickModal {open} moduleContext={moduleId} onClose={() => (open = false)} />
	{/if}
{/if}

<style>
	.feedback-hook-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition: all 0.15s;
	}

	.feedback-hook-btn:hover {
		background: hsl(var(--color-surface-hover, var(--color-muted)));
		color: hsl(var(--color-primary));
	}

	.feedback-hook-btn.active {
		background: hsl(var(--color-surface-hover, var(--color-muted)));
		color: hsl(var(--color-primary));
	}
</style>
