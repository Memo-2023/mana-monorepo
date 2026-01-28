<script lang="ts">
	import { voiceRecordingStore } from '$lib/stores/voice-recording.svelte';

	interface Props {
		/** Called when voice recording completes with transcription */
		onResult?: (text: string) => void;
		/** Called when recording starts */
		onRecordingStart?: () => void;
		/** Size of the button in pixels */
		size?: number;
	}

	let { onResult, onRecordingStart, size = 32 }: Props = $props();

	// Reactive state from store
	let isRecording = $derived(voiceRecordingStore.isRecording);
	let isProcessing = $derived(voiceRecordingStore.isProcessing);
	let isSupported = $derived(voiceRecordingStore.isSupported);
	let hasError = $derived(voiceRecordingStore.hasError);
	let errorMessage = $derived(voiceRecordingStore.error?.message || '');

	// Handle click
	async function handleClick() {
		if (!isSupported) {
			return;
		}

		if (isRecording) {
			// Stop recording
			await voiceRecordingStore.stopRecording();
		} else if (!isProcessing) {
			// Start recording
			onRecordingStart?.();
			await voiceRecordingStore.startRecording();
		}
	}

	// Set up result callback
	$effect(() => {
		voiceRecordingStore.setOnResult((result) => {
			onResult?.(result.text);
		});
	});

	// Clear error after 5 seconds
	$effect(() => {
		if (hasError) {
			const timeout = setTimeout(() => {
				voiceRecordingStore.clearError();
			}, 5000);
			return () => clearTimeout(timeout);
		}
	});
</script>

{#if isSupported}
	<button
		type="button"
		class="voice-btn"
		class:recording={isRecording}
		class:processing={isProcessing}
		class:error={hasError}
		onclick={handleClick}
		disabled={isProcessing}
		title={hasError
			? errorMessage
			: isRecording
				? 'Aufnahme stoppen'
				: isProcessing
					? 'Verarbeite...'
					: 'Spracheingabe'}
		style="--btn-size: {size}px"
	>
		{#if isProcessing}
			<!-- Spinner -->
			<div class="spinner"></div>
		{:else if isRecording}
			<!-- Pulsing red dot -->
			<div class="recording-dot"></div>
		{:else}
			<!-- Microphone icon -->
			<svg
				class="mic-icon"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				aria-hidden="true"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
				/>
			</svg>
		{/if}
	</button>

	<!-- Error tooltip -->
	{#if hasError && errorMessage}
		<div class="error-tooltip" role="alert">
			{errorMessage}
		</div>
	{/if}
{/if}

<style>
	.voice-btn {
		position: relative;
		width: var(--btn-size, 32px);
		height: var(--btn-size, 32px);
		border-radius: 50%;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s ease;
		flex-shrink: 0;
	}

	.voice-btn:hover:not(:disabled) {
		background: hsl(var(--color-muted) / 0.5);
		color: hsl(var(--color-foreground));
	}

	.voice-btn:disabled {
		cursor: not-allowed;
		opacity: 0.7;
	}

	/* Recording state */
	.voice-btn.recording {
		background: hsl(var(--color-error) / 0.1);
		color: hsl(var(--color-error));
	}

	.voice-btn.recording:hover {
		background: hsl(var(--color-error) / 0.2);
	}

	/* Processing state */
	.voice-btn.processing {
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
	}

	/* Error state */
	.voice-btn.error {
		color: hsl(var(--color-error));
	}

	/* Microphone icon */
	.mic-icon {
		width: 60%;
		height: 60%;
	}

	/* Recording dot with pulse animation */
	.recording-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: hsl(var(--color-error));
		animation: pulse 1s ease-in-out infinite;
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

	/* Spinner */
	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid hsl(var(--color-primary) / 0.3);
		border-top-color: hsl(var(--color-primary));
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Error tooltip */
	.error-tooltip {
		position: absolute;
		bottom: calc(100% + 8px);
		left: 50%;
		transform: translateX(-50%);
		background: hsl(var(--color-error));
		color: hsl(var(--color-error-foreground, 0 0% 100%));
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-md, 6px);
		font-size: 0.75rem;
		white-space: nowrap;
		z-index: 100;
		box-shadow: 0 2px 8px hsl(var(--color-foreground) / 0.15);
		animation: fadeIn 0.15s ease;
	}

	.error-tooltip::after {
		content: '';
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		border: 6px solid transparent;
		border-top-color: hsl(var(--color-error));
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}
</style>
