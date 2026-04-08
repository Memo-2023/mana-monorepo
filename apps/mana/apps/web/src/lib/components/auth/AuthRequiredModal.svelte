<!--
	Global "this feature needs an account" modal.

	Mounted ONCE in the root layout. Subscribes to `authGateState.pending`,
	which any module can fill via `requireAuth({ feature, reason })`. The
	modal stays out of the DOM tree completely while there's no pending
	prompt — no portals, no z-index gymnastics.

	Why a single global modal?
	- Every module would otherwise need its own copy of the same dialog
	  with the same buttons and the same login navigation logic.
	- Two modules can't both prompt at once: the gate state replaces any
	  existing pending prompt with the new one and resolves the old one
	  as cancelled. That's the right behaviour anyway — if the user
	  triggers two auth-gated actions in the same tick, only the most
	  recent one is what they actually meant.
-->
<script lang="ts">
	import { authGateState, navigateToLogin } from '$lib/auth/require-auth.svelte';
	import { ManaEvents } from '@mana/shared-utils/analytics';

	function cancel() {
		const feature = authGateState.pending?.options.feature;
		authGateState.resolve(false);
		if (feature) {
			ManaEvents.featureBlockedByAuth({ feature, action: 'cancel' });
		}
	}

	async function confirm() {
		const feature = authGateState.pending?.options.feature;
		if (feature) {
			ManaEvents.featureBlockedByAuth({ feature, action: 'login' });
		}
		await navigateToLogin();
	}

	function handleBackdrop(event: MouseEvent) {
		if (event.target === event.currentTarget) cancel();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') cancel();
	}
</script>

{#if authGateState.pending}
	{@const opts = authGateState.pending.options}
	<div
		class="backdrop"
		role="dialog"
		aria-modal="true"
		aria-labelledby="auth-required-title"
		onclick={handleBackdrop}
		onkeydown={handleKeydown}
		tabindex="-1"
	>
		<div class="modal">
			<header>
				<h2 id="auth-required-title">{opts.title ?? 'Konto erforderlich'}</h2>
			</header>

			<p>{opts.reason}</p>

			<p class="hint">
				Du kannst dich kostenlos registrieren oder mit einem bestehenden Mana-Konto anmelden. Nach
				dem Login landest du wieder hier.
			</p>

			<div class="actions">
				<button type="button" class="btn btn-secondary" onclick={cancel}>
					{opts.cancelLabel ?? 'Abbrechen'}
				</button>
				<!-- svelte-ignore a11y_autofocus -->
				<button type="button" class="btn btn-primary" onclick={confirm} autofocus>
					{opts.loginLabel ?? 'Anmelden'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 9999;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		backdrop-filter: blur(4px);
	}

	.modal {
		max-width: 30rem;
		width: 100%;
		background: var(--surface, #fff);
		border: 1px solid var(--border, #e5e7eb);
		border-radius: 0.75rem;
		padding: 1.5rem;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
	}

	header {
		margin-bottom: 0.5rem;
	}

	h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--foreground, #111);
	}

	p {
		margin: 0.75rem 0;
		font-size: 0.95rem;
		line-height: 1.5;
		color: var(--foreground, #222);
	}

	.hint {
		font-size: 0.85rem;
		color: var(--muted-foreground, #666);
	}

	.actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
		margin-top: 1.25rem;
	}

	.btn {
		padding: 0.55rem 1.25rem;
		border-radius: 0.5rem;
		border: 1px solid var(--border, #e5e7eb);
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		background: var(--surface, #fff);
		color: var(--foreground, #111);
		transition: background 0.15s ease;
	}

	.btn:hover {
		background: var(--surface-hover, #f3f4f6);
	}

	.btn-primary {
		background: var(--primary, #6366f1);
		color: #fff;
		border-color: var(--primary, #6366f1);
	}

	.btn-primary:hover {
		background: var(--primary-hover, #4f46e5);
	}
</style>
