<script lang="ts">
	import { voiceRecordingStore } from '$lib/stores/voice-recording.svelte';
	import { fade, scale } from 'svelte/transition';
	import { focusTrap } from '@manacore/shared-ui';
	import { WarningCircle, X, Check } from '@manacore/shared-icons';

	interface Props {
		/** Called when recording completes with transcription */
		onResult?: (text: string) => void;
		/** Called when modal is closed (via cancel or completion) */
		onClose?: () => void;
	}

	let { onResult, onClose }: Props = $props();

	// Reactive state from store
	let isRecording = $derived(voiceRecordingStore.isRecording);
	let isProcessing = $derived(voiceRecordingStore.isProcessing);
	let isRequesting = $derived(voiceRecordingStore.state === 'requesting');
	let hasError = $derived(voiceRecordingStore.hasError);
	let errorMessage = $derived(voiceRecordingStore.error?.message || '');
	let formattedDuration = $derived(voiceRecordingStore.formattedDuration);
	let duration = $derived(voiceRecordingStore.duration);

	// Warning when approaching max duration (50 seconds = 50000ms)
	let showWarning = $derived(duration >= 50000 && isRecording);

	// Show modal when any voice activity is happening
	let isVisible = $derived(isRecording || isProcessing || isRequesting || hasError);

	// Handle stop
	async function handleStop() {
		await voiceRecordingStore.stopRecording();
	}

	// Handle cancel
	function handleCancel() {
		voiceRecordingStore.cancel();
		onClose?.();
	}

	// Set up result callback
	$effect(() => {
		voiceRecordingStore.setOnResult((result) => {
			onResult?.(result.text);
			onClose?.();
		});
	});

	// Handle keyboard
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			handleCancel();
		} else if (event.key === 'Enter' && isRecording) {
			handleStop();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isVisible}
	<!-- Backdrop -->
	<div class="backdrop" transition:fade={{ duration: 150 }} onclick={handleCancel}></div>

	<!-- Modal -->
	<div
		class="modal"
		transition:scale={{ duration: 150, start: 0.9 }}
		role="dialog"
		aria-modal="true"
		aria-label="Sprachaufnahme"
		use:focusTrap
	>
		{#if isRequesting}
			<!-- Requesting permission state -->
			<div class="modal-content">
				<div class="spinner large"></div>
				<p class="status-text">Mikrofonzugriff wird angefordert...</p>
			</div>
		{:else if isProcessing}
			<!-- Processing/transcribing state -->
			<div class="modal-content">
				<div class="spinner large"></div>
				<p class="status-text">Verarbeite...</p>
			</div>
		{:else if hasError}
			<!-- Error state -->
			<div class="modal-content error">
				<div class="error-icon">
					<WarningCircle size={48} />
				</div>
				<p class="error-message">{errorMessage}</p>
				<button class="btn btn-primary" onclick={handleCancel}>Schließen</button>
			</div>
		{:else if isRecording}
			<!-- Recording state -->
			<div class="modal-content recording">
				<!-- Recording indicator -->
				<div class="recording-indicator">
					<div class="recording-dot-large"></div>
					<span class="recording-label">Aufnahme</span>
				</div>

				<!-- Timer -->
				<div class="timer" class:warning={showWarning}>
					{formattedDuration}
				</div>

				{#if showWarning}
					<p class="warning-text">Max. 60 Sekunden</p>
				{/if}

				<!-- Controls -->
				<div class="controls">
					<button class="btn btn-icon btn-cancel" onclick={handleCancel} title="Abbrechen (Esc)">
						<X size={24} />
					</button>

					<button
						class="btn btn-icon btn-stop"
						onclick={handleStop}
						title="Aufnahme beenden (Enter)"
					>
						<Check size={24} />
					</button>
				</div>

				<p class="hint-text">Sprechen Sie Ihren Termin...</p>
			</div>
		{/if}
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 200;
	}

	.modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 201;
		background: var(--color-surface-elevated-2);
		border-radius: 1.5rem;
		box-shadow:
			0 25px 50px -12px rgba(0, 0, 0, 0.5),
			0 0 0 1px var(--color-border-strong);
		padding: 2rem;
		min-width: 280px;
		max-width: 90vw;
	}

	.modal-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		text-align: center;
	}

	/* Recording indicator */
	.recording-indicator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: hsl(var(--color-error) / 0.1);
		border-radius: 9999px;
	}

	.recording-dot-large {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: hsl(var(--color-error));
		animation: pulse 1s ease-in-out infinite;
	}

	.recording-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--color-error));
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* Timer */
	.timer {
		font-size: 3rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: hsl(var(--color-foreground));
		line-height: 1;
	}

	.timer.warning {
		color: hsl(var(--color-warning));
		animation: blink 1s ease-in-out infinite;
	}

	@keyframes blink {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.warning-text {
		font-size: 0.75rem;
		color: hsl(var(--color-warning));
		font-weight: 500;
	}

	/* Controls */
	.controls {
		display: flex;
		gap: 1.5rem;
		margin-top: 1rem;
	}

	.btn {
		border: none;
		cursor: pointer;
		font-weight: 500;
		transition: all 0.15s ease;
	}

	.btn-icon {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.btn-icon svg {
		width: 24px;
		height: 24px;
	}

	.btn-cancel {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-muted-foreground));
	}

	.btn-cancel:hover {
		background: hsl(var(--color-muted) / 0.8);
		color: hsl(var(--color-foreground));
	}

	.btn-stop {
		background: hsl(var(--color-success));
		color: hsl(var(--color-success-foreground, 0 0% 100%));
	}

	.btn-stop:hover {
		transform: scale(1.05);
		filter: brightness(1.1);
	}

	.btn-primary {
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground, 0 0% 100%));
	}

	.btn-primary:hover {
		filter: brightness(1.1);
	}

	.hint-text {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 0.5rem;
	}

	.status-text {
		font-size: 1rem;
		color: hsl(var(--color-muted-foreground));
	}

	/* Error state */
	.modal-content.error {
		gap: 1.25rem;
	}

	.error-icon {
		width: 48px;
		height: 48px;
		color: hsl(var(--color-error));
	}

	.error-icon svg {
		width: 100%;
		height: 100%;
	}

	.error-message {
		font-size: 0.9375rem;
		color: hsl(var(--color-foreground));
		max-width: 250px;
	}

	/* Spinner */
	.spinner {
		border: 3px solid hsl(var(--color-border));
		border-top-color: hsl(var(--color-primary));
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	.spinner.large {
		width: 48px;
		height: 48px;
	}

	@keyframes pulse {
		0%,
		100% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(1.2);
			opacity: 0.7;
		}
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
