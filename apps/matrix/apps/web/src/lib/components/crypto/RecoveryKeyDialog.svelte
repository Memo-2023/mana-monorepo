<script lang="ts">
	import { matrixStore } from '$lib/matrix';
	import { formatRecoveryKey, isValidRecoveryKey } from '$lib/matrix/crypto';
	import {
		X,
		Key,
		Download,
		Copy,
		Check,
		Loader2,
		AlertTriangle,
		ShieldCheck,
	} from 'lucide-svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
		mode?: 'setup' | 'restore';
	}

	let { open, onClose, mode = 'setup' }: Props = $props();

	let currentMode = $state<'setup' | 'restore'>(mode);
	let step = $state<'intro' | 'passphrase' | 'show-key' | 'confirm' | 'restore' | 'done'>('intro');
	let loading = $state(false);
	let error = $state<string | null>(null);

	// Setup state
	let usePassphrase = $state(false);
	let passphrase = $state('');
	let passphraseConfirm = $state('');
	let recoveryKey = $state('');
	let keyCopied = $state(false);

	// Restore state
	let inputRecoveryKey = $state('');

	$effect(() => {
		if (open) {
			currentMode = mode;
			step = 'intro';
			resetState();
		}
	});

	function resetState() {
		loading = false;
		error = null;
		usePassphrase = false;
		passphrase = '';
		passphraseConfirm = '';
		recoveryKey = '';
		keyCopied = false;
		inputRecoveryKey = '';
	}

	function handleClose() {
		resetState();
		onClose();
	}

	async function startSetup() {
		if (usePassphrase) {
			step = 'passphrase';
		} else {
			await generateKey();
		}
	}

	async function generateKey() {
		if (usePassphrase && passphrase !== passphraseConfirm) {
			error = 'Passphrasen stimmen nicht überein';
			return;
		}

		loading = true;
		error = null;

		try {
			const result = await matrixStore.bootstrapSecretStorage(
				usePassphrase ? passphrase : undefined
			);

			if (result) {
				recoveryKey = result.recoveryKey;
				step = 'show-key';
			} else {
				error = 'Fehler beim Erstellen der Verschlüsselungsschlüssel';
			}
		} catch (err) {
			error = 'Ein unerwarteter Fehler ist aufgetreten';
			console.error('Error bootstrapping secret storage:', err);
		}

		loading = false;
	}

	async function copyKey() {
		try {
			await navigator.clipboard.writeText(recoveryKey);
			keyCopied = true;
			setTimeout(() => (keyCopied = false), 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}

	function downloadKey() {
		const blob = new Blob(
			[
				`Matrix Recovery Key\n\n${formatRecoveryKey(recoveryKey)}\n\nBewahre diesen Schlüssel sicher auf!`,
			],
			{ type: 'text/plain' }
		);
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'matrix-recovery-key.txt';
		a.click();
		URL.revokeObjectURL(url);
	}

	function confirmKeySaved() {
		step = 'done';
	}

	async function restoreKey() {
		if (!isValidRecoveryKey(inputRecoveryKey)) {
			error = 'Ungültiges Recovery Key Format';
			return;
		}

		loading = true;
		error = null;

		try {
			const success = await matrixStore.restoreFromRecoveryKey(inputRecoveryKey.trim());

			if (success) {
				step = 'done';
			} else {
				error = 'Recovery Key konnte nicht wiederhergestellt werden. Bitte prüfe den Schlüssel.';
			}
		} catch (err) {
			error = 'Ein unerwarteter Fehler ist aufgetreten';
			console.error('Error restoring from recovery key:', err);
		}

		loading = false;
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
		onclick={handleClose}
	>
		<div
			class="w-full max-w-lg rounded-xl bg-surface shadow-xl"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-border px-6 py-4">
				<div class="flex items-center gap-3">
					<Key class="h-6 w-6 text-primary" />
					<h2 class="text-xl font-semibold">
						{currentMode === 'setup' ? 'Verschlüsselung einrichten' : 'Schlüssel wiederherstellen'}
					</h2>
				</div>
				<button class="btn-ghost rounded-full p-2" onclick={handleClose}>
					<X class="h-5 w-5" />
				</button>
			</div>

			<!-- Content -->
			<div class="px-6 py-4">
				{#if step === 'intro'}
					<div class="space-y-4">
						{#if currentMode === 'setup'}
							<p class="text-muted-foreground">
								Richte einen Recovery Key ein, um deine verschlüsselten Nachrichten auf anderen
								Geräten wiederherzustellen.
							</p>

							<div class="flex items-start gap-3 rounded-lg bg-warning/10 p-3 text-warning">
								<AlertTriangle class="h-5 w-5 flex-shrink-0 mt-0.5" />
								<span class="text-sm">
									Ohne Recovery Key verlierst du den Zugriff auf deine verschlüsselten Nachrichten,
									wenn du dich abmeldest.
								</span>
							</div>

							<label class="flex cursor-pointer items-start gap-3">
								<input
									type="checkbox"
									class="mt-1 h-4 w-4 rounded border-border"
									bind:checked={usePassphrase}
								/>
								<div>
									<span class="font-medium">Mit Passphrase sichern (optional)</span>
									<p class="text-xs text-muted-foreground">
										Du kannst zusätzlich eine Passphrase festlegen, um den Recovery Key zu schützen.
									</p>
								</div>
							</label>
						{:else}
							<p class="text-muted-foreground">
								Gib deinen Recovery Key ein, um auf deine verschlüsselten Nachrichten zugreifen zu
								können.
							</p>

							<div class="space-y-2">
								<label class="text-sm font-medium" for="recovery-key-input"> Recovery Key </label>
								<textarea
									id="recovery-key-input"
									class="input h-24 w-full resize-none font-mono text-sm"
									placeholder="Gib hier deinen Recovery Key ein..."
									bind:value={inputRecoveryKey}
								></textarea>
							</div>
						{/if}

						{#if error}
							<div class="rounded-lg bg-error/10 p-3 text-error text-sm">
								{error}
							</div>
						{/if}
					</div>
				{:else if step === 'passphrase'}
					<div class="space-y-4">
						<p class="text-muted-foreground">
							Gib eine sichere Passphrase ein, die du dir merken kannst.
						</p>

						<div class="space-y-2">
							<label class="text-sm font-medium" for="passphrase"> Passphrase </label>
							<input
								id="passphrase"
								type="password"
								class="input w-full"
								bind:value={passphrase}
								placeholder="Sichere Passphrase eingeben"
							/>
						</div>

						<div class="space-y-2">
							<label class="text-sm font-medium" for="passphrase-confirm">
								Passphrase bestätigen
							</label>
							<input
								id="passphrase-confirm"
								type="password"
								class="input w-full"
								bind:value={passphraseConfirm}
								placeholder="Passphrase wiederholen"
							/>
						</div>

						{#if error}
							<div class="rounded-lg bg-error/10 p-3 text-error text-sm">
								{error}
							</div>
						{/if}
					</div>
				{:else if step === 'show-key'}
					<div class="space-y-4">
						<div class="flex items-start gap-3 rounded-lg bg-warning/10 p-3 text-warning">
							<AlertTriangle class="h-5 w-5 flex-shrink-0 mt-0.5" />
							<span class="text-sm">
								Speichere diesen Schlüssel an einem sicheren Ort. Du benötigst ihn, um deine
								Nachrichten wiederherzustellen.
							</span>
						</div>

						<div class="rounded-lg bg-muted p-4">
							<p class="mb-2 text-sm font-medium">Dein Recovery Key:</p>
							<div class="rounded bg-surface p-3 font-mono text-sm break-all border border-border">
								{formatRecoveryKey(recoveryKey)}
							</div>
						</div>

						<div class="flex gap-2">
							<button
								class="btn-secondary flex-1 flex items-center justify-center gap-2"
								onclick={copyKey}
							>
								{#if keyCopied}
									<Check class="h-4 w-4 text-success" />
									Kopiert!
								{:else}
									<Copy class="h-4 w-4" />
									Kopieren
								{/if}
							</button>
							<button
								class="btn-secondary flex-1 flex items-center justify-center gap-2"
								onclick={downloadKey}
							>
								<Download class="h-4 w-4" />
								Herunterladen
							</button>
						</div>
					</div>
				{:else if step === 'done'}
					<div class="flex flex-col items-center gap-4 py-8">
						<div class="rounded-full bg-success/20 p-4">
							<ShieldCheck class="h-12 w-12 text-success" />
						</div>
						<p class="text-center text-lg font-medium text-success">
							{currentMode === 'setup'
								? 'Verschlüsselung eingerichtet!'
								: 'Schlüssel wiederhergestellt!'}
						</p>
						<p class="text-center text-sm text-muted-foreground">
							{currentMode === 'setup'
								? 'Deine Nachrichten sind jetzt sicher verschlüsselt.'
								: 'Du kannst jetzt auf deine verschlüsselten Nachrichten zugreifen.'}
						</p>
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="flex justify-end gap-2 border-t border-border px-6 py-4">
				{#if step === 'intro'}
					<button class="btn-ghost" onclick={handleClose}>Abbrechen</button>
					{#if currentMode === 'setup'}
						<button
							class="btn-primary flex items-center gap-2"
							onclick={startSetup}
							disabled={loading}
						>
							{#if loading}
								<Loader2 class="h-4 w-4 animate-spin" />
							{/if}
							Weiter
						</button>
					{:else}
						<button
							class="btn-primary flex items-center gap-2"
							onclick={restoreKey}
							disabled={loading || !inputRecoveryKey.trim()}
						>
							{#if loading}
								<Loader2 class="h-4 w-4 animate-spin" />
							{/if}
							Wiederherstellen
						</button>
					{/if}
				{:else if step === 'passphrase'}
					<button class="btn-ghost" onclick={() => (step = 'intro')}>Zurück</button>
					<button
						class="btn-primary flex items-center gap-2"
						onclick={generateKey}
						disabled={loading || !passphrase || passphrase !== passphraseConfirm}
					>
						{#if loading}
							<Loader2 class="h-4 w-4 animate-spin" />
						{/if}
						Schlüssel erstellen
					</button>
				{:else if step === 'show-key'}
					<button class="btn-primary" onclick={confirmKeySaved}>
						Ich habe den Schlüssel gespeichert
					</button>
				{:else if step === 'done'}
					<button class="btn-primary" onclick={handleClose}> Fertig </button>
				{/if}
			</div>
		</div>
	</div>
{/if}
