<!--
	Recovery Code Unlock Modal — Phase 9.

	Mounts when the vault client is in `awaiting-recovery-code` state
	(server returned a recovery blob from GET /key after the user
	enabled zero-knowledge mode). Collects the user's recovery code,
	calls vaultClient.unlockWithRecoveryCode(), dismisses on success.

	Failure modes:
	- RecoveryCodeFormatError → format hint inline
	- Generic unwrap failure → "wrong code, try again" (we don't
	  distinguish wrong-code vs corrupted-blob; the recovery module
	  intentionally fails uniformly so an attacker gets no signal)

	The modal is non-dismissable — there's no "cancel" path because
	without the recovery code the app can't read encrypted data and
	would just sit in a broken state. The user can sign out from the
	header instead.
-->
<script lang="ts">
	import { getVaultClient, RecoveryCodeFormatError } from '$lib/data/crypto';

	interface Props {
		/** Called once the unlock has succeeded so the parent can hide
		 *  the modal. */
		onUnlocked: () => void;
	}

	let { onUnlocked }: Props = $props();

	const vaultClient = getVaultClient();

	let codeInput = $state('');
	let error = $state<string | null>(null);
	let busy = $state(false);

	async function handleSubmit(e?: Event) {
		e?.preventDefault();
		if (!codeInput.trim() || busy) return;
		error = null;
		busy = true;
		try {
			const result = await vaultClient.unlockWithRecoveryCode(codeInput);
			if (result.status === 'unlocked') {
				codeInput = '';
				onUnlocked();
				return;
			}
			// Should not happen — unlockWithRecoveryCode either throws or
			// returns 'unlocked'. Defensive fallback.
			error = 'Unbekannter Fehler beim Entsperren.';
		} catch (e) {
			if (e instanceof RecoveryCodeFormatError) {
				error =
					'Der Code hat das falsche Format. Erwartet: 16 Gruppen à 4 Hex-Zeichen, ' +
					'getrennt durch Bindestriche (z.B. 1A2B-3C4D-...).';
			} else {
				// Either wrong code or corrupted blob — surface uniformly so
				// an attacker can't distinguish the two cases.
				error = 'Recovery-Code falsch. Bitte prüfe deine Eingabe und versuche es erneut.';
			}
		} finally {
			busy = false;
		}
	}
</script>

<div class="modal-backdrop">
	<div class="modal" role="dialog" aria-modal="true" aria-labelledby="recovery-modal-title">
		<header>
			<h2 id="recovery-modal-title">🔑 Recovery-Code erforderlich</h2>
		</header>

		<p>
			Du hast den Zero-Knowledge-Modus aktiviert. Damit dein verschlüsselter Inhalt freigegeben
			werden kann, brauchst du deinen Recovery-Code — den Code, den du beim Setup gespeichert hast.
		</p>

		<form onsubmit={handleSubmit}>
			<!-- svelte-ignore a11y_autofocus -->
			<input
				class="recovery-input"
				type="text"
				bind:value={codeInput}
				placeholder="1A2B-3C4D-5E6F-..."
				autocomplete="off"
				spellcheck="false"
				autofocus
				disabled={busy}
			/>

			{#if error}
				<div class="error">⚠️ {error}</div>
			{/if}

			<div class="actions">
				<button class="btn btn-primary" type="submit" disabled={busy || !codeInput.trim()}>
					{busy ? 'Entsperre …' : 'Vault entsperren'}
				</button>
			</div>
		</form>

		<p class="help">
			Du hast keinen Code mehr? Dann sind deine verschlüsselten Daten unwiderruflich verloren —
			melde dich ab und lege ein neues Konto an, oder kontaktiere den Support für Hilfe beim
			Account-Reset (deine Daten bleiben dabei verloren).
		</p>
	</div>
</div>

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 9999;
		background: hsl(0 0% 0% / 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		backdrop-filter: blur(4px);
	}

	.modal {
		max-width: 32rem;
		width: 100%;
		background: hsl(var(--color-surface));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.75rem;
		padding: 1.5rem;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
	}

	header {
		margin-bottom: 1rem;
	}

	h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
	}

	p {
		margin: 0.75rem 0;
		font-size: 0.9rem;
		line-height: 1.5;
	}

	.recovery-input {
		display: block;
		width: 100%;
		margin: 1rem 0 0.5rem;
		padding: 0.75rem 1rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		font-family: ui-monospace, SFMono-Regular, monospace;
		font-size: 1rem;
		background: var(--surface-muted, #f9fafb);
		text-align: center;
		letter-spacing: 0.05em;
	}

	.recovery-input:focus {
		outline: 2px solid hsl(var(--color-primary));
		outline-offset: 1px;
	}

	.recovery-input:disabled {
		opacity: 0.6;
	}

	.error {
		margin: 0.75rem 0;
		padding: 0.75rem 1rem;
		background: hsl(var(--color-error) / 0.08);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 0.5rem;
		font-size: 0.85rem;
		color: rgb(185, 28, 28);
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		margin-top: 1rem;
	}

	.btn {
		padding: 0.5rem 1.25rem;
		border-radius: 0.5rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-surface));
		font-size: 0.9rem;
		cursor: pointer;
		font-weight: 500;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-primary {
		background: hsl(var(--color-primary));
		color: white;
		border-color: transparent;
	}

	.btn-primary:hover:not(:disabled) {
		background: var(--primary-dark, #4f46e5);
	}

	.help {
		margin-top: 1.25rem;
		padding-top: 1rem;
		border-top: 1px solid hsl(var(--color-border));
		font-size: 0.8rem;
		color: var(--text-secondary, #6b7280);
	}

	@media (prefers-color-scheme: dark) {
		.modal {
			background: hsl(var(--color-surface));
			border-color: hsl(var(--color-border));
		}
		.recovery-input {
			background: var(--surface-muted, #111827);
			border-color: hsl(var(--color-border));
			color: #f3f4f6;
		}
		.help {
			border-color: hsl(var(--color-border));
		}
	}
</style>
