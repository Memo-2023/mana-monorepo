<!--
  Spaces app — workbench card.

  Manages members + invitations of the currently active Space. Personal
  spaces show a hint card only; shared spaces (brand/club/family/team/
  practice) show the invite form, member list, and pending invitations.

  Renders equally well inside the workbench or standalone at /spaces.
-->
<script lang="ts">
	import { formatDate } from '$lib/i18n/format';
	import { onMount } from 'svelte';
	import { getActiveSpace, authFetch } from '$lib/data/scope';
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
				authFetch(
					`/api/auth/organization/list-members?organizationId=${encodeURIComponent(activeSpace.id)}`
				),
				authFetch(
					`/api/auth/organization/list-invitations?organizationId=${encodeURIComponent(activeSpace.id)}`
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
			const res = await authFetch('/api/auth/organization/invite-member', {
				method: 'POST',
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
		const res = await authFetch('/api/auth/organization/cancel-invitation', {
			method: 'POST',
			body: JSON.stringify({ invitationId: id }),
		});
		if (res.ok) await refresh();
	}

	async function removeMember(userId: string) {
		if (!activeSpace) return;
		if (!confirm('Mitglied wirklich entfernen?')) return;
		const res = await authFetch('/api/auth/organization/remove-member', {
			method: 'POST',
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
		return formatDate(d);
	}
</script>

<div class="pane">
	<header class="bar">
		<div class="title">
			<strong>Mitglieder</strong>
			{#if activeSpace}
				<span class="sub">
					{activeSpace.name} · {SPACE_TYPE_LABELS.de[activeSpace.type]}
				</span>
			{/if}
		</div>
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
	.pane {
		max-width: 720px;
		margin: 0 auto;
		padding: 1rem;
		color: hsl(var(--color-foreground));
	}

	.bar {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.bar .title strong {
		font-size: 1rem;
		font-weight: 600;
	}

	.bar .sub {
		margin-left: 0.5rem;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground, 0 0% 50%));
	}

	.hint-card {
		background: hsl(var(--color-muted, 0 0% 97%));
		border: 1px solid hsl(var(--color-border));
		border-radius: 10px;
		padding: 1rem;
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground, 0 0% 50%));
		line-height: 1.5;
	}

	.panel {
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		border-radius: 12px;
		padding: 1.125rem;
		margin-bottom: 1rem;
		box-shadow: 0 1px 2px hsl(0 0% 0% / 0.04);
	}

	.panel h2 {
		font-size: 0.75rem;
		font-weight: 500;
		margin: 0 0 0.75rem;
		color: hsl(var(--color-muted-foreground, 0 0% 50%));
		text-transform: uppercase;
		letter-spacing: 0.04em;
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
		padding: 0.5rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 8px;
		background: hsl(var(--color-input, var(--color-background, var(--color-card))));
		color: hsl(var(--color-foreground));
		font: inherit;
		font-size: 0.875rem;
		transition: border-color 120ms ease;
	}

	.invite-form input::placeholder {
		color: hsl(var(--color-muted-foreground, 0 0% 50%) / 0.7);
	}

	.invite-form input:focus,
	.invite-form select:focus {
		outline: none;
		border-color: var(--pill-primary-color, hsl(var(--color-primary, 230 80% 55%)));
		box-shadow: 0 0 0 3px
			color-mix(
				in srgb,
				var(--pill-primary-color, hsl(var(--color-primary, 230 80% 55%))) 20%,
				transparent
			);
	}

	.invite-form button {
		padding: 0.5rem 1.125rem;
		background: var(--pill-primary-color, hsl(var(--color-primary, 230 80% 55%)));
		color: hsl(var(--color-primary-foreground, 0 0% 100%));
		border: 0;
		border-radius: 8px;
		font: inherit;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: filter 120ms ease;
	}

	.invite-form button:hover:not(:disabled) {
		filter: brightness(1.05);
	}

	.invite-form button:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.error {
		color: hsl(0 70% 55%);
		font-size: 0.8125rem;
		margin: 0.5rem 0 0;
	}

	:global(.dark) .error {
		color: hsl(0 80% 72%);
	}

	.success {
		color: hsl(140 50% 40%);
		font-size: 0.8125rem;
		margin: 0.5rem 0 0;
	}

	:global(.dark) .success {
		color: hsl(140 60% 65%);
	}

	.empty {
		color: hsl(var(--color-muted-foreground, 0 0% 50%));
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
		gap: 0.75rem;
		padding: 0.75rem 0.875rem;
		border-radius: 10px;
		background: hsl(var(--color-muted, 0 0% 97%));
		border: 1px solid hsl(var(--color-border) / 0.5);
	}

	.member-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-width: 0;
		flex: 1;
	}

	.avatar {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: var(--pill-primary-color, hsl(var(--color-primary, 230 80% 55%)));
		color: hsl(var(--color-primary-foreground, 0 0% 100%));
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.8125rem;
		font-weight: 600;
		flex-shrink: 0;
	}

	.member-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.member-meta,
	.invite-meta {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground, 0 0% 55%));
	}

	.invite-email {
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
	}

	.member-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.role-badge {
		font-size: 0.6875rem;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		color: hsl(var(--color-muted-foreground, 0 0% 50%));
		text-transform: uppercase;
		letter-spacing: 0.02em;
		font-weight: 500;
	}

	.remove-btn {
		padding: 0.25rem 0.625rem;
		background: transparent;
		border: 1px solid hsl(var(--color-border));
		border-radius: 6px;
		color: hsl(var(--color-muted-foreground, 0 0% 55%));
		font: inherit;
		font-size: 0.75rem;
		cursor: pointer;
		transition:
			color 120ms ease,
			border-color 120ms ease,
			background 120ms ease;
	}

	.remove-btn:hover {
		color: hsl(0 70% 55%);
		border-color: color-mix(in srgb, hsl(0 70% 55%) 40%, transparent);
		background: color-mix(in srgb, hsl(0 70% 55%) 8%, transparent);
	}
</style>
