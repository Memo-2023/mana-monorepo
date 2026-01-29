<script lang="ts">
	import { matrixStore } from '$lib/matrix';
	import type { VerificationRequest, SasVerification } from '$lib/matrix/types';
	import { Check, X, CircleNotch, ShieldCheck } from '@manacore/shared-icons';

	interface Props {
		request: VerificationRequest;
		onComplete: () => void;
		onCancel: () => void;
	}

	let { request, onComplete, onCancel }: Props = $props();

	let phase = $state<'waiting' | 'emojis' | 'confirming' | 'done' | 'error'>('waiting');
	let emojis = $state<{ emoji: string; description: string }[]>([]);
	let error = $state<string | null>(null);

	// In a real implementation, we would listen to SAS events from the SDK
	// For now, this shows the UI flow

	$effect(() => {
		// Watch verification phase changes
		if (request.phase === 'done') {
			phase = 'done';
		} else if (request.phase === 'cancelled') {
			phase = 'error';
			error = 'Verifizierung wurde abgebrochen';
		} else if (request.phase === 'started') {
			// When verification starts, we should receive emoji data
			// This would normally come from SDK events
			phase = 'emojis';
		}
	});

	// Simulated emoji data for demonstration
	// In production, this comes from the verifier.sasEvent
	const demoEmojis = [
		{ emoji: '🐶', description: 'Dog' },
		{ emoji: '🎸', description: 'Guitar' },
		{ emoji: '🏠', description: 'House' },
		{ emoji: '🎨', description: 'Palette' },
		{ emoji: '🔑', description: 'Key' },
		{ emoji: '🎯', description: 'Bullseye' },
		{ emoji: '🚀', description: 'Rocket' },
	];

	// Start showing emojis after a delay (simulating the handshake)
	$effect(() => {
		if (request.phase === 'ready' || request.phase === 'requested') {
			const timer = setTimeout(() => {
				// In real implementation, emojis come from verifier events
				emojis = demoEmojis;
				phase = 'emojis';
			}, 2000);

			return () => clearTimeout(timer);
		}
	});

	async function confirmMatch() {
		phase = 'confirming';
		try {
			const success = await matrixStore.confirmSasVerification(request.requestId);
			if (success) {
				phase = 'done';
				setTimeout(onComplete, 1500);
			} else {
				phase = 'error';
				error = 'Bestätigung fehlgeschlagen';
			}
		} catch (err) {
			phase = 'error';
			error = 'Ein Fehler ist aufgetreten';
		}
	}

	function rejectMatch() {
		onCancel();
	}
</script>

<div class="space-y-6">
	{#if phase === 'waiting'}
		<div class="flex flex-col items-center gap-4 py-8">
			<CircleNotch class="h-12 w-12 animate-spin text-primary" />
			<p class="text-center text-muted-foreground">Warte auf Antwort vom anderen Gerät...</p>
			<p class="text-sm text-muted-foreground/70">
				Öffne die Verifizierungsanfrage auf deinem anderen Gerät.
			</p>
		</div>
	{:else if phase === 'emojis'}
		<div class="space-y-4">
			<p class="text-center text-muted-foreground">
				Vergleiche die folgenden Emojis mit deinem anderen Gerät:
			</p>

			<!-- Emoji Grid -->
			<div class="grid grid-cols-7 gap-2 rounded-lg bg-muted p-4">
				{#each emojis as item}
					<div class="flex flex-col items-center gap-1">
						<span class="text-3xl">{item.emoji}</span>
						<span class="text-xs text-muted-foreground text-center">{item.description}</span>
					</div>
				{/each}
			</div>

			<p class="text-center text-sm text-muted-foreground">
				Stimmen die Emojis auf beiden Geräten überein?
			</p>

			<!-- Action Buttons -->
			<div class="flex gap-3 justify-center">
				<button
					class="flex items-center gap-2 rounded-lg border border-error px-4 py-2 text-error hover:bg-error/10"
					onclick={rejectMatch}
				>
					<X class="h-4 w-4" />
					Nein, stimmen nicht
				</button>
				<button
					class="flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-white hover:brightness-90"
					onclick={confirmMatch}
				>
					<Check class="h-4 w-4" />
					Ja, stimmen überein
				</button>
			</div>
		</div>
	{:else if phase === 'confirming'}
		<div class="flex flex-col items-center gap-4 py-8">
			<CircleNotch class="h-12 w-12 animate-spin text-primary" />
			<p class="text-center text-muted-foreground">Bestätige Verifizierung...</p>
		</div>
	{:else if phase === 'done'}
		<div class="flex flex-col items-center gap-4 py-8">
			<div class="rounded-full bg-success/20 p-4">
				<ShieldCheck class="h-12 w-12 text-success" />
			</div>
			<p class="text-center text-lg font-medium text-success">Verifizierung erfolgreich!</p>
			<p class="text-center text-sm text-muted-foreground">
				Das Gerät wurde erfolgreich verifiziert.
			</p>
		</div>
	{:else if phase === 'error'}
		<div class="flex flex-col items-center gap-4 py-8">
			<div class="rounded-full bg-error/20 p-4">
				<X class="h-12 w-12 text-error" />
			</div>
			<p class="text-center text-lg font-medium text-error">Verifizierung fehlgeschlagen</p>
			{#if error}
				<p class="text-center text-sm text-muted-foreground">
					{error}
				</p>
			{/if}
			<button class="btn-ghost" onclick={onCancel}> Schließen </button>
		</div>
	{/if}
</div>
