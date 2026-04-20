<script lang="ts">
	/**
	 * /spaces/members — member management for the active Space.
	 *
	 * Shows who is a member, pending invitations, and an Einladen form
	 * that posts to Better Auth's /organization/invite-member endpoint.
	 * Better Auth itself sends the invitation email (via the handler
	 * wired in services/mana-auth/src/auth/better-auth.config.ts).
	 *
	 * First shared-space surface — dogfoods the whole multi-tenancy
	 * pipeline end-to-end.
	 */

	import { onMount } from 'svelte';
	import { getActiveSpace } from '$lib/data/scope';
	import { SPACE_TYPE_LABELS } from '@mana/shared-branding';

	interface Member {
		id: string;
		userId: string;
		role: string;
		createdAt: string;
		user?: { email?: string; name?: string | null; image?: string | null };
	}

	interface Invitation {
		id: string;
		email: string;
		role: string;
		status: string;
		expiresAt: string;
		inviterId: string;
	}

	let members = $state<Member[]>([]);
	let invitations = $state<Invitation[]>([]);
	let loading = $state(true);
	let loadError = $state<string | null>(null);

	let inviteEmail = $state('');
	let inviteRole = $state<'owner' | 'admin' | 'member'>('member');
	let inviteSubmitting = $state(false);
	let inviteError = $state<string | null>(null);
	let inviteSuccess = $state<string | null>(null);

	const activeSpace = $derived(getActiveSpace());
	const canManage = $derived(activeSpace?.role === 'owner' || activeSpace?.role === 'admin');

	async function refresh() {
		if (!activeSpace) return;
		loading = true;
		loadError = null;
		try {
			const [memRes, invRes] = await Promise.all([
				fetch(
					`/api/auth/organization/list-members?organizationId=${encodeURIComponent(activeSpace.id)}`,
					{ credentials: 'include' }
				),
				fetch(
					`/api/auth/organization/list-invitations?organizationId=${encodeURIComponent(activeSpace.id)}`,
					{ credentials: 'include' }
				),
			]);
			if (memRes.ok) {
				const data = (await memRes.json()) as { members?: Member[] } | Member[];
				members = Array.isArray(data) ? data : (data.members ?? []);
			}
			if (invRes.ok) {
				const data = (await invRes.json()) as Invitation[] | { invitations?: Invitation[] };
				invitations = Array.isArray(data) ? data : (data.invitations ?? []);
			}
		} catch (err) {
			loadError = err instanceof Error ? err.message : String(err);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		void refresh();
	});

	async function submitInvite(e: Event) {
		e.preventDefault();
		if (!activeSpace) return;
		if (inviteSubmitting) return;
		if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
			inviteError = 'Bitte eine gültige E-Mail angeben';
			return;
		}
		inviteSubmitting = true;
		inviteError = null;
		inviteSuccess = null;
		try {
			const res = await fetch('/api/auth/organization/invite-member', {
				method: 'POST',
				credentials: 'include',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					email: inviteEmail.trim(),
					role: inviteRole,
					organizationId: activeSpace.id,
				}),
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `invite failed: ${res.status}`);
			}
			inviteSuccess = `Einladung an ${inviteEmail.trim()} gesendet`;
			inviteEmail = '';
			await refresh();
		} catch (err) {
			inviteError = err instanceof Error ? err.message : String(err);
		} finally {
			inviteSubmitting = false;
		}
	}

	async function cancelInvitation(id: string) {
		const res = await fetch('/api/auth/organization/cancel-invitation', {
			method: 'POST',
			credentials: 'include',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ invitationId: id }),
		});
		if (res.ok) await refresh();
	}

	async function removeMember(userId: string) {
		if (!activeSpace) return;
		if (!confirm('Mitglied wirklich entfernen?')) return;
		const res = await fetch('/api/auth/organization/remove-member', {
			method: 'POST',
			credentials: 'include',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ memberIdOrEmail: userId, organizationId: activeSpace.id }),
		});
		if (res.ok) await refresh();
	}

	function relativeDate(iso: string): string {
		const d = new Date(iso);
		const now = Date.now();
		const diff = now - d.getTime();
		const sec = Math.floor(diff / 1000);
		if (sec < 60) return 'gerade eben';
		if (sec < 3600) return `vor ${Math.floor(sec / 60)} min`;
		if (sec < 86400) return `vor ${Math.floor(sec / 3600)} h`;
		return d.toLocaleDateString('de-DE');
	}
