<script lang="ts">
	interface SecurityEvent {
		id: string;
		eventType: string;
		ipAddress: string | null;
		userAgent: string | null;
		metadata: any;
		createdAt: string;
	}

	interface Props {
		events: SecurityEvent[];
		onRefresh: () => Promise<void>;
		loading?: boolean;
		primaryColor?: string;
	}

	let { events, onRefresh, loading = false, primaryColor = '#6366f1' }: Props = $props();

	interface EventInfo {
		label: string;
		badgeClass: string;
		badgeText: string;
	}

	function getEventInfo(eventType: string): EventInfo {
		switch (eventType) {
			case 'login_success':
				return { label: 'Anmeldung erfolgreich', badgeClass: 'badge-success', badgeText: '' };
			case 'login_failure':
				return { label: 'Anmeldung fehlgeschlagen', badgeClass: 'badge-danger', badgeText: '' };
			case 'register':
				return { label: 'Konto erstellt', badgeClass: 'badge-info', badgeText: 'Neu' };
			case 'logout':
				return { label: 'Abgemeldet', badgeClass: 'badge-neutral', badgeText: '' };
			case 'password_changed':
				return { label: 'Passwort geändert', badgeClass: 'badge-warning', badgeText: '' };
			case 'password_reset_requested':
				return { label: 'Passwort-Reset angefordert', badgeClass: 'badge-warning', badgeText: '' };
			case 'password_reset_completed':
				return { label: 'Passwort zurückgesetzt', badgeClass: 'badge-warning', badgeText: '' };
			case 'passkey_registered':
				return { label: 'Passkey registriert', badgeClass: 'badge-warning', badgeText: '' };
			case 'passkey_login_success':
				return { label: 'Passkey-Anmeldung', badgeClass: 'badge-success', badgeText: '' };
			case 'passkey_deleted':
				return { label: 'Passkey gelöscht', badgeClass: 'badge-danger', badgeText: '' };
			case 'two_factor_enabled':
				return { label: '2FA aktiviert', badgeClass: 'badge-success', badgeText: '' };
			case 'two_factor_disabled':
				return { label: '2FA deaktiviert', badgeClass: 'badge-warning', badgeText: '' };
			case 'account_locked':
				return { label: 'Konto gesperrt', badgeClass: 'badge-danger', badgeText: '' };
			case 'account_deleted':
				return { label: 'Konto gelöscht', badgeClass: 'badge-danger', badgeText: '' };
			case 'sso_token_exchange':
				return { label: 'SSO-Anmeldung', badgeClass: 'badge-success', badgeText: '' };
			default:
				return { label: eventType, badgeClass: 'badge-neutral', badgeText: '' };
		}
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		const timeStr = date.toLocaleTimeString('de-DE', {
			hour: '2-digit',
			minute: '2-digit',
		});

		if (diffDays === 0) {
			return `Heute, ${timeStr}`;
		} else if (diffDays === 1) {
			return `Gestern, ${timeStr}`;
		} else {
			const dateFormatted = date.toLocaleDateString('de-DE', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
			});
			return `${dateFormatted}, ${timeStr}`;
		}
	}

	function parseUserAgent(ua: string | null): string {
		if (!ua) return '';

		let browser = '';
		let os = '';

		// Detect browser
		if (ua.includes('Firefox/')) browser = 'Firefox';
		else if (ua.includes('Edg/')) browser = 'Edge';
		else if (ua.includes('Chrome/') && !ua.includes('Edg/')) browser = 'Chrome';
		else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';
		else if (ua.includes('Opera/') || ua.includes('OPR/')) browser = 'Opera';

		// Detect OS
		if (ua.includes('Windows')) os = 'Windows';
		else if (ua.includes('Mac OS X') || ua.includes('Macintosh')) os = 'macOS';
		else if (ua.includes('Linux') && !ua.includes('Android')) os = 'Linux';
		else if (ua.includes('Android')) os = 'Android';
		else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

		const parts = [browser, os].filter(Boolean);
		return parts.length > 0 ? parts.join(' · ') : '';
	}
</script>

