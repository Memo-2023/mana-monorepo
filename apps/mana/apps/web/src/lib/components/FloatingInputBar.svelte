<!--
  FloatingInputBar — Shared floating input bar for module ListViews.
  Positioned at the bottom of a relative parent. Includes optional
  voice input button (mic icon left, text field right).
-->
<script lang="ts">
	import { Microphone } from '@mana/shared-icons';
	import { voiceRecorder, formatElapsed } from '$lib/components/voice/recorder.svelte';
	import { requireAuth } from '$lib/auth/require-auth.svelte';

	interface Props {
		/** Bound text value. */
		value: string;
		/** Placeholder when idle. */
		placeholder?: string;
		/** Called on form submit (Enter). */
		onSubmit: () => void;
		/** Enable voice input. */
		voice?: boolean;
		/** Feature id for voice auth gate. */
		voiceFeature?: string;
		/** Reason text for voice auth gate. */
		voiceReason?: string;
		/** Called with the recorded blob when voice recording stops. */
		onVoiceComplete?: (blob: Blob, durationMs: number) => Promise<void> | void;
	}

	let {
		value = $bindable(),
		placeholder = 'Neuer Eintrag...',
		onSubmit,
		voice = false,
		voiceFeature = 'voice-capture',
		voiceReason = 'Dafür brauchst du ein Mana-Konto.',
		onVoiceComplete,
	}: Props = $props();

	const isRecording = $derived(voiceRecorder.status === 'recording');
	const isBusy = $derived(
		voiceRecorder.status === 'requesting' || voiceRecorder.status === 'stopping'
	);

	async function handleVoiceToggle() {
		if (isRecording) {
			try {
				const result = await voiceRecorder.stop();
				if (result.durationMs < 500) return;
				await onVoiceComplete?.(result.blob, result.durationMs);
			} catch {
				// cancelled or error
			}
			return;
		}
		if (voiceRecorder.status !== 'idle') return;
		const ok = await requireAuth({ feature: voiceFeature, reason: voiceReason });
		if (!ok) return;
		await voiceRecorder.start();
	}
</script>

<form
	onsubmit={(e) => {
		e.preventDefault();
		onSubmit();
	}}
	class="floating-input-bar"
>
	{#if voice}
		<button
			type="button"
			class="voice-btn"
			class:recording={isRecording}
			onclick={handleVoiceToggle}
			disabled={isBusy}
			title={isRecording ? 'Aufnahme beenden' : 'Sprechen'}
		>
			{#if isRecording}
				<span class="rec-dot"></span>
			{:else}
				<Microphone size={16} weight="bold" />
			{/if}
		</button>
	{/if}
	<input
		bind:value
		placeholder={isRecording ? formatElapsed(voiceRecorder.elapsedMs) : placeholder}
		class="input-field"
		disabled={isRecording}
	/>
</form>

<style>
	.floating-input-bar {
		position: absolute;
		bottom: 0.5rem;
		left: 0.5rem;
		right: 0.5rem;
		display: flex;
		align-items: center;
		gap: 0;
		border-radius: 9999px;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-card));
		box-shadow: 0 -2px 8px hsl(0 0% 0% / 0.06);
		overflow: hidden;
	}
	.voice-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		flex-shrink: 0;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition: color 0.15s;
	}
	.voice-btn:hover:not(:disabled) {
		color: hsl(var(--color-primary));
	}
	.voice-btn.recording {
		color: hsl(var(--color-error));
	}
	.voice-btn:disabled {
		opacity: 0.5;
		cursor: wait;
	}
	.rec-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: hsl(var(--color-error));
		animation: pulse-dot 1.2s ease-in-out infinite;
	}
	@keyframes pulse-dot {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.3;
		}
	}
	.input-field {
		flex: 1;
		border: none;
		background: transparent;
		outline: none;
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
		padding: 0.5rem 0.75rem 0.5rem 0;
	}
	/* When there's no voice button, restore left padding */
	.floating-input-bar:not(:has(.voice-btn)) .input-field {
		padding-left: 0.75rem;
	}
	.input-field::placeholder {
		color: hsl(var(--color-muted-foreground));
	}
	.input-field:disabled {
		opacity: 0.5;
	}
</style>