</script>

<div class="container">
	<header class="page-head">
		<h1>Mitglieder</h1>
		{#if activeSpace}
			<p class="subtitle">
				<strong>{activeSpace.name}</strong>
				<span class="type-chip" data-type={activeSpace.type}
					>{SPACE_TYPE_LABELS.de[activeSpace.type]}</span
				>
			</p>
		{/if}
	</header>

	{#if !activeSpace}
		<p class="empty">Lade aktiven Space …</p>
	{:else if activeSpace.type === 'personal'}
		<div class="hint-card">
			<p>
				Dein Personal-Space kann keine weiteren Mitglieder haben — er ist bewusst nur für dich. Für
				geteilte Bereiche (Familie, Team, Marke, Verein) lege einen neuen Space an und lade dann
				hier ein.
			</p>
		</div>
	{:else}
		{#if canManage}
			<section class="panel">
				<h2>Einladen</h2>
				<form onsubmit={submitInvite} class="invite-form">
					<input
						type="email"
						bind:value={inviteEmail}
						placeholder="name@beispiel.de"
						required
						disabled={inviteSubmitting}
					/>
					<select bind:value={inviteRole} disabled={inviteSubmitting}>
						<option value="member">Mitglied</option>
						<option value="admin">Admin</option>
					</select>
					<button type="submit" disabled={inviteSubmitting}>
						{inviteSubmitting ? 'Sende …' : 'Einladen'}
					</button>
				</form>
				{#if inviteError}<p class="error">{inviteError}</p>{/if}
				{#if inviteSuccess}<p class="success">{inviteSuccess}</p>{/if}
			</section>
		{/if}

		<section class="panel">
			<h2>Mitglieder ({members.length})</h2>
			{#if loading}
				<p class="empty">Lädt …</p>
			{:else if loadError}
				<p class="error">{loadError}</p>
			{:else if members.length === 0}
				<p class="empty">Nur du bist Mitglied.</p>
			{:else}
				<ul class="member-list">
					{#each members as m (m.id)}
						<li class="member-row">
							<div class="member-info">
								<div class="avatar" aria-hidden="true">
									{(m.user?.name ?? m.user?.email ?? '?').charAt(0).toUpperCase()}
								</div>
								<div>
									<div class="member-name">{m.user?.name ?? m.user?.email ?? m.userId}</div>
									{#if m.user?.email && m.user?.name}
										<div class="member-meta">{m.user.email}</div>
									{/if}
								</div>
							</div>
							<div class="member-actions">
								<span class="role-badge">{m.role}</span>
								{#if canManage && m.role !== 'owner'}
									<button
										type="button"
										class="remove-btn"
										onclick={() => removeMember(m.userId)}
										aria-label="Entfernen"
									>
										Entfernen
									</button>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		{#if invitations.length > 0}
			<section class="panel">
				<h2>Offene Einladungen ({invitations.length})</h2>
				<ul class="invite-list">
					{#each invitations.filter((i) => i.status === 'pending') as inv (inv.id)}
						<li class="invite-row">
							<div>
								<div class="invite-email">{inv.email}</div>
								<div class="invite-meta">
									{inv.role} · verschickt {relativeDate(inv.expiresAt)}
								</div>
							</div>
							{#if canManage}
								<button type="button" class="remove-btn" onclick={() => cancelInvitation(inv.id)}
									>Stornieren</button
								>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	{/if}
</div>

<style>
	.container {
		max-width: 640px;
		margin: 0 auto;
		padding: 1rem;
	}

	.page-head {
		margin-bottom: 1.5rem;
	}

	.page-head h1 {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0 0 0.25rem;
	}

	.subtitle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0;
		color: var(--color-text-muted, hsl(0 0% 45%));
		font-size: 0.875rem;
	}

	.type-chip {
		font-size: 0.6875rem;
		padding: 0.125rem 0.5rem;
		border-radius: var(--radius-sm, 4px);
		background: var(--color-surface-2, hsl(0 0% 94%));
		color: var(--color-text-muted, hsl(0 0% 45%));
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

	.hint-card {
		background: var(--color-surface-2, hsl(0 0% 97%));
		border: 1px solid var(--color-border, hsl(0 0% 88%));
		border-radius: var(--radius-md, 6px);
		padding: 1rem;
		font-size: 0.875rem;
		color: var(--color-text-muted, hsl(0 0% 45%));
		line-height: 1.5;
	}

	.panel {
		background: var(--color-surface-1, white);
		border: 1px solid var(--color-border, hsl(0 0% 88%));
		border-radius: var(--radius-md, 6px);
		padding: 1rem;
		margin-bottom: 1rem;
	}

	.panel h2 {
		font-size: 0.9375rem;
		font-weight: 600;
		margin: 0 0 0.75rem;
	}

	.invite-form {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.invite-form input[type='email'] {
		flex: 1 1 200px;
	}

	.invite-form input,
	.invite-form select {
		padding: 0.5rem 0.625rem;
		border: 1px solid var(--color-border, hsl(0 0% 88%));
		border-radius: var(--radius-md, 6px);
		background: var(--color-surface-1, white);
		color: var(--color-text, inherit);
		font: inherit;
		font-size: 0.875rem;
	}

	.invite-form button {
		padding: 0.5rem 1rem;
		background: var(--color-primary, hsl(230 80% 50%));
		color: white;
		border: 0;
		border-radius: var(--radius-md, 6px);
		font: inherit;
		font-size: 0.875rem;
		cursor: pointer;
	}

	.invite-form button:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.error {
		color: hsl(0 60% 42%);
		font-size: 0.8125rem;
		margin: 0.5rem 0 0;
	}

	.success {
		color: hsl(140 50% 34%);
		font-size: 0.8125rem;
		margin: 0.5rem 0 0;
	}

	.empty {
		color: var(--color-text-muted, hsl(0 0% 45%));
		font-size: 0.875rem;
		margin: 0;
	}

	.member-list,
	.invite-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.member-row,
	.invite-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.625rem 0.75rem;
		border-radius: var(--radius-md, 6px);
		background: var(--color-surface-2, hsl(0 0% 97%));
	}

	.member-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.avatar {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: var(--color-primary, hsl(230 80% 50%));
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.member-name {
		font-size: 0.875rem;
		font-weight: 500;
	}

	.member-meta,
	.invite-meta {
		font-size: 0.75rem;
		color: var(--color-text-muted, hsl(0 0% 45%));
	}

	.invite-email {
		font-size: 0.875rem;
		font-weight: 500;
	}

	.member-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.role-badge {
		font-size: 0.6875rem;
		padding: 0.125rem 0.5rem;
		border-radius: var(--radius-sm, 4px);
		background: var(--color-surface-1, white);
		border: 1px solid var(--color-border, hsl(0 0% 88%));
		color: var(--color-text-muted, hsl(0 0% 45%));
		text-transform: uppercase;
	}

	.remove-btn {
		padding: 0.25rem 0.625rem;
		background: transparent;
		border: 1px solid var(--color-border, hsl(0 0% 88%));
		border-radius: var(--radius-sm, 4px);
		color: var(--color-text-muted, hsl(0 0% 45%));
		font: inherit;
		font-size: 0.75rem;
		cursor: pointer;
	}

	.remove-btn:hover {
		color: hsl(0 60% 42%);
		border-color: hsl(0 60% 80%);
	}
</style>
