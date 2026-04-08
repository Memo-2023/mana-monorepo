<!--
	Shared "Voice Capture" UI bar.

	Drop this into any module's ListView to add a single-button voice
	recorder. The bar handles the entire flow:
	  1. Gate the click on requireAuth() — guests see the global
	     "Konto erforderlich" modal before the mic permission request.
	  2. Start the shared singleton voiceRecorder (handles secure-context
	     check, sticky-deny detection, MediaRecorder lifecycle).
	  3. Render the four states: idle / requesting / recording / stopping.
	  4. On stop, call back into the host module via `onComplete(blob, ms)`
	     so the host can transcribe + encrypt + persist however it likes.
	  5. Surface errors with the "Trotzdem versuchen" force-retry button
	     for the macOS sticky-deny scenario.

	The host module supplies:
	  - `idleLabel`     — what the button says when idle (e.g. "Traum sprechen")
	  - `feature`       — stable id for analytics (e.g. "dreams-voice-capture")
	  - `reason`        — text for the requireAuth modal
	  - `onComplete`    — async callback that receives the recorded blob

	The host module does NOT need to:
	  - import or instantiate a recorder
	  - copy/paste 200 LOC of MediaRecorder boilerplate
	  - own any local error state
	  - handle requireAuth gating
	  - care about secure context, sticky deny, or browser quirks
-->
<script lang="ts">
	import { voiceRecorder, formatElapsed } from './recorder.svelte';
	import { requireAuth } from '$lib/auth/require-auth.svelte';

	interface Props {
		/** Label shown on the mic button when no recording is active. */
		idleLabel: string;
		/** Stable feature identifier for analytics + auth gate telemetry.
		 *  Lowercase, hyphenated. Example: 'dreams-voice-capture'. */
		feature: string;
		/** Human-readable reason shown in the requireAuth modal if the
		 *  user is not logged in. Should explain *why* this specific
		 *  feature needs an account in 1–2 sentences. */
		reason: string;
		/** Called when a recording is successfully stopped and the user
		 *  has waited at least the minimum duration. The host module is
		 *  responsible for transcribing / persisting the blob. */
		onComplete: (blob: Blob, durationMs: number) => Promise<void> | void;
		/** Minimum recording duration in milliseconds. Recordings shorter
		 *  than this surface a "too short" error and don't fire onComplete.
		 *  Default 500 ms. */
		minDurationMs?: number;
	}

	let { idleLabel, feature, reason, onComplete, minDurationMs = 500 }: Props = $props();

	let localError = $state<string | null>(null);

	async function handleClick() {
		localError = null;

		if (voiceRecorder.status === 'recording') {
			try {
				const result = await voiceRecorder.stop();
				if (result.durationMs < minDurationMs) {
					localError = 'Aufnahme war zu kurz.';
					return;
				}
				await onComplete(result.blob, result.durationMs);
			} catch (e) {
				const msg = e instanceof Error ? e.message : String(e);
				if (msg !== 'cancelled') localError = msg;
			}
			return;
		}

		if (voiceRecorder.status !== 'idle') return;

		// Auth gate before the mic permission request — see
		// $lib/auth/require-auth.svelte.ts for the full design rationale.
		const ok = await requireAuth({ feature, reason });
		if (!ok) return;

		await voiceRecorder.start();
		if (voiceRecorder.error) {
			localError = voiceRecorder.error;
		}
	}

	async function forceRetry() {
		localError = null;
		await voiceRecorder.start({ force: true });
		if (voiceRecorder.error) {
			localError = voiceRecorder.error;
		}
	}

	function cancel() {
		voiceRecorder.cancel();
	}
</script>

