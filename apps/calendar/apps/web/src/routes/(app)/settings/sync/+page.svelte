<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { authStore } from '$lib/stores/auth.svelte';
	import { externalCalendarsStore } from '$lib/stores/external-calendars.svelte';
	import {
		CaretLeft,
		Plus,
		ArrowsClockwise,
		Trash,
		Globe,
		GoogleLogo,
		Link,
		CloudArrowDown,
		CloudArrowUp,
		CheckCircle,
		Warning,
		X,
	} from '@manacore/shared-icons';
	import { Modal, Input } from '@manacore/shared-ui';
	import { PROVIDER_INFO, type CalendarProvider, type SyncDirection } from '@calendar/shared';
	import { formatDistanceToNow } from 'date-fns';
	import { de } from 'date-fns/locale';

	// Connect form state
	let showConnectForm = $state(false);
	let connectStep = $state<'provider' | 'credentials' | 'caldav-discover'>('provider');
	let selectedProvider = $state<CalendarProvider | null>(null);
	let connectName = $state('');
	let connectUrl = $state('');
	let connectUsername = $state('');
	let connectPassword = $state('');
	let connectDirection = $state<SyncDirection>('import');
	let isConnecting = $state(false);

	// CalDAV discovery
	let discoveredCalendars = $state<Array<{ url: string; name: string; color?: string }>>([]);
	let isDiscovering = $state(false);

	// Provider selection
	const providers: { id: CalendarProvider; labelKey: string; descriptionKey: string }[] = [
		{
			id: 'ical_url',
			labelKey: 'sync.providers.icalUrl',
			descriptionKey: 'sync.providers.icalUrlDesc',
		},
		{
			id: 'caldav',
			labelKey: 'sync.providers.caldav',
			descriptionKey: 'sync.providers.caldavDesc',
		},
		{
			id: 'google',
			labelKey: 'sync.providers.google',
			descriptionKey: 'sync.providers.googleDesc',
		},
		{ id: 'apple', labelKey: 'sync.providers.apple', descriptionKey: 'sync.providers.appleDesc' },
	];

	function selectProvider(provider: CalendarProvider) {
		selectedProvider = provider;

		if (provider === 'google') {
			handleGoogleConnect();
			return;
		}

		if (provider === 'caldav') {
			connectStep = 'caldav-discover';
			return;
		}

		connectStep = 'credentials';
	}

	async function handleGoogleConnect() {
		const result = await externalCalendarsStore.getGoogleAuthUrl();
		if (result.data) {
			window.location.href = result.data;
		}
	}

	async function handleCalDavDiscover() {
		if (!connectUrl.trim() || !connectUsername.trim() || !connectPassword.trim()) return;

		isDiscovering = true;
		const result = await externalCalendarsStore.discoverCalDav(
			connectUrl.trim(),
			connectUsername.trim(),
			connectPassword.trim()
		);

		if (result.data) {
			discoveredCalendars = result.data;
		}
		isDiscovering = false;
	}

	async function connectCalDavCalendar(cal: { url: string; name: string; color?: string }) {
		isConnecting = true;
		await externalCalendarsStore.connect({
			name: cal.name,
			provider: 'caldav',
			calendarUrl: cal.url,
			username: connectUsername.trim(),
			password: connectPassword.trim(),
			syncDirection: connectDirection,
			color: cal.color,
		});
		isConnecting = false;
		closeConnectForm();
	}

	async function handleConnect() {
		if (!connectName.trim() || !connectUrl.trim()) return;
		if (!selectedProvider) return;

		isConnecting = true;

		await externalCalendarsStore.connect({
			name: connectName.trim(),
			provider: selectedProvider,
			calendarUrl: connectUrl.trim(),
			username: connectUsername.trim() || undefined,
			password: connectPassword.trim() || undefined,
			syncDirection: connectDirection,
		});

		isConnecting = false;
		closeConnectForm();
	}

	function closeConnectForm() {
		showConnectForm = false;
		connectStep = 'provider';
		selectedProvider = null;
		connectName = '';
		connectUrl = '';
		connectUsername = '';
		connectPassword = '';
		connectDirection = 'import';
		discoveredCalendars = [];
	}

	async function handleDisconnect(id: string, name: string) {
		if (!confirm($_('sync.confirmDisconnect', { values: { name } }))) return;
		await externalCalendarsStore.disconnect(id);
	}

	async function handleSync(id: string) {
		await externalCalendarsStore.triggerSync(id);
	}

	async function handleToggleSync(id: string, currentEnabled: boolean) {
		await externalCalendarsStore.update(id, { syncEnabled: !currentEnabled });
	}

	function formatSyncTime(date: Date | string | null | undefined): string {
		if (!date) return $_('sync.neverSynced');
		return formatDistanceToNow(new Date(date), { addSuffix: true, locale: de });
	}

	function getSyncDirectionLabel(direction: SyncDirection): string {
		switch (direction) {
			case 'import':
				return $_('sync.direction.import');
			case 'export':
				return $_('sync.direction.export');
			case 'both':
				return $_('sync.direction.both');
		}
	}

	onMount(async () => {
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}
		await externalCalendarsStore.fetchCalendars();
	});
