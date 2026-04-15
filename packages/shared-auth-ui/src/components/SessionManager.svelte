<script lang="ts">
	import { parseUserAgent, getDeviceType } from '../utils/userAgent';
	import type { SessionManagerTranslations } from '../types';

	interface Session {
		id: string;
		ipAddress: string | null;
		userAgent: string | null;
		deviceId: string | null;
		deviceName: string | null;
		lastActivityAt: string | null;
		createdAt: string;
		expiresAt: string;
	}

	interface Props {
		sessions: Session[];
		currentSessionId?: string;
		onRevoke: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
		onRefresh: () => Promise<void>;
		loading?: boolean;
		primaryColor?: string;
		locale?: 'de' | 'en';
		translations?: SessionManagerTranslations;
	}

	const defaultTranslationsDE: Required<SessionManagerTranslations> = {
		title: 'Aktive Sitzungen',
		subtitle: 'Geräte, die aktuell angemeldet sind',
		current: 'Aktuell',
		revoke: 'Abmelden',
		revokeAll: 'Alle anderen Sitzungen beenden',
		lastActivity: 'Letzte Aktivität',
		confirmRevoke: 'Sitzung wirklich beenden?',
		confirmRevokeAll: 'Alle anderen Sitzungen wirklich beenden?',
		noSessions: 'Keine aktiven Sitzungen gefunden.',
		unknown: 'Unbekanntes Gerät',
		refresh: 'Aktualisieren',
		revokeError: 'Fehler beim Beenden der Sitzung',
		revokeAllError: 'Fehler beim Beenden der Sitzungen',
		justNow: 'gerade eben',
		minutesAgo: 'Min',
		hoursAgo: 'Std',
		yesterday: 'Gestern',
		daysAgo: 'Tagen',
	};

	const defaultTranslationsEN: Required<SessionManagerTranslations> = {
		title: 'Active Sessions',
		subtitle: 'Devices currently signed in',
		current: 'Current',
		revoke: 'Revoke',
		revokeAll: 'Revoke all other sessions',
		lastActivity: 'Last activity',
		confirmRevoke: 'Really revoke this session?',
		confirmRevokeAll: 'Really revoke all other sessions?',
		noSessions: 'No active sessions found.',
		unknown: 'Unknown device',
		refresh: 'Refresh',
		revokeError: 'Error revoking session',
		revokeAllError: 'Error revoking sessions',
		justNow: 'just now',
		minutesAgo: 'min',
		hoursAgo: 'hrs',
		yesterday: 'Yesterday',
		daysAgo: 'days',
	};

	let {
		sessions,
		currentSessionId,
		onRevoke,
		onRefresh,
		loading = false,
		primaryColor = '#6366f1',
		locale = 'de',
		translations,
	}: Props = $props();

	const defaults = $derived(locale === 'en' ? defaultTranslationsEN : defaultTranslationsDE);
	let t = $derived({ ...defaults, ...translations });
	let revoking = $state<string | null>(null);
	let revokingAll = $state(false);
	let error = $state<string | null>(null);

	function formatRelativeTime(dateStr: string | null): string {
		if (!dateStr) return '';
		const date = new Date(dateStr);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffSec = Math.floor(diffMs / 1000);
		const diffMin = Math.floor(diffSec / 60);
		const diffHours = Math.floor(diffMin / 60);
		const diffDays = Math.floor(diffHours / 24);
		const dateLocale = locale === 'en' ? 'en-US' : 'de-DE';

		if (diffSec < 60) return t.justNow!;
		if (diffMin < 60) return `${diffMin} ${t.minutesAgo}`;
		if (diffHours < 24) return `${diffHours} ${t.hoursAgo}`;
		if (diffDays === 1) return t.yesterday!;
		if (diffDays < 7) return `${diffDays} ${t.daysAgo}`;

		return date.toLocaleDateString(dateLocale, {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	}

	function getSessionLabel(session: Session): string {
		if (session.deviceName) return session.deviceName;
		const { browser, os } = parseUserAgent(session.userAgent);
		const parts = [browser, os].filter(Boolean);
		return parts.length > 0 ? parts.join(' \u00b7 ') : t.unknown;
	}

	function isCurrent(session: Session): boolean {
		if (!currentSessionId) return false;
		return session.id === currentSessionId;
	}

	async function handleRevoke(sessionId: string) {
		if (!confirm(t.confirmRevoke)) return;
		error = null;
		revoking = sessionId;
		try {
			const result = await onRevoke(sessionId);
			if (!result.success) {
				error = result.error || t.revokeError!;
			} else {
				await onRefresh();
			}
		} catch (e) {
			error = e instanceof Error ? e.message : t.revokeError!;
		} finally {
			revoking = null;
		}
	}

	async function handleRevokeAll() {
		if (!confirm(t.confirmRevokeAll)) return;
		error = null;
		revokingAll = true;
		try {
			const otherSessions = sessions.filter((s) => !isCurrent(s));
			for (const session of otherSessions) {
				await onRevoke(session.id);
			}
			await onRefresh();
		} catch (e) {
			error = e instanceof Error ? e.message : t.revokeAllError!;
		} finally {
			revokingAll = false;
		}
	}

	let otherSessionCount = $derived(
		currentSessionId ? sessions.filter((s) => !isCurrent(s)).length : sessions.length - 1
	);
</script>

<div class="session-manager" style:--primary-color={primaryColor}>
	<div class="session-header">
		<div class="session-header-left">
			<div class="session-icon">
				<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
					/>
				</svg>
			</div>
			<div>
				<h3 class="session-title">{t.title} ({sessions.length})</h3>
				<p class="session-subtitle">{t.subtitle}</p>
			</div>
		</div>
		<button
			type="button"
			class="refresh-button"
			onclick={onRefresh}
			disabled={loading}
			aria-disabled={loading}
			aria-label={t.refresh}
		>
			<svg
				class="refresh-icon"
				class:spinning={loading}
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
				/>
			</svg>
		</button>
	</div>

	{#if error}
		<div class="error-message">{error}</div>
	{/if}

	{#if loading && sessions.length === 0}
		<div class="loading-state">
			<div class="loading-spinner"></div>
		</div>
	{:else if sessions.length === 0}
		<p class="empty-state">{t.noSessions}</p>
	{:else}
		<div class="session-list">
			{#each sessions as session (session.id)}
				{@const current = isCurrent(session)}
				{@const deviceType = getDeviceType(session.userAgent)}
				<div class="session-item" class:session-current={current}>
					<div class="session-device-icon">
						{#if deviceType === 'mobile'}
							<svg class="device-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="1.5"
									d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
								/>
							</svg>
						{:else if deviceType === 'tablet'}
							<svg class="device-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="1.5"
									d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
								/>
							</svg>
						{:else}
							<svg class="device-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="1.5"
									d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
								/>
							</svg>
						{/if}
					</div>
					<div class="session-content">
						<div class="session-label">
							<span class="session-name">{getSessionLabel(session)}</span>
							{#if current}
								<span class="current-badge">{t.current}</span>
							{/if}
						</div>
						{#if session.ipAddress}
							<div class="session-ip">{session.ipAddress}</div>
						{/if}
						{#if session.lastActivityAt}
							<div class="session-activity">
								{t.lastActivity}: {formatRelativeTime(session.lastActivityAt)}
							</div>
						{/if}
					</div>
					{#if !current}
						<button
							type="button"
							class="revoke-button"
							onclick={() => handleRevoke(session.id)}
							disabled={revoking === session.id || revokingAll}
							aria-disabled={revoking === session.id || revokingAll}
						>
							{#if revoking === session.id}
								<span class="revoke-spinner"></span>
							{:else}
								{t.revoke}
							{/if}
						</button>
					{/if}
				</div>
			{/each}
		</div>

		{#if otherSessionCount > 0}
			<button
				type="button"
				class="revoke-all-button"
				onclick={handleRevokeAll}
				disabled={revokingAll}
				aria-disabled={revokingAll}
			>
				{#if revokingAll}
					<span class="revoke-spinner"></span>
				{:else}
					{t.revokeAll}
				{/if}
			</button>
		{/if}
	{/if}
</div>

<style>
	.session-manager {
		width: 100%;
	}

	.session-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.5rem;
	}

	.session-header-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.session-icon {
		display: flex;
		height: 2.5rem;
		width: 2.5rem;
		align-items: center;
		justify-content: center;
		border-radius: 9999px;
		background-color: color-mix(in srgb, var(--primary-color) 15%, transparent);
		color: var(--primary-color);
	}

	.session-icon .icon {
		height: 1.25rem;
		width: 1.25rem;
	}

	.session-title {
		font-size: 1.125rem;
		font-weight: 600;
		margin: 0;
	}

	.session-subtitle {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground, 220 9% 46%));
		margin: 0;
	}

	.refresh-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 0.5rem;
		border: 1px solid hsl(var(--color-border, 220 13% 91%));
		background: transparent;
		color: hsl(var(--color-muted-foreground, 220 9% 46%));
		cursor: pointer;
		transition: all 0.2s;
	}

	.refresh-button:hover:not(:disabled) {
		background: hsl(var(--color-muted, 220 14% 96%));
		color: hsl(var(--color-foreground, 220 9% 10%));
	}

	.refresh-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.refresh-icon {
		width: 1.125rem;
		height: 1.125rem;
	}

	.spinning {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Semantic red kept for error */
	.error-message {
		padding: 0.75rem 1rem;
		margin-bottom: 1rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		background-color: #fef2f2;
		color: #dc2626;
		border: 1px solid #fecaca;
	}

	:global(.dark) .error-message {
		background-color: rgba(220, 38, 38, 0.1);
		border-color: rgba(220, 38, 38, 0.2);
		color: #fca5a5;
	}

	.loading-state {
		display: flex;
		justify-content: center;
		padding: 2rem;
	}

	.loading-spinner {
		width: 2rem;
		height: 2rem;
		border: 3px solid hsl(var(--color-border, 220 13% 91%));
		border-top-color: var(--primary-color);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	.empty-state {
		text-align: center;
		padding: 2rem;
		color: hsl(var(--color-muted-foreground, 220 9% 46%));
		font-size: 0.875rem;
	}

	.session-list {
		display: flex;
		flex-direction: column;
		border: 1px solid hsl(var(--color-border, 220 13% 91%));
		border-radius: 0.75rem;
		overflow: hidden;
	}

	.session-item {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 1rem;
		border-bottom: 1px solid hsl(var(--color-border, 220 13% 91%));
	}

	.session-item:last-child {
		border-bottom: none;
	}

	.session-current {
		background-color: color-mix(in srgb, var(--primary-color) 5%, transparent);
	}

	.session-device-icon {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 0.5rem;
		background-color: hsl(var(--color-muted, 220 14% 96%));
		color: hsl(var(--color-muted-foreground, 220 9% 46%));
	}

	.device-icon {
		width: 1.25rem;
		height: 1.25rem;
	}

	.session-content {
		flex: 1;
		min-width: 0;
	}

	.session-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.session-name {
		font-size: 0.875rem;
		font-weight: 500;
	}

	.current-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		background-color: color-mix(in srgb, var(--primary-color) 15%, transparent);
		color: var(--primary-color);
	}

	.session-ip {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground, 220 9% 46%));
		margin-top: 0.125rem;
	}

	.session-activity {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground, 220 9% 46%));
		opacity: 0.8;
	}

	/* Semantic red kept for revoke actions */
	.revoke-button {
		flex-shrink: 0;
		align-self: center;
		padding: 0.375rem 0.75rem;
		font-size: 0.8125rem;
		font-weight: 500;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border, 220 13% 91%));
		background: transparent;
		color: #dc2626;
		cursor: pointer;
		transition: all 0.15s;
		min-width: 5rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.revoke-button:hover:not(:disabled) {
		background-color: #fef2f2;
		border-color: #fecaca;
	}

	:global(.dark) .revoke-button {
		color: #fca5a5;
	}

	:global(.dark) .revoke-button:hover:not(:disabled) {
		background-color: rgba(220, 38, 38, 0.1);
		border-color: rgba(220, 38, 38, 0.2);
	}

	.revoke-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.revoke-all-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		margin-top: 0.75rem;
		padding: 0.625rem 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		border-radius: 0.5rem;
		border: 1px solid #fecaca;
		background: #fef2f2;
		color: #dc2626;
		cursor: pointer;
		transition: all 0.15s;
	}

	.revoke-all-button:hover:not(:disabled) {
		background-color: #fee2e2;
		border-color: #fca5a5;
	}

	:global(.dark) .revoke-all-button {
		background-color: rgba(220, 38, 38, 0.1);
		border-color: rgba(220, 38, 38, 0.2);
		color: #fca5a5;
	}

	:global(.dark) .revoke-all-button:hover:not(:disabled) {
		background-color: rgba(220, 38, 38, 0.15);
	}

	.revoke-all-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.revoke-spinner {
		display: inline-block;
		width: 1rem;
		height: 1rem;
		border: 2px solid currentColor;
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@media (prefers-reduced-motion: reduce) {
		.spinning {
			animation: none;
		}
		.loading-spinner {
			animation: none;
		}
		.revoke-spinner {
			animation: none;
		}
	}
</style>
