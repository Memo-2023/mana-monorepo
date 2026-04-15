<!--
	EncryptionIntroBanner
	=====================

	One-time onboarding banner that explains the at-rest encryption when
	a user unlocks their vault for the first time. Subsequent unlocks
	are silent — the localStorage flag persists across sessions on the
	same device.

	Why a banner instead of a toast?
	  - Toasts disappear after 3 seconds; a privacy claim deserves
	    longer attention than that.
	  - The banner has room for a "Mehr erfahren" link to the
	    /settings/security page, which a toast doesn't.
	  - Dismissing it is an explicit user action, which matches the
	    "you understand and accept what's happening" social contract
	    that encryption-at-rest requires.

	The component is mounted inside the bottom-stack of (app)/+layout.svelte
	(NOT the root layout) so it shares the stack's reflow with the
	QuickInputBar / TagStrip / PillNav and can't end up rendered
	behind them. Earlier the banner used its own `position: fixed`
	with z-index 60, which the QuickInputBar's higher stacking context
	covered up — fix was to make positioning the parent's job.

	It self-checks the vault state on mount and via a small interval,
	so it can fire even if the unlock happens asynchronously after the
	layout renders. Guests never see it because isVaultUnlocked()
	returns false until a real master key is loaded.

	NOTE: The flag uses a constant string instead of a STORAGE_KEYS
	import because the central storage-keys file was removed in a
	parallel refactor; the literal is unique enough not to collide.
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { isVaultUnlocked, hasAnyEncryption } from '$lib/data/crypto';
	import { ShieldCheck, X } from '@mana/shared-icons';

	const DISMISSED_KEY = 'mana-encryption-intro-dismissed';

	let visible = $state(false);
	let pollTimer: ReturnType<typeof setInterval> | null = null;

	function checkAndShow(): boolean {
		// Don't bother if encryption isn't even active
		if (!hasAnyEncryption()) return false;
		// Don't show twice — once dismissed it stays dismissed for the device
		if (typeof localStorage !== 'undefined' && localStorage.getItem(DISMISSED_KEY)) {
			return false;
		}
		// Only show once vault is actually unlocked, so the user sees the
		// banner AFTER they've been silently logged in and the key has loaded
		return isVaultUnlocked();
	}

	function dismiss() {
		visible = false;
		try {
			localStorage.setItem(DISMISSED_KEY, '1');
		} catch {
			// localStorage might be disabled (private mode, etc.) — ignore
		}
		if (pollTimer) {
			clearInterval(pollTimer);
			pollTimer = null;
		}
	}

	onMount(() => {
		// Initial check — covers the case where vault was already unlocked
		// when the layout finished mounting (warm reload)
		if (checkAndShow()) {
			visible = true;
			return;
		}
		// Otherwise poll until the unlock event fires or 30 seconds elapse
		let elapsed = 0;
		pollTimer = setInterval(() => {
			elapsed += 500;
			if (elapsed > 30_000) {
				if (pollTimer) {
					clearInterval(pollTimer);
					pollTimer = null;
				}
				return;
			}
			if (checkAndShow()) {
				visible = true;
				if (pollTimer) {
					clearInterval(pollTimer);
					pollTimer = null;
				}
			}
		}, 500);
	});

	onDestroy(() => {
		if (pollTimer) clearInterval(pollTimer);
	});
</script>

{#if visible}
	<div class="banner" role="status" aria-live="polite">
		<div class="banner-icon" aria-hidden="true">
			<ShieldCheck size={24} />
		</div>
		<div class="banner-body">
			<strong>Deine sensiblen Inhalte werden verschlüsselt.</strong>
			<p>
				Notizen, Chats, Tagebuch und Kontaktdetails liegen nur als verschlüsselter Blob auf diesem
				Gerät. Ohne deinen Schlüssel kann sie niemand lesen — nicht mal Mana.
			</p>
			<a href="/settings/security" class="learn-more">Mehr erfahren →</a>
		</div>
		<button type="button" class="dismiss" onclick={dismiss} aria-label="Hinweis ausblenden">
			<X size={18} />
		</button>
	</div>
{/if}

<style>
	/* Positioning is the parent's job (.bottom-stack-notification in
	   (app)/+layout.svelte). The banner used to be position: fixed
	   with its own bottom + transform centring; that put it in a
	   stacking context the QuickInputBar covered. Now it's a normal
	   in-flow flex item and the bottom-stack handles where it goes. */
	.banner {
		max-width: 32rem;
		width: 100%;
		display: flex;
		align-items: flex-start;
		gap: 0.875rem;
		padding: 1rem 1.25rem;
		background: hsl(var(--color-surface));
		border: 1px solid hsl(var(--color-border));
		border-left: 4px solid rgb(34, 197, 94);
		border-radius: 0.75rem;
		box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.18);
		animation: slide-up 250ms ease-out;
	}

	@keyframes slide-up {
		from {
			opacity: 0;
			transform: translateY(0.75rem);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.banner-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 999px;
		background: rgba(34, 197, 94, 0.12);
		color: rgb(21, 128, 65);
	}

	.banner-body {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.9rem;
	}
	.banner-body strong {
		font-weight: 600;
		color: var(--text-primary, #111);
	}
	.banner-body p {
		margin: 0;
		color: var(--text-secondary, #6b7280);
		line-height: 1.4;
	}

	.learn-more {
		margin-top: 0.25rem;
		font-weight: 500;
		color: hsl(var(--color-primary));
		text-decoration: none;
		font-size: 0.9rem;
	}
	.learn-more:hover {
		text-decoration: underline;
	}

	.dismiss {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 0.4rem;
		border: none;
		background: transparent;
		color: var(--text-secondary, #6b7280);
		cursor: pointer;
	}
	.dismiss:hover {
		background: var(--surface-muted, #f3f4f6);
		color: var(--text-primary, #111);
	}

	@media (prefers-color-scheme: dark) {
		.banner {
			background: hsl(var(--color-surface));
			border-color: hsl(var(--color-border));
			border-left-color: rgb(34, 197, 94);
		}
		.banner-body strong {
			color: var(--text-primary, #f9fafb);
		}
	}
</style>
