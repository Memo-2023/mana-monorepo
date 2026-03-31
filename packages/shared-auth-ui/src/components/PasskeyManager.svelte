<script lang="ts">
	/** Translation strings for the PasskeyManager */
	export interface PasskeyManagerTranslations {
		title: string;
		noPasskeys: string;
		registerButton: string;
		renameButton: string;
		deleteButton: string;
		cancelButton: string;
		saveButton: string;
		confirmDeleteTitle: string;
		confirmDeleteMessage: string;
		created: string;
		lastUsed: string;
		never: string;
		backedUp: string;
		notBackedUp: string;
		browserNotSupported: string;
		registerNamePlaceholder: string;
		registerNameLabel: string;
		registerTitle: string;
		renamePlaceholder: string;
		errorGeneric: string;
		daysAgo: (days: number) => string;
		hoursAgo: (hours: number) => string;
		minutesAgo: (minutes: number) => string;
		justNow: string;
	}

	interface Passkey {
		id: string;
		credentialId: string;
		deviceType: string;
		backedUp: boolean;
		friendlyName: string | null;
		lastUsedAt: string | null;
		createdAt: string;
	}

	interface Props {
		passkeys: Passkey[];
		onRegister: (friendlyName?: string) => Promise<{ success: boolean; error?: string }>;
		onDelete: (passkeyId: string) => Promise<{ success: boolean; error?: string }>;
		onRename: (
			passkeyId: string,
			friendlyName: string
		) => Promise<{ success: boolean; error?: string }>;
		onRefresh: () => Promise<void>;
		passkeyAvailable: boolean;
		primaryColor?: string;
		translations?: Partial<PasskeyManagerTranslations>;
	}

	const defaultTranslations: PasskeyManagerTranslations = {
		title: 'Passkeys',
		noPasskeys: 'Noch keine Passkeys registriert.',
		registerButton: 'Neuen Passkey registrieren',
		renameButton: 'Umbenennen',
		deleteButton: 'Löschen',
		cancelButton: 'Abbrechen',
		saveButton: 'Speichern',
		confirmDeleteTitle: 'Passkey löschen',
		confirmDeleteMessage:
			'Möchtest du diesen Passkey wirklich löschen? Du kannst dich dann nicht mehr damit anmelden.',
		created: 'Erstellt',
		lastUsed: 'Zuletzt',
		never: 'Nie verwendet',
		backedUp: 'Synchronisiert',
		notBackedUp: 'Nur auf diesem Gerät',
		browserNotSupported:
			'Dein Browser unterstützt keine Passkeys. Bitte verwende einen aktuellen Browser wie Chrome, Safari oder Firefox.',
		registerNamePlaceholder: 'z.B. MacBook Pro, iPhone',
		registerNameLabel: 'Name für den Passkey (optional)',
		registerTitle: 'Neuen Passkey registrieren',
		renamePlaceholder: 'Neuer Name',
		errorGeneric: 'Ein Fehler ist aufgetreten.',
		daysAgo: (days: number) => (days === 1 ? 'vor 1 Tag' : `vor ${days} Tagen`),
		hoursAgo: (hours: number) => (hours === 1 ? 'vor 1 Stunde' : `vor ${hours} Stunden`),
		minutesAgo: (minutes: number) => (minutes === 1 ? 'vor 1 Minute' : `vor ${minutes} Minuten`),
		justNow: 'Gerade eben',
	};

	let {
		passkeys,
		onRegister,
		onDelete,
		onRename,
		onRefresh,
		passkeyAvailable,
		primaryColor = '#6366f1',
		translations,
	}: Props = $props();

	const t = $derived({ ...defaultTranslations, ...translations });

	// State
	let editingId = $state<string | null>(null);
	let editName = $state('');
	let deletingId = $state<string | null>(null);
	let showRegisterForm = $state(false);
	let registerName = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const year = date.getFullYear();
		return `${day}.${month}.${year}`;
	}

	function formatRelativeTime(dateStr: string | null): string {
		if (!dateStr) return t.never;
		const date = new Date(dateStr);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMinutes = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMinutes < 1) return t.justNow;
		if (diffMinutes < 60) return t.minutesAgo(diffMinutes);
		if (diffHours < 24) return t.hoursAgo(diffHours);
		return t.daysAgo(diffDays);
	}

	function getDeviceIcon(deviceType: string): string {
		const type = deviceType.toLowerCase();
		if (type.includes('phone') || type.includes('mobile')) return '\u{1F4F1}';
		if (type.includes('tablet')) return '\u{1F4F1}';
		return '\u{1F511}';
	}

	function getDisplayName(passkey: Passkey): string {
		return passkey.friendlyName || 'Passkey';
	}

	function startRename(passkey: Passkey) {
		editingId = passkey.id;
		editName = passkey.friendlyName || '';
		error = null;
	}

	function cancelRename() {
		editingId = null;
		editName = '';
	}

	async function saveRename(passkeyId: string) {
		if (!editName.trim()) return;
		loading = true;
		error = null;
		const result = await onRename(passkeyId, editName.trim());
		loading = false;
		if (result.success) {
			editingId = null;
			editName = '';
			await onRefresh();
		} else {
			error = result.error || t.errorGeneric;
		}
	}

	function confirmDelete(passkeyId: string) {
		deletingId = passkeyId;
		error = null;
	}

	function cancelDelete() {
		deletingId = null;
	}

	async function executeDelete() {
		if (!deletingId) return;
		loading = true;
		error = null;
		const result = await onDelete(deletingId);
		loading = false;
		if (result.success) {
			deletingId = null;
			await onRefresh();
		} else {
			error = result.error || t.errorGeneric;
		}
	}

	function openRegisterForm() {
		showRegisterForm = true;
		registerName = '';
		error = null;
	}

	function cancelRegister() {
		showRegisterForm = false;
		registerName = '';
	}

	async function handleRegister() {
		loading = true;
		error = null;
		const result = await onRegister(registerName.trim() || undefined);
		loading = false;
		if (result.success) {
			showRegisterForm = false;
			registerName = '';
			await onRefresh();
		} else {
			error = result.error || t.errorGeneric;
		}
	}