<div class="capture-row">
	<button
		class="mic-btn"
		class:recording={voiceRecorder.status === 'recording'}
		class:busy={voiceRecorder.status === 'requesting' || voiceRecorder.status === 'stopping'}
		onclick={handleClick}
		disabled={voiceRecorder.status === 'requesting' || voiceRecorder.status === 'stopping'}
		aria-label={voiceRecorder.status === 'recording' ? 'Aufnahme beenden' : 'Aufnahme starten'}
	>
		{#if voiceRecorder.status === 'recording'}
			<span class="mic-stop"></span>
			<span class="mic-time">{formatElapsed(voiceRecorder.elapsedMs)}</span>
		{:else if voiceRecorder.status === 'requesting'}
			<span class="mic-icon">…</span>
			<span class="mic-time">Mikro öffnen…</span>
		{:else if voiceRecorder.status === 'stopping'}
			<span class="mic-icon">…</span>
			<span class="mic-time">Verarbeite…</span>
		{:else}
			<span class="mic-icon">&#x1f3a4;</span>
			<span class="mic-time">{idleLabel}</span>
		{/if}
	</button>
	{#if voiceRecorder.status === 'recording'}
		<button class="mic-cancel" onclick={cancel} title="Aufnahme verwerfen">×</button>
	{/if}
</div>

{#if localError}
	<div class="rec-error">
		<p>{localError}</p>
		<button class="rec-retry" onclick={forceRetry}>Trotzdem versuchen</button>
	</div>
{/if}

<style>
	.capture-row {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
	.mic-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.625rem 0.875rem;
		border-radius: 0.5rem;
		border: 1px solid rgba(99, 102, 241, 0.2);
		background: rgba(99, 102, 241, 0.04);
		color: #6366f1;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
	}
	.mic-btn:hover:not(:disabled) {
		background: rgba(99, 102, 241, 0.08);
		border-color: #6366f1;
	}
	.mic-btn:disabled {
		opacity: 0.6;
		cursor: wait;
	}
	.mic-btn.recording {
		background: rgba(239, 68, 68, 0.08);
		border-color: rgba(239, 68, 68, 0.4);
		color: #ef4444;
		animation: rec-pulse 1.5s ease-in-out infinite;
	}
	@keyframes rec-pulse {
		0%,
		100% {
			box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.3);
		}
		50% {
			box-shadow: 0 0 0 4px rgba(239, 68, 68, 0);
		}
	}
	.mic-icon {
		font-size: 1rem;
		line-height: 1;
	}
	.mic-stop {
		display: inline-block;
		width: 10px;
		height: 10px;
		background: currentColor;
		border-radius: 1px;
	}
	.mic-time {
		font-size: 0.8125rem;
		font-variant-numeric: tabular-nums;
	}
	.mic-cancel {
		width: 32px;
		height: 32px;
		border-radius: 0.375rem;
		border: 1px solid rgba(0, 0, 0, 0.08);
		background: transparent;
		color: #9ca3af;
		font-size: 1.125rem;
		line-height: 1;
		cursor: pointer;
	}
	.mic-cancel:hover {
		color: #ef4444;
		border-color: #ef4444;
	}
	:global(.dark) .mic-cancel {
		border-color: rgba(255, 255, 255, 0.1);
	}
	.rec-error {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.625rem 0.75rem;
		margin-top: 0.5rem;
		border-radius: 0.375rem;
		background: rgba(239, 68, 68, 0.06);
		border: 1px solid rgba(239, 68, 68, 0.2);
	}
	.rec-error p {
		font-size: 0.6875rem;
		color: #b91c1c;
		margin: 0;
		white-space: pre-line;
		line-height: 1.5;
	}
	:global(.dark) .rec-error p {
		color: #fca5a5;
	}
	.rec-retry {
		align-self: flex-start;
		padding: 0.25rem 0.625rem;
		border-radius: 0.25rem;
		border: 1px solid rgba(239, 68, 68, 0.3);
		background: transparent;
		color: #ef4444;
		font-size: 0.6875rem;
		font-weight: 500;
		cursor: pointer;
	}
	.rec-retry:hover {
		background: rgba(239, 68, 68, 0.08);
	}
</style>
