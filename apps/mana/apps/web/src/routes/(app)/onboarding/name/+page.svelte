<!--
  Onboarding — Screen 1: Name.
  Persists the user's chosen display name via PATCH /api/v1/me/profile,
  then advances to /onboarding/look. Skip falls back to the email's
  local-part so the greeting on Screen 2 is never empty.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { tick } from 'svelte';
	import { browser } from '$app/environment';
	import { authStore } from '$lib/stores/auth.svelte';
	import { onboardingFlow } from '$lib/stores/onboarding-flow.svelte';
	import { ArrowRight } from '@mana/shared-icons';

	function getAuthUrl(): string {
		if (browser && typeof window !== 'undefined') {
			const injected = (window as unknown as { __PUBLIC_MANA_AUTH_URL__?: string })
				.__PUBLIC_MANA_AUTH_URL__;
			if (injected) return injected;
		}
		return import.meta.env.DEV ? 'http://localhost:3001' : '';
	}

	// Prefill: last value entered in this flow (back-navigation) → existing
	// `user.name` (returning user revisiting) → empty. Trimmed so
	// whitespace-only values don't count as "filled".
	let name = $state((onboardingFlow.pendingName ?? authStore.user?.name ?? '').trim());
	let saving = $state(false);
	let error = $state<string | null>(null);
	let inputEl = $state<HTMLInputElement | null>(null);

	let canSubmit = $derived(name.trim().length >= 1 && name.trim().length <= 40 && !saving);

	// Imperative focus after the previous route's focus owner has fully
	// unmounted. Using `<input autofocus>` would race the router and
	// trigger Chrome's "Autofocus processing was blocked because a
	// document already has a focused element" warning.
	$effect(() => {
		void tick().then(() => inputEl?.focus());
	});

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
			onboardingFlow.setPendingName(trimmed);
			await goto('/onboarding/look');
		} catch (err) {
			console.error('[onboarding/name] save failed:', err);
			error = 'Speichern fehlgeschlagen. Versuch es noch mal.';
		} finally {
			saving = false;
		}
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
		<input
			type="text"
			bind:this={inputEl}
			bind:value={name}
			onkeydown={handleKeydown}
			placeholder="z. B. Till"
			maxlength={40}
			autocomplete="given-name"
			aria-label="Dein Name"
		/>
		{#if error}
			<p class="error" role="alert">{error}</p>
		{/if}
	</div>

	<div class="actions">
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
		justify-content: flex-end;
		align-items: center;
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
