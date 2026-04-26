<!--
  FeedbackHook — Inline icon-button that opens the FeedbackQuickModal
  pre-filled with the calling module's id. Drops into ModuleShell's
  window-actions row by default; can be placed anywhere by callers.

  ModuleShell auto-injects this in its header (right next to the
  window-controls). Modules opt out via `hideFeedback={true}`.
-->
<script lang="ts">
	import { Lightbulb } from '@mana/shared-icons';
	import { authStore } from '$lib/stores/auth.svelte';
	import FeedbackQuickModal from './FeedbackQuickModal.svelte';

	interface Props {
		moduleId?: string;
		size?: number;
	}

	let { moduleId, size = 22 }: Props = $props();

	let open = $state(false);

	function handleClick(e: MouseEvent) {
		e.stopPropagation();
		// Submit requires login. Guests would just see an auth-error toast,
		// so silently skip the modal — global pill catches them elsewhere.
		if (!authStore.user) return;
		open = true;
	}
</script>

{#if authStore.user}
	<button
		type="button"
		class="feedback-hook-btn"
		onclick={handleClick}
		title="Idee oder Feedback?"
		aria-label="Feedback geben"
	>
		<Lightbulb {size} weight="bold" />
	</button>

	<FeedbackQuickModal {open} moduleContext={moduleId} onClose={() => (open = false)} />
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
</style>
