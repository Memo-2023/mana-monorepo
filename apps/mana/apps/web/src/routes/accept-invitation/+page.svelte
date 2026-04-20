<script lang="ts">
	/**
	 * /accept-invitation?id=<invitationId> — landing page for Space
	 * invitation links sent by Better Auth's sendInvitationEmail handler.
	 *
	 * Lives outside the (app) guard so a logged-out invitee can see the
	 * landing and be prompted to sign up or sign in before accepting. If
	 * the user is already authenticated, the accept / decline actions
	 * fire against Better Auth directly and redirect into the new space
	 * on success.
	 */

	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/auth.svelte';
	import { SPACE_TYPE_LABELS } from '@mana/shared-branding';
	import { isSpaceType, type SpaceType } from '@mana/shared-types';
	import { loadActiveSpace, authFetch } from '$lib/data/scope';

	interface InvitationPayload {
		id: string;
		email: string;
		role: string;
		status: string;
		organizationId: string;
		organizationName?: string;
		organizationMetadata?: unknown;
		inviterEmail?: string;
		expiresAt: string;
	}

	let invitation = $state<InvitationPayload | null>(null);
	let loading = $state(true);
	let loadError = $state<string | null>(null);
	let actionError = $state<string | null>(null);
	let submitting = $state(false);

	const invitationId = $derived($page.url.searchParams.get('id') ?? '');

	const spaceType = $derived.by<SpaceType>(() => {
		const meta = (invitation?.organizationMetadata ?? {}) as { type?: unknown };
		return isSpaceType(meta.type) ? meta.type : 'personal';
	});

	async function loadInvitation() {
		if (!invitationId) {
			loadError = 'Kein Einladungs-Code in der URL';
			loading = false;
			return;
		}
		loading = true;
		loadError = null;
		try {
			const res = await authFetch(
				`/api/auth/organization/get-invitation?id=${encodeURIComponent(invitationId)}`
			);
			if (!res.ok) {
				throw new Error(`Einladung nicht gefunden (${res.status})`);
			}
			invitation = (await res.json()) as InvitationPayload;
		} catch (err) {
			loadError = err instanceof Error ? err.message : String(err);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		void loadInvitation();
	});

	async function accept() {
		if (!invitation || submitting) return;
		if (!authStore.isAuthenticated) {
			// Route to login with callback back here so the flow resumes.
			const callback = encodeURIComponent(`/accept-invitation?id=${invitationId}`);
			goto(`/login?callbackURL=${callback}`);
			return;
		}
		submitting = true;
		actionError = null;
		try {
			const res = await authFetch('/api/auth/organization/accept-invitation', {
				method: 'POST',
				body: JSON.stringify({ invitationId }),
			});
			if (!res.ok) {
				throw new Error(await res.text());
			}
			// Activate the newly-joined space so the dashboard opens inside it.
			await authFetch('/api/auth/organization/set-active', {
				method: 'POST',
				body: JSON.stringify({ organizationId: invitation.organizationId }),
			});
			await loadActiveSpace({ force: true });
			goto('/');
		} catch (err) {
			actionError = err instanceof Error ? err.message : String(err);
			submitting = false;
		}
	}

	async function decline() {
		if (!invitation || submitting) return;
		submitting = true;
		actionError = null;
		try {
			const res = await authFetch('/api/auth/organization/reject-invitation', {
				method: 'POST',
				body: JSON.stringify({ invitationId }),
			});
			if (!res.ok) throw new Error(await res.text());
			goto('/');
		} catch (err) {
			actionError = err instanceof Error ? err.message : String(err);
			submitting = false;
		}
	}
</script>