<div class="audit-log" style:--primary-color={primaryColor}>
	<div class="audit-header">
		<div class="audit-header-left">
			<div class="audit-icon">
				<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
					/>
				</svg>
			</div>
			<div>
				<h3 class="audit-title">Sicherheitsprotokoll</h3>
				<p class="audit-subtitle">Letzte Aktivitäten deines Kontos</p>
			</div>
		</div>
		<button
			type="button"
			class="refresh-button"
			onclick={onRefresh}
			disabled={loading}
			aria-label="Aktualisieren"
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

	{#if loading && events.length === 0}
		<div class="loading-state">
			<div class="loading-spinner"></div>
		</div>
	{:else if events.length === 0}
		<p class="empty-state">Keine Sicherheitsereignisse vorhanden.</p>
	{:else}
		<div class="event-list">
			{#each events as event (event.id)}
				{@const info = getEventInfo(event.eventType)}
				<div class="event-item">
					<div class="event-badge {info.badgeClass}"></div>
					<div class="event-content">
						<div class="event-label">
							{info.label}
							{#if info.badgeText}
								<span class="event-tag">{info.badgeText}</span>
							{/if}
						</div>
						<div class="event-meta">
							<span>{formatDate(event.createdAt)}</span>
							{#if event.ipAddress}
								<span class="meta-separator">·</span>
								<span>{event.ipAddress}</span>
							{/if}
						</div>
						{#if parseUserAgent(event.userAgent)}
							<div class="event-device">
								{parseUserAgent(event.userAgent)}
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.audit-log {
		width: 100%;
	}

	.audit-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.5rem;
	}

	.audit-header-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.audit-icon {
		display: flex;
		height: 2.5rem;
		width: 2.5rem;
		align-items: center;
		justify-content: center;
		border-radius: 9999px;
		background-color: color-mix(in srgb, var(--primary-color) 15%, transparent);
		color: var(--primary-color);
	}

	.audit-icon .icon {
		height: 1.25rem;
		width: 1.25rem;
	}

	.audit-title {
		font-size: 1.125rem;
		font-weight: 600;
		margin: 0;
	}

	.audit-subtitle {
		font-size: 0.875rem;
		color: var(--text-muted, #9ca3af);
		margin: 0;
	}

	.refresh-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 0.5rem;
		border: 1px solid var(--border-color, #e5e7eb);
		background: transparent;
		color: var(--text-muted, #9ca3af);
		cursor: pointer;
		transition: all 0.2s;
	}

	.refresh-button:hover:not(:disabled) {
		background: var(--hover-bg, #f3f4f6);
		color: var(--text-primary, #111827);
	}

	.refresh-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	:global(.dark) .refresh-button {
		border-color: rgba(255, 255, 255, 0.1);
	}

	:global(.dark) .refresh-button:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.05);
		color: #fff;
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

	.loading-state {
		display: flex;
		justify-content: center;
		padding: 2rem;
	}

	.loading-spinner {
		width: 2rem;
		height: 2rem;
		border: 3px solid var(--border-color, #e5e7eb);
		border-top-color: var(--primary-color);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	.empty-state {
		text-align: center;
		padding: 2rem;
		color: var(--text-muted, #9ca3af);
		font-size: 0.875rem;
	}

	.event-list {
		display: flex;
		flex-direction: column;
		max-height: 28rem;
		overflow-y: auto;
		border: 1px solid var(--border-color, #e5e7eb);
		border-radius: 0.75rem;
	}

	:global(.dark) .event-list {
		border-color: rgba(255, 255, 255, 0.1);
	}

	.event-item {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		border-bottom: 1px solid var(--border-color, #e5e7eb);
	}

	:global(.dark) .event-item {
		border-bottom-color: rgba(255, 255, 255, 0.06);
	}

	.event-item:last-child {
		border-bottom: none;
	}

	.event-badge {
		flex-shrink: 0;
		width: 0.625rem;
		height: 0.625rem;
		border-radius: 50%;
		margin-top: 0.375rem;
	}

	.badge-success {
		background-color: #22c55e;
	}

	.badge-danger {
		background-color: #ef4444;
	}

	.badge-warning {
		background-color: #f59e0b;
	}

	.badge-info {
		background-color: #3b82f6;
	}

	.badge-neutral {
		background-color: #9ca3af;
	}

	.event-content {
		flex: 1;
		min-width: 0;
	}

	.event-label {
		font-size: 0.875rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.event-tag {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.0625rem 0.375rem;
		border-radius: 9999px;
		background-color: color-mix(in srgb, var(--primary-color) 15%, transparent);
		color: var(--primary-color);
	}

	.event-meta {
		font-size: 0.75rem;
		color: var(--text-muted, #9ca3af);
		margin-top: 0.125rem;
	}

	.meta-separator {
		margin: 0 0.25rem;
	}

	.event-device {
		font-size: 0.75rem;
		color: var(--text-muted, #9ca3af);
		opacity: 0.8;
	}

	@media (prefers-reduced-motion: reduce) {
		.spinning {
			animation: none;
		}
		.loading-spinner {
			animation: none;
		}
	}
</style>