</script>

<div class="passkey-manager" style:--primary-color={primaryColor}>
	<h3 class="pm-title">{t.title}</h3>

	{#if !passkeyAvailable}
		<div class="pm-warning" role="alert">
			<span class="pm-warning-icon">{'\u26A0\uFE0F'}</span>
			<p>{t.browserNotSupported}</p>
		</div>
	{:else}
		{#if error}
			<div class="pm-error" role="alert">
				<p>{error}</p>
			</div>
		{/if}

		{#if passkeys.length === 0}
			<p class="pm-empty">{t.noPasskeys}</p>
		{:else}
			<ul class="pm-list">
				{#each passkeys as passkey (passkey.id)}
					<li class="pm-item">
						{#if deletingId === passkey.id}
							<div class="pm-confirm-delete">
								<p class="pm-confirm-title">{t.confirmDeleteTitle}</p>
								<p class="pm-confirm-message">{t.confirmDeleteMessage}</p>
								<div class="pm-confirm-actions">
									<button
										type="button"
										class="pm-btn pm-btn-cancel"
										onclick={cancelDelete}
										disabled={loading}
										aria-disabled={loading}
									>
										{t.cancelButton}
									</button>
									<button
										type="button"
										class="pm-btn pm-btn-danger"
										onclick={executeDelete}
										disabled={loading}
										aria-disabled={loading}
									>
										{#if loading}
											<svg
												class="pm-spinner"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
											>
												<circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
												<path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
											</svg>
										{/if}
										{t.deleteButton}
									</button>
								</div>
							</div>
						{:else if editingId === passkey.id}
							<div class="pm-rename-form">
								<div class="pm-rename-input-row">
									<input
										type="text"
										class="pm-input"
										bind:value={editName}
										placeholder={t.renamePlaceholder}
										onkeydown={(e) => {
											if (e.key === 'Enter') saveRename(passkey.id);
											if (e.key === 'Escape') cancelRename();
										}}
									/>
								</div>
								<div class="pm-rename-actions">
									<button
										type="button"
										class="pm-btn pm-btn-cancel"
										onclick={cancelRename}
										disabled={loading}
										aria-disabled={loading}
									>
										{t.cancelButton}
									</button>
									<button
										type="button"
										class="pm-btn pm-btn-primary"
										onclick={() => saveRename(passkey.id)}
										disabled={loading || !editName.trim()}
										aria-disabled={loading || !editName.trim()}
									>
										{t.saveButton}
									</button>
								</div>
							</div>
						{:else}
							<div class="pm-item-header">
								<span class="pm-item-icon">{getDeviceIcon(passkey.deviceType)}</span>
								<div class="pm-item-info">
									<span class="pm-item-name">{getDisplayName(passkey)}</span>
									<span class="pm-item-meta">
										{t.created}: {formatDate(passkey.createdAt)}
									</span>
									<span class="pm-item-meta">
										{t.lastUsed}: {formatRelativeTime(passkey.lastUsedAt)}
									</span>
									{#if passkey.backedUp}
										<span class="pm-item-badge pm-badge-synced">{t.backedUp}</span>
									{:else}
										<span class="pm-item-badge pm-badge-local">{t.notBackedUp}</span>
									{/if}
								</div>
							</div>
							<div class="pm-item-actions">
								<button
									type="button"
									class="pm-btn pm-btn-ghost"
									onclick={() => startRename(passkey)}
								>
									{t.renameButton}
								</button>
								<button
									type="button"
									class="pm-btn pm-btn-ghost pm-btn-ghost-danger"
									onclick={() => confirmDelete(passkey.id)}
								>
									{t.deleteButton}
								</button>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}

		{#if showRegisterForm}
			<div class="pm-register-form">
				<p class="pm-register-title">{t.registerTitle}</p>
				<label class="pm-register-label" for="passkey-name">
					{t.registerNameLabel}
				</label>
				<input
					id="passkey-name"
					type="text"
					class="pm-input"
					bind:value={registerName}
					placeholder={t.registerNamePlaceholder}
					onkeydown={(e) => {
						if (e.key === 'Enter') handleRegister();
						if (e.key === 'Escape') cancelRegister();
					}}
				/>
				<div class="pm-register-actions">
					<button
						type="button"
						class="pm-btn pm-btn-cancel"
						onclick={cancelRegister}
						disabled={loading}
						aria-disabled={loading}
					>
						{t.cancelButton}
					</button>
					<button
						type="button"
						class="pm-btn pm-btn-primary"
						onclick={handleRegister}
						disabled={loading}
						aria-disabled={loading}
					>
						{#if loading}
							<svg
								class="pm-spinner"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
								<path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
							</svg>
						{/if}
						{t.registerButton}
					</button>
				</div>
			</div>
		{:else}
			<button
				type="button"
				class="pm-btn pm-btn-register"
				onclick={openRegisterForm}
				disabled={loading}
				aria-disabled={loading}
			>
				<svg
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<line x1="12" y1="5" x2="12" y2="19" />
					<line x1="5" y1="12" x2="19" y2="12" />
				</svg>
				{t.registerButton}
			</button>
		{/if}
	{/if}
</div>

<style>
	.passkey-manager {
		width: 100%;
		max-width: 480px;
	}

	.pm-title {
		font-size: 1.125rem;
		font-weight: 600;
		margin: 0 0 1rem;
		color: hsl(var(--theme-foreground, 220 9% 10%));
	}

	/* Warning — semantic amber colors kept */
	.pm-warning {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: #fef3c7;
		border: 1px solid #f59e0b;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
	}

	:global(.dark) .pm-warning {
		background: #78350f;
		border-color: #b45309;
	}

	.pm-warning-icon {
		flex-shrink: 0;
		font-size: 1rem;
		line-height: 1.5;
	}

	.pm-warning p {
		margin: 0;
		font-size: 0.875rem;
		line-height: 1.5;
		color: #92400e;
	}

	:global(.dark) .pm-warning p {
		color: #fef3c7;
	}

	/* Error — semantic red colors kept */
	.pm-error {
		padding: 0.625rem 0.875rem;
		background: #fef2f2;
		border: 1px solid #fca5a5;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
	}

	:global(.dark) .pm-error {
		background: #450a0a;
		border-color: #991b1b;
	}

	.pm-error p {
		margin: 0;
		font-size: 0.8125rem;
		color: #dc2626;
	}

	:global(.dark) .pm-error p {
		color: #fca5a5;
	}

	/* Empty state */
	.pm-empty {
		font-size: 0.875rem;
		color: hsl(var(--theme-muted-foreground, 220 9% 46%));
		margin: 0 0 1rem;
	}

	/* Passkey list */
	.pm-list {
		list-style: none;
		padding: 0;
		margin: 0 0 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.pm-item {
		padding: 0.875rem 1rem;
		background: hsl(var(--theme-muted, 220 14% 96%));
		border: 1px solid hsl(var(--theme-border, 220 13% 91%));
		border-radius: 0.625rem;
		transition: border-color 150ms ease;
	}

	.pm-item:hover {
		border-color: hsl(var(--theme-foreground, 220 9% 10%) / 0.2);
	}

	/* Item header */
	.pm-item-header {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
	}

	.pm-item-icon {
		font-size: 1.25rem;
		line-height: 1;
		flex-shrink: 0;
		margin-top: 0.125rem;
	}

	.pm-item-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.pm-item-name {
		font-size: 0.9375rem;
		font-weight: 500;
		color: hsl(var(--theme-foreground, 220 9% 10%));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.pm-item-meta {
		font-size: 0.75rem;
		color: hsl(var(--theme-muted-foreground, 220 9% 46%));
	}

	/* Badges — semantic green/amber colors kept */
	.pm-item-badge {
		display: inline-block;
		font-size: 0.6875rem;
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
		margin-top: 0.25rem;
		width: fit-content;
	}

	.pm-badge-synced {
		background: #dcfce7;
		color: #166534;
	}

	:global(.dark) .pm-badge-synced {
		background: #052e16;
		color: #86efac;
	}

	.pm-badge-local {
		background: #fef3c7;
		color: #92400e;
	}

	:global(.dark) .pm-badge-local {
		background: #451a03;
		color: #fcd34d;
	}

	/* Item actions */
	.pm-item-actions {
		display: flex;
		gap: 0.375rem;
		margin-top: 0.625rem;
		padding-top: 0.625rem;
		border-top: 1px solid hsl(var(--theme-border, 220 13% 91%));
	}

	/* Buttons */
	.pm-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		padding: 0.4375rem 0.875rem;
		font-size: 0.8125rem;
		font-weight: 500;
		border-radius: 0.5rem;
		border: 1px solid transparent;
		cursor: pointer;
		transition: all 150ms ease;
		line-height: 1.25;
	}

	.pm-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.pm-btn-primary {
		background: var(--primary-color);
		color: white;
		border-color: var(--primary-color);
	}

	.pm-btn-primary:hover:not(:disabled) {
		filter: brightness(0.9);
	}

	.pm-btn-cancel {
		background: transparent;
		color: hsl(var(--theme-muted-foreground, 220 9% 46%));
		border-color: hsl(var(--theme-border, 220 13% 91%));
	}

	.pm-btn-cancel:hover:not(:disabled) {
		background: hsl(var(--theme-muted, 220 14% 96%));
	}

	/* Danger button — semantic red kept */
	.pm-btn-danger {
		background: #dc2626;
		color: white;
		border-color: #dc2626;
	}

	.pm-btn-danger:hover:not(:disabled) {
		background: #b91c1c;
	}

	.pm-btn-ghost {
		background: transparent;
		color: hsl(var(--theme-muted-foreground, 220 9% 46%));
		padding: 0.3125rem 0.625rem;
		font-size: 0.75rem;
	}

	.pm-btn-ghost:hover:not(:disabled) {
		background: hsl(var(--theme-muted, 220 14% 96%));
		color: hsl(var(--theme-foreground, 220 9% 10%));
	}

	/* Danger ghost — semantic red kept */
	.pm-btn-ghost-danger:hover:not(:disabled) {
		background: #fef2f2;
		color: #dc2626;
	}

	:global(.dark) .pm-btn-ghost-danger:hover:not(:disabled) {
		background: #450a0a;
		color: #fca5a5;
	}

	.pm-btn-register {
		width: 100%;
		padding: 0.625rem 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		background: transparent;
		color: var(--primary-color);
		border: 1px dashed var(--primary-color);
		border-radius: 0.625rem;
	}

	.pm-btn-register:hover:not(:disabled) {
		background: color-mix(in srgb, var(--primary-color) 8%, transparent);
	}

	/* Input */
	.pm-input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
		border: 1px solid hsl(var(--theme-border, 220 13% 91%));
		border-radius: 0.5rem;
		background: hsl(var(--theme-background, 0 0% 100%));
		color: hsl(var(--theme-foreground, 220 9% 10%));
		outline: none;
		transition: border-color 150ms ease;
		box-sizing: border-box;
	}

	.pm-input:focus {
		border-color: var(--primary-color);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-color) 20%, transparent);
	}

	/* Rename form */
	.pm-rename-form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.pm-rename-input-row {
		display: flex;
		gap: 0.5rem;
	}

	.pm-rename-actions {
		display: flex;
		gap: 0.375rem;
		justify-content: flex-end;
	}

	/* Confirm delete */
	.pm-confirm-delete {
		text-align: center;
	}

	.pm-confirm-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: #dc2626;
		margin: 0 0 0.25rem;
	}

	.pm-confirm-message {
		font-size: 0.8125rem;
		color: hsl(var(--theme-muted-foreground, 220 9% 46%));
		margin: 0 0 0.75rem;
		line-height: 1.4;
	}

	.pm-confirm-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
	}

	/* Register form */
	.pm-register-form {
		padding: 1rem;
		background: hsl(var(--theme-muted, 220 14% 96%));
		border: 1px solid hsl(var(--theme-border, 220 13% 91%));
		border-radius: 0.625rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.pm-register-title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: hsl(var(--theme-foreground, 220 9% 10%));
		margin: 0;
	}

	.pm-register-label {
		font-size: 0.8125rem;
		color: hsl(var(--theme-muted-foreground, 220 9% 46%));
	}

	.pm-register-actions {
		display: flex;
		gap: 0.375rem;
		justify-content: flex-end;
		margin-top: 0.25rem;
	}

	/* Spinner */
	.pm-spinner {
		width: 16px;
		height: 16px;
		animation: pm-spin 0.75s linear infinite;
		flex-shrink: 0;
	}

	@keyframes pm-spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.pm-spinner {
			animation: none;
		}
		* {
			transition-duration: 0.01ms !important;
		}
	}
</style>