<div class="page">
	<div class="card">
		{#if loading}
			<p class="state">Lade Einladung …</p>
		{:else if loadError}
			<h1>Einladung nicht abrufbar</h1>
			<p class="error">{loadError}</p>
			<p class="hint">Der Link ist möglicherweise abgelaufen oder schon benutzt.</p>
		{:else if invitation}
			{#if invitation.status === 'accepted'}
				<h1>Schon angenommen</h1>
				<p class="hint">Diese Einladung ist bereits angenommen worden.</p>
				<a href="/" class="btn primary">Zur App</a>
			{:else if invitation.status === 'rejected' || invitation.status === 'canceled'}
				<h1>Einladung abgelaufen</h1>
				<p class="hint">Diese Einladung ist nicht mehr gültig.</p>
			{:else}
				<p class="eyebrow">Einladung</p>
				<h1>
					{invitation.inviterEmail ?? 'Jemand'} lädt dich in
					<strong>{invitation.organizationName ?? 'einen Space'}</strong> ein
				</h1>
				<p class="subtitle">
					<span class="type-chip" data-type={spaceType}>{SPACE_TYPE_LABELS.de[spaceType]}</span>
					<span>Rolle: {invitation.role}</span>
				</p>
				<p class="hint">
					Nach Annahme kannst du in diesem Space mitarbeiten — sehen, was andere schreiben, und
					selbst Einträge anlegen. Deine persönlichen Daten bleiben in deinem Personal-Space,
					getrennt.
				</p>
				{#if actionError}<p class="error">{actionError}</p>{/if}
				<div class="actions">
					<button class="btn secondary" onclick={decline} disabled={submitting}>Ablehnen</button>
					<button class="btn primary" onclick={accept} disabled={submitting}>
						{#if submitting}
							Bearbeite …
						{:else if !authStore.isAuthenticated}
							Einloggen & annehmen
						{:else}
							Annehmen
						{/if}
					</button>
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	.page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		background: var(--color-surface-2, hsl(0 0% 97%));
	}

	.card {
		background: var(--color-surface-1, white);
		border: 1px solid var(--color-border, hsl(0 0% 88%));
		border-radius: var(--radius-lg, 10px);
		padding: 2rem;
		max-width: 460px;
		width: 100%;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.06);
	}

	.eyebrow {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-text-muted, hsl(0 0% 45%));
		text-transform: uppercase;
		letter-spacing: 0.04em;
		margin: 0 0 0.5rem;
	}

	h1 {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0 0 0.75rem;
		line-height: 1.4;
	}

	.subtitle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--color-text-muted, hsl(0 0% 45%));
		margin: 0 0 1rem;
	}

	.type-chip {
		font-size: 0.6875rem;
		padding: 0.125rem 0.5rem;
		border-radius: var(--radius-sm, 4px);
		background: var(--color-surface-2, hsl(0 0% 94%));
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}

	.type-chip[data-type='brand'] {
		background: hsl(260 70% 94%);
		color: hsl(260 60% 35%);
	}
	.type-chip[data-type='club'] {
		background: hsl(160 50% 92%);
		color: hsl(160 60% 28%);
	}
	.type-chip[data-type='family'] {
		background: hsl(30 80% 92%);
		color: hsl(30 60% 35%);
	}
	.type-chip[data-type='team'] {
		background: hsl(210 60% 92%);
		color: hsl(210 60% 32%);
	}
	.type-chip[data-type='practice'] {
		background: hsl(340 50% 92%);
		color: hsl(340 55% 38%);
	}

	.hint {
		font-size: 0.875rem;
		color: var(--color-text-muted, hsl(0 0% 45%));
		line-height: 1.5;
		margin: 0 0 1.5rem;
	}

	.state {
		text-align: center;
		color: var(--color-text-muted, hsl(0 0% 45%));
	}

	.error {
		color: hsl(0 60% 42%);
		font-size: 0.875rem;
		margin: 0 0 1rem;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	.btn {
		padding: 0.625rem 1.125rem;
		border-radius: var(--radius-md, 6px);
		font: inherit;
		font-size: 0.875rem;
		cursor: pointer;
		border: 1px solid transparent;
		text-decoration: none;
		display: inline-block;
	}

	.btn.primary {
		background: var(--color-primary, hsl(230 80% 50%));
		color: white;
	}

	.btn.primary:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.btn.secondary {
		background: transparent;
		border-color: var(--color-border, hsl(0 0% 88%));
		color: var(--color-text, inherit);
	}

	.btn.secondary:hover:not(:disabled) {
		background: var(--color-surface-2, hsl(0 0% 97%));
	}
</style>