</script>

<svelte:head>
	<title>{$_('sync.pageTitle')}</title>
</svelte:head>

<div class="page-container">
	<header class="header">
		<a href="/settings" class="back-button" aria-label={$_('sync.back')}>
			<CaretLeft size={20} weight="bold" />
		</a>
		<h1 class="title">{$_('sync.title')}</h1>
		<button
			onclick={() => (showConnectForm = true)}
			class="add-button"
			aria-label={$_('sync.connectCalendar')}
		>
			<Plus size={20} weight="bold" />
		</button>
	</header>

	<p class="description">
		{$_('sync.description')}
	</p>

	{#if externalCalendarsStore.error}
		<div class="error-banner" role="alert">
			<Warning size={16} />
			<span>{externalCalendarsStore.error}</span>
		</div>
	{/if}

	{#if externalCalendarsStore.loading}
		<div class="loading">
			<div class="spinner"></div>
		</div>
	{:else if externalCalendarsStore.calendars.length === 0}
		<div class="empty-state">
			<Globe size={48} class="text-muted-foreground" />
			<p>{$_('sync.emptyState')}</p>
			<button class="btn btn-primary" onclick={() => (showConnectForm = true)}>
				<Plus size={16} weight="bold" />
				{$_('sync.connectCalendar')}
			</button>
		</div>
	{:else}
		<div class="calendar-list">
			{#each externalCalendarsStore.calendars as cal (cal.id)}
				<div class="calendar-card">
					<div class="calendar-header">
						<div class="calendar-info">
							<div class="calendar-color" style="background-color: {cal.color}"></div>
							<div>
								<h3 class="calendar-name">{cal.name}</h3>
								<span class="calendar-provider"
									>{PROVIDER_INFO[cal.provider]?.label || cal.provider}</span
								>
							</div>
						</div>
						<div class="calendar-actions">
							<button
								class="icon-btn"
								onclick={() => handleSync(cal.id)}
								disabled={externalCalendarsStore.isSyncing(cal.id)}
								title={$_('sync.syncNow')}
							>
								<ArrowsClockwise
									size={16}
									class={externalCalendarsStore.isSyncing(cal.id) ? 'animate-spin' : ''}
								/>
							</button>
							<button
								class="icon-btn icon-btn-danger"
								onclick={() => handleDisconnect(cal.id, cal.name)}
								title={$_('sync.disconnect')}
							>
								<Trash size={16} />
							</button>
						</div>
					</div>

					<div class="calendar-details">
						<div class="detail-row">
							<span class="detail-label">{$_('sync.directionLabel')}</span>
							<span class="detail-value">
								{#if cal.syncDirection === 'import'}
									<CloudArrowDown size={14} />
								{:else if cal.syncDirection === 'export'}
									<CloudArrowUp size={14} />
								{:else}
									<ArrowsClockwise size={14} />
								{/if}
								{getSyncDirectionLabel(cal.syncDirection)}
							</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">{$_('sync.lastSync')}</span>
							<span class="detail-value">
								{formatSyncTime(cal.lastSyncAt)}
							</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">{$_('sync.statusLabel')}</span>
							<span class="detail-value">
								{#if cal.lastSyncError}
									<span class="status-error">
										<Warning size={14} />
										{$_('sync.status.error')}
									</span>
								{:else if cal.syncEnabled}
									<span class="status-ok">
										<CheckCircle size={14} />
										{$_('sync.status.active', { values: { interval: cal.syncInterval } })}
									</span>
								{:else}
									<span class="status-paused">{$_('sync.status.paused')}</span>
								{/if}
							</span>
						</div>
						{#if cal.lastSyncError}
							<div class="sync-error">
								{cal.lastSyncError}
							</div>
						{/if}
					</div>

					<div class="calendar-footer">
						<label class="toggle-label">
							<input
								type="checkbox"
								checked={cal.syncEnabled}
								onchange={() => handleToggleSync(cal.id, cal.syncEnabled)}
								class="toggle"
							/>
							<span>{$_('sync.autoSync')}</span>
						</label>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Connect Modal -->
<Modal
	visible={showConnectForm}
	onClose={closeConnectForm}
	title={connectStep === 'provider'
		? $_('sync.connectCalendar')
		: connectStep === 'caldav-discover'
			? $_('sync.connectCaldav')
			: $_('sync.connectProvider', {
					values: { provider: PROVIDER_INFO[selectedProvider!]?.label || '' },
				})}
	maxWidth="md"
>
	{#if connectStep === 'provider'}
		<div class="provider-list">
			{#each providers as provider}
				<button class="provider-item" onclick={() => selectProvider(provider.id)}>
					<div class="provider-icon">
						{#if provider.id === 'google'}
							<GoogleLogo size={24} />
						{:else if provider.id === 'ical_url'}
							<Link size={24} />
						{:else}
							<Globe size={24} />
						{/if}
					</div>
					<div>
						<span class="provider-name">{$_(provider.labelKey)}</span>
						<span class="provider-desc">{$_(provider.descriptionKey)}</span>
					</div>
				</button>
			{/each}
		</div>
	{:else if connectStep === 'caldav-discover'}
		<div class="connect-form">
			<div class="form-field">
				<label for="caldav-url">{$_('sync.form.serverUrl')}</label>
				<Input bind:value={connectUrl} placeholder="https://caldav.example.com" />
			</div>
			<div class="form-field">
				<label for="caldav-user">{$_('sync.form.username')}</label>
				<Input bind:value={connectUsername} placeholder="user@example.com" />
			</div>
			<div class="form-field">
				<label for="caldav-pass">{$_('sync.form.password')}</label>
				<input
					type="password"
					bind:value={connectPassword}
					placeholder={$_('sync.form.password')}
					class="password-input"
				/>
			</div>

			{#if discoveredCalendars.length > 0}
				<div class="discovered-list">
					<h4>{$_('sync.discoveredCalendars')}</h4>
					{#each discoveredCalendars as cal}
						<button
							class="discovered-item"
							onclick={() => connectCalDavCalendar(cal)}
							disabled={isConnecting}
						>
							<div class="calendar-color" style="background-color: {cal.color || '#6b7280'}"></div>
							<span>{cal.name}</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>

		{#snippet footer()}
			<div class="modal-footer">
				<button class="btn btn-secondary" onclick={() => (connectStep = 'provider')}>
					{$_('sync.back')}
				</button>
				<button
					class="btn btn-primary"
					onclick={handleCalDavDiscover}
					disabled={isDiscovering || !connectUrl.trim() || !connectUsername.trim()}
				>
					{isDiscovering ? $_('sync.searching') : $_('sync.searchCalendars')}
				</button>
			</div>
		{/snippet}
	{:else if connectStep === 'credentials'}
		<div class="connect-form">
			<div class="form-field">
				<label>{$_('sync.form.name')}</label>
				<Input bind:value={connectName} placeholder={$_('sync.form.namePlaceholder')} />
			</div>
			<div class="form-field">
				<label>{$_('sync.form.url')}</label>
				<Input
					bind:value={connectUrl}
					placeholder={selectedProvider === 'ical_url'
						? 'https://example.com/calendar.ics'
						: 'https://caldav.example.com/calendar'}
				/>
			</div>
			{#if selectedProvider !== 'ical_url'}
				<div class="form-field">
					<label>{$_('sync.form.username')}</label>
					<Input bind:value={connectUsername} placeholder="user@example.com" />
				</div>
				<div class="form-field">
					<label>{$_('sync.form.password')}</label>
					<input
						type="password"
						bind:value={connectPassword}
						placeholder={$_('sync.form.password')}
						class="password-input"
					/>
				</div>
			{/if}
			<div class="form-field">
				<label>{$_('sync.form.syncDirection')}</label>
				<select bind:value={connectDirection} class="select-input">
					<option value="import">{$_('sync.direction.import')}</option>
					{#if selectedProvider !== 'ical_url'}
						<option value="export">{$_('sync.direction.export')}</option>
						<option value="both">{$_('sync.direction.both')}</option>
					{/if}
				</select>
			</div>
		</div>

		{#snippet footer()}
			<div class="modal-footer">
				<button class="btn btn-secondary" onclick={() => (connectStep = 'provider')}>
					{$_('sync.back')}
				</button>
				<button
					class="btn btn-primary"
					onclick={handleConnect}
					disabled={isConnecting || !connectName.trim() || !connectUrl.trim()}
				>
					{isConnecting ? $_('sync.connecting') : $_('sync.connect')}
				</button>
			</div>
		{/snippet}
	{/if}
</Modal>

<style>
	.page-container {
		max-width: 640px;
		margin: 0 auto;
		padding: 0 1rem 2rem;
	}

	.header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 0;
		margin-bottom: 0.5rem;
	}

	.back-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		background: hsl(var(--muted));
		color: hsl(var(--foreground));
		transition: all 0.2s ease;
	}

	.back-button:hover {
		background: hsl(var(--muted-foreground) / 0.2);
	}

	.title {
		flex: 1;
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--foreground));
	}

	.add-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.add-button:hover {
		transform: scale(1.05);
	}

	.description {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		margin-bottom: 1.5rem;
	}

	.error-banner {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: hsl(0 84% 60% / 0.1);
		border: 1px solid hsl(0 84% 60% / 0.3);
		border-radius: 0.75rem;
		color: hsl(0 84% 60%);
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}

	.loading {
		display: flex;
		justify-content: center;
		padding: 3rem;
	}

	.spinner {
		width: 2rem;
		height: 2rem;
		border: 2px solid hsl(var(--border));
		border-top-color: hsl(var(--primary));
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 3rem 1rem;
		text-align: center;
		color: hsl(var(--muted-foreground));
	}

	.calendar-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.calendar-card {
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
		background: hsl(var(--card));
		overflow: hidden;
	}

	.calendar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.875rem 1rem;
	}

	.calendar-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.calendar-color {
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.calendar-name {
		font-weight: 600;
		font-size: 0.9375rem;
		color: hsl(var(--foreground));
	}

	.calendar-provider {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}

	.calendar-actions {
		display: flex;
		gap: 0.25rem;
	}

	.calendar-details {
		padding: 0 1rem;
		border-top: 1px solid hsl(var(--border));
	}

	.detail-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0;
		font-size: 0.8125rem;
	}

	.detail-row + .detail-row {
		border-top: 1px solid hsl(var(--border) / 0.5);
	}

	.detail-label {
		color: hsl(var(--muted-foreground));
	}

	.detail-value {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		color: hsl(var(--foreground));
	}

	.status-ok {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		color: hsl(142 71% 45%);
	}

	.status-error {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		color: hsl(0 84% 60%);
	}

	.status-paused {
		color: hsl(var(--muted-foreground));
	}

	.sync-error {
		padding: 0.5rem 0;
		font-size: 0.75rem;
		color: hsl(0 84% 60%);
		border-top: 1px solid hsl(var(--border) / 0.5);
	}

	.calendar-footer {
		padding: 0.75rem 1rem;
		border-top: 1px solid hsl(var(--border));
	}

	.toggle-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8125rem;
		color: hsl(var(--foreground));
		cursor: pointer;
	}

	.toggle {
		width: 1rem;
		height: 1rem;
		accent-color: hsl(var(--primary));
	}

	/* Icon buttons */
	.icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 0.5rem;
		background: transparent;
		border: none;
		cursor: pointer;
		color: hsl(var(--muted-foreground));
		transition: all 0.15s ease;
	}

	.icon-btn:hover {
		background: hsl(var(--muted));
		color: hsl(var(--foreground));
	}

	.icon-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.icon-btn-danger:hover {
		color: hsl(0 84% 60%);
		background: hsl(0 84% 60% / 0.1);
	}

	/* Provider list */
	.provider-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.provider-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
		background: hsl(var(--background));
		cursor: pointer;
		text-align: left;
		transition: all 0.15s ease;
	}

	.provider-item:hover {
		border-color: hsl(var(--primary));
		background: hsl(var(--primary) / 0.05);
	}

	.provider-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 0.5rem;
		background: hsl(var(--muted));
		color: hsl(var(--foreground));
		flex-shrink: 0;
	}

	.provider-name {
		display: block;
		font-weight: 600;
		font-size: 0.9375rem;
		color: hsl(var(--foreground));
	}

	.provider-desc {
		display: block;
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
	}

	/* Connect form */
	.connect-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.form-field label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--foreground));
	}

	.password-input,
	.select-input {
		width: 100%;
		padding: 0.625rem 0.875rem;
		border: 1.5px solid hsl(var(--border));
		border-radius: 0.5rem;
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		font-size: 0.875rem;
	}

	.password-input:focus,
	.select-input:focus {
		outline: none;
		border-color: hsl(var(--primary));
		box-shadow: 0 0 0 3px hsl(var(--primary) / 0.1);
	}

	/* Discovered calendars */
	.discovered-list {
		margin-top: 0.5rem;
	}

	.discovered-list h4 {
		font-size: 0.8125rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin-bottom: 0.5rem;
	}

	.discovered-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.75rem;
		border: 1px solid hsl(var(--border));
		border-radius: 0.5rem;
		background: hsl(var(--background));
		cursor: pointer;
		text-align: left;
		font-size: 0.875rem;
		color: hsl(var(--foreground));
		transition: all 0.15s ease;
	}

	.discovered-item:hover:not(:disabled) {
		border-color: hsl(var(--primary));
		background: hsl(var(--primary) / 0.05);
	}

	.discovered-item:disabled {
		opacity: 0.5;
		cursor: wait;
	}

	.discovered-item + .discovered-item {
		margin-top: 0.375rem;
	}

	/* Modal footer */
	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
	}

	/* Buttons */
	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
		transition: all 0.15s ease;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-primary {
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
	}

	.btn-primary:hover:not(:disabled) {
		opacity: 0.9;
	}

	.btn-secondary {
		background: hsl(var(--muted));
		color: hsl(var(--foreground));
	}

	.btn-secondary:hover:not(:disabled) {
		background: hsl(var(--muted-foreground) / 0.2);
	}
</style>
