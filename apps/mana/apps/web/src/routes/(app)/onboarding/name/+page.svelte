<!--
  Onboarding — Screen 1: Name.
  Persists the user's chosen display name via PATCH /api/v1/me/profile,
  then advances to /onboarding/look. Skip falls back to the email's
  local-part so the greeting on Screen 2 is never empty.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { authStore } from '$lib/stores/auth.svelte';
	import { ArrowRight } from '@mana/shared-icons';

	function getAuthUrl(): string {
		if (browser && typeof window !== 'undefined') {
			const injected = (window as unknown as { __PUBLIC_MANA_AUTH_URL__?: string })
				.__PUBLIC_MANA_AUTH_URL__;
			if (injected) return injected;
		}
		return import.meta.env.DEV ? 'http://localhost:3001' : '';
	}

	// Prefill: existing name (returning user revisiting) → email local-part
	// → empty. Trimmed so whitespace-only values don't count as "filled".
	let name = $state((authStore.user?.name ?? '').trim());
	let saving = $state(false);
	let error = $state<string | null>(null);

	let canSubmit = $derived(name.trim().length >= 1 && name.trim().length <= 40 && !saving);

	async function saveName(value: string) {
		const token = await authStore.getValidToken();
		if (!token) throw new Error('Not authenticated');
		const res = await fetch(`${getAuthUrl()}/api/v1/me/profile`, {
			method: 'PATCH',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ name: value }),
		});
		if (!res.ok) throw new Error(`PATCH /me/profile → ${res.status}`);
	}

	async function handleNext() {
		const trimmed = name.trim();
		if (!trimmed) return;
		saving = true;
		error = null;
		try {
			await saveName(trimmed);
			await goto('/onboarding/look');
		} catch (err) {
			console.error('[onboarding/name] save failed:', err);
			error = 'Speichern fehlgeschlagen. Versuch es noch mal.';
		} finally {
			saving = false;
		}
	}

	async function handleSkip() {
		const fallback = (authStore.user?.email ?? '').split('@')[0] || 'du';
		saving = true;
		error = null;
		try {
			// Persist the fallback too so the user shows up as something
			// other than "User 1234" in admin UIs — cheap, idempotent.
			await saveName(fallback);
		} catch (err) {
			console.warn('[onboarding/name] skip-save failed:', err);
		} finally {
			saving = false;
		}
		await goto('/onboarding/look');
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && canSubmit) {
			e.preventDefault();
			handleNext();
		}
	}
</script>

<div class="screen">
	<div class="hero">
		<h1>Wie willst du genannt werden?</h1>
		<p class="subtitle">Dein Name erscheint oben in der Navigation und in Nachrichten von Mana.</p>
	</div>

	<div class="field">
		<!-- svelte-ignore a11y_autofocus -->
		<input
			type="text"
			bind:value={name}
			onkeydown={handleKeydown}
			placeholder="z. B. Till"
			maxlength={40}
			autocomplete="given-name"
			autofocus
			aria-label="Dein Name"
		/>
		{#if error}
			<p class="error" role="alert">{error}</p>
		{/if}
	</div>

	<div class="actions">
		<button type="button" class="btn-ghost" onclick={handleSkip} disabled={saving}>
			Überspringen
		</button>
		<button
			type="button"
			class="btn-primary"
			onclick={handleNext}
			disabled={!canSubmit}
			aria-label="Weiter zu Theme-Auswahl"
		>
			<span>Weiter</span>
			<ArrowRight size={16} weight="bold" />
		</button>
	</div>
</div>

<style>
	.screen {
		width: 100%;
		max-width: 440px;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.hero h1 {
		font-size: 1.75rem;
		font-weight: 700;
		margin: 0 0 0.5rem 0;
		letter-spacing: -0.02em;
	}

	.subtitle {
		font-size: 0.9375rem;
		color: hsl(var(--color-muted-foreground));
		line-height: 1.5;
		margin: 0;
	}

	.field input {
		width: 100%;
		padding: 0.875rem 1rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.75rem;
		background: hsl(var(--color-surface, var(--color-background)));
		color: hsl(var(--color-foreground));
		font-size: 1.0625rem;
		transition: border-color 0.15s ease;
	}

	.field input:focus {
		outline: none;
		border-color: hsl(var(--color-primary));
		box-shadow: 0 0 0 3px hsl(var(--color-primary) / 0.15);
	}

	.error {
		margin: 0.5rem 0 0 0;
		font-size: 0.8125rem;
		color: hsl(var(--color-error, 0 84% 60%));
	}

	.actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.btn-ghost {
		padding: 0.625rem 1rem;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.9375rem;
		border-radius: 0.5rem;
		cursor: pointer;
		transition:
			background 0.15s ease,
			color 0.15s ease;
	}

	.btn-ghost:hover:not(:disabled) {
		background: hsl(var(--color-muted) / 0.4);
		color: hsl(var(--color-foreground));
	}

	.btn-primary {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		border: none;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground, 0 0% 100%));
		font-size: 0.9375rem;
		font-weight: 600;
		border-radius: 0.75rem;
		cursor: pointer;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease,
			opacity 0.15s ease;
	}

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px hsl(var(--color-primary) / 0.35);
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
