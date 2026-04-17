<!--
  Mail — ListView (Inbox)
  Thread list with mailbox sidebar, search, and compose.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { mailStore } from './stores/mail.svelte';
	import { formatSender, formatDate } from './queries';
	import { SYSTEM_MAILBOXES } from './types';
	import type { ThreadSummary, MailboxInfo } from './types';
	import { ContextMenu, type ContextMenuItem } from '@mana/shared-ui';
	import { useItemContextMenu } from '$lib/data/item-context-menu.svelte';
	import { Trash, Star, EnvelopeOpen, Archive } from '@mana/shared-icons';

	let showCompose = $state(false);
	let selectedThreadId = $state<string | null>(null);

	// Compose form
	let composeTo = $state('');
	let composeSubject = $state('');
	let composeBody = $state('');
	let sending = $state(false);

	onMount(async () => {
		await Promise.all([mailStore.loadMailboxes(), mailStore.loadThreads()]);
	});

	let inboxMailbox = $derived(mailStore.mailboxes.find((mb) => mb.role === 'inbox'));

	function getMailboxLabel(mb: MailboxInfo): string {
		const sys = SYSTEM_MAILBOXES[mb.role ?? ''];
		return sys?.label ?? mb.name;
	}

	async function selectMailbox(mailboxId: string) {
		selectedThreadId = null;
		await mailStore.loadThreads({ mailboxId });
	}

	async function selectThread(thread: ThreadSummary) {
		selectedThreadId = thread.id;
		await mailStore.loadThread(thread.id);
		if (!thread.isRead && mailStore.activeThread?.messages[0]) {
			await mailStore.markRead(mailStore.activeThread.messages[0].id);
		}
	}

	async function handleSend(e: Event) {
		e.preventDefault();
		if (!composeTo.trim() || !composeSubject.trim()) return;
		sending = true;
		try {
			await mailStore.sendEmail({
				to: [{ email: composeTo.trim() }],
				subject: composeSubject.trim(),
				body: composeBody,
			});
			composeTo = '';
			composeSubject = '';
			composeBody = '';
			showCompose = false;
			await mailStore.loadThreads({ mailboxId: mailStore.activeMailboxId ?? undefined });
		} catch (err) {
			console.error('[mail] Send failed:', err);
		} finally {
			sending = false;
		}
	}

	const ctxMenu = useItemContextMenu<ThreadSummary>();
	let ctxMenuItems = $derived<ContextMenuItem[]>(
		ctxMenu.state.target
			? [
					{
						id: 'read',
						label: ctxMenu.state.target.isRead ? 'Als ungelesen' : 'Als gelesen',
						icon: EnvelopeOpen,
						action: () => {},
					},
					{
						id: 'star',
						label: ctxMenu.state.target.isFlagged ? 'Stern entfernen' : 'Markieren',
						icon: Star,
						action: () => {},
					},
					{
						id: 'archive',
						label: 'Archivieren',
						icon: Archive,
						action: () => {},
					},
					{ id: 'div', label: '', type: 'divider' as const },
					{
						id: 'delete',
						label: 'Löschen',
						icon: Trash,
						variant: 'danger' as const,
						action: () => {},
					},
				]
			: []
	);
</script>

<div class="mail-view">
	<!-- Mailbox Sidebar -->
	<div class="mailbox-sidebar">
		<button class="compose-btn" onclick={() => (showCompose = true)}>Neue Mail</button>
		<div class="mailbox-list">
			{#each mailStore.mailboxes as mb (mb.id)}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div
					class="mailbox-item"
					class:active={mailStore.activeMailboxId === mb.id}
					onclick={() => selectMailbox(mb.id)}
				>
					<span class="mailbox-name">{getMailboxLabel(mb)}</span>
					{#if mb.unreadEmails > 0}
						<span class="unread-badge">{mb.unreadEmails}</span>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<!-- Thread List -->
	<div class="thread-list">
		{#if mailStore.loading && mailStore.threads.length === 0}
			<div class="loading">Lade Mails...</div>
		{:else if mailStore.error}
			<div class="error-state">
				<p>{mailStore.error}</p>
				<button class="retry-btn" onclick={() => mailStore.loadThreads()}>Erneut versuchen</button>
			</div>
		{:else if mailStore.threads.length === 0}
			<div class="empty">
				<p>Keine Mails</p>
				<p class="empty-hint">Dein Postfach ist leer.</p>
			</div>
		{:else}
			{#each mailStore.threads as thread (thread.id)}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div
					class="thread-row"
					class:unread={!thread.isRead}
					class:active={selectedThreadId === thread.id}
					onclick={() => selectThread(thread)}
					oncontextmenu={(e) => ctxMenu.open(e, thread)}
				>
					<div class="thread-from">
						{#if thread.isFlagged}<span class="star-icon"><Star size={10} weight="fill" /></span
							>{/if}
						<span class:font-bold={!thread.isRead}>{formatSender(thread.from)}</span>
					</div>
					<div class="thread-subject" class:font-bold={!thread.isRead}>{thread.subject}</div>
					<div class="thread-snippet">{thread.snippet}</div>
					<div class="thread-meta">
						<span class="thread-date">{formatDate(thread.lastMessageAt)}</span>
						{#if thread.messageCount > 1}
							<span class="thread-count">{thread.messageCount}</span>
						{/if}
					</div>
				</div>
			{/each}
		{/if}
	</div>

	<!-- Thread Detail / Compose -->
	<div class="detail-pane">
		{#if showCompose}
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<form
				class="compose-form"
				onsubmit={handleSend}
				onkeydown={(e) => e.key === 'Escape' && (showCompose = false)}
			>
				<div class="compose-header">Neue Nachricht</div>
				<!-- svelte-ignore a11y_autofocus -->
				<input
					class="compose-input"
					type="email"
					placeholder="An"
					bind:value={composeTo}
					autofocus
				/>
				<input
					class="compose-input"
					type="text"
					placeholder="Betreff"
					bind:value={composeSubject}
				/>
				<textarea
					class="compose-body"
					placeholder="Nachricht schreiben..."
					bind:value={composeBody}
					rows="8"
				></textarea>
				<div class="compose-actions">
					<button type="button" class="btn-cancel" onclick={() => (showCompose = false)}
						>Abbrechen</button
					>
					<button
						type="submit"
						class="btn-send"
						disabled={sending || !composeTo.trim() || !composeSubject.trim()}
					>
						{sending ? 'Wird gesendet...' : 'Senden'}
					</button>
				</div>
			</form>
		{:else if mailStore.activeThread}
			<div class="thread-detail">
				<h2 class="thread-detail-subject">{mailStore.activeThread.subject}</h2>
				{#each mailStore.activeThread.messages as msg (msg.id)}
					<div class="message-card">
						<div class="message-header">
							<span class="message-from"
								>{msg.from?.[0]?.name || msg.from?.[0]?.email || 'Unbekannt'}</span
							>
							<span class="message-date">{formatDate(msg.date)}</span>
						</div>
						{#if msg.to}
							<div class="message-to">An: {msg.to.map((t) => t.name || t.email).join(', ')}</div>
						{/if}
						<div class="message-body">
							{#if msg.bodyHtml}
								{@html msg.bodyHtml}
							{:else}
								<pre class="message-text">{msg.bodyText || msg.preview}</pre>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="empty-detail">
				<p>Wähle eine Nachricht aus</p>
			</div>
		{/if}
	</div>

	<ContextMenu
		visible={ctxMenu.state.visible}
		x={ctxMenu.state.x}
		y={ctxMenu.state.y}
		items={ctxMenuItems}
		onClose={ctxMenu.close}
	/>
</div>

<style>
	.mail-view {
		display: grid;
		grid-template-columns: 140px 260px 1fr;
		height: 100%;
		min-height: 400px;
		gap: 1px;
		background: hsl(var(--color-border));
	}

	/* ── Mailbox Sidebar ─────────────────────────── */
	.mailbox-sidebar {
		background: hsl(var(--color-background));
		display: flex;
		flex-direction: column;
		padding: 0.5rem;
		gap: 0.5rem;
		overflow-y: auto;
	}
	.compose-btn {
		padding: 0.5rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-primary));
		color: white;
		border: none;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
	}
	.compose-btn:hover {
		filter: brightness(1.1);
	}

	.mailbox-list {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}
	.mailbox-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		cursor: pointer;
		color: hsl(var(--color-foreground));
		transition: background 0.15s;
	}
	.mailbox-item:hover {
		background: hsl(var(--color-muted));
	}
	.mailbox-item.active {
		background: hsl(var(--color-primary) / 0.12);
		color: hsl(var(--color-primary));
		font-weight: 600;
	}
	.mailbox-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.unread-badge {
		font-size: 0.625rem;
		font-weight: 700;
		background: hsl(var(--color-primary));
		color: white;
		padding: 0 0.375rem;
		border-radius: 1rem;
		min-width: 1.25rem;
		text-align: center;
	}

	/* ── Thread List ─────────────────────────────── */
	.thread-list {
		background: hsl(var(--color-background));
		overflow-y: auto;
	}
	.thread-row {
		display: flex;
		flex-direction: column;
		gap: 0.0625rem;
		padding: 0.5rem 0.625rem;
		border-bottom: 1px solid hsl(var(--color-border));
		cursor: pointer;
		transition: background 0.15s;
		color: hsl(var(--color-muted-foreground));
		user-select: none;
		-webkit-user-select: none;
		-webkit-touch-callout: none;
	}
	.thread-row:hover {
		background: hsl(var(--color-muted));
	}
	.thread-row.active {
		background: hsl(var(--color-primary) / 0.08);
	}
	.thread-row.unread {
		color: hsl(var(--color-foreground));
	}

	.thread-from {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
	}
	.star-icon {
		color: #f59e0b;
		flex-shrink: 0;
	}
	.font-bold {
		font-weight: 600;
	}

	.thread-subject {
		font-size: 0.75rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.thread-snippet {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.thread-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 0.125rem;
	}
	.thread-date {
		font-size: 0.625rem;
		color: hsl(var(--color-muted-foreground));
		font-variant-numeric: tabular-nums;
	}
	.thread-count {
		font-size: 0.5625rem;
		font-weight: 600;
		background: hsl(var(--color-border));
		padding: 0 0.25rem;
		border-radius: 0.25rem;
		color: hsl(var(--color-muted-foreground));
	}

	/* ── Detail Pane ─────────────────────────────── */
	.detail-pane {
		background: hsl(var(--color-background));
		overflow-y: auto;
		padding: 0.75rem;
	}
	.empty-detail,
	.empty,
	.loading,
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		min-height: 200px;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.8125rem;
		gap: 0.5rem;
	}
	.empty-hint {
		font-size: 0.6875rem;
	}

	.retry-btn {
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		background: hsl(var(--color-primary));
		color: white;
		border: none;
		font-size: 0.75rem;
		cursor: pointer;
	}

	/* ── Thread Detail ───────────────────────────── */
	.thread-detail-subject {
		font-size: 1rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
		margin: 0 0 0.75rem;
	}
	.message-card {
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		padding: 0.75rem;
		margin-bottom: 0.5rem;
		background: hsl(var(--color-muted));
	}
	.message-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.25rem;
	}
	.message-from {
		font-size: 0.8125rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}
	.message-date {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}
	.message-to {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		margin-bottom: 0.5rem;
	}
	.message-body {
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
		line-height: 1.5;
	}
	.message-text {
		white-space: pre-wrap;
		font-family: inherit;
		margin: 0;
	}

	/* ── Compose ─────────────────────────────────── */
	.compose-form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.compose-header {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin-bottom: 0.25rem;
	}
	.compose-input {
		padding: 0.5rem 0.625rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		outline: none;
	}
	.compose-input:focus {
		border-color: hsl(var(--color-primary));
	}
	.compose-input::placeholder {
		color: hsl(var(--color-muted-foreground));
	}
	.compose-body {
		padding: 0.5rem 0.625rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		font-family: inherit;
		outline: none;
		resize: vertical;
	}
	.compose-body:focus {
		border-color: hsl(var(--color-primary));
	}
	.compose-body::placeholder {
		color: hsl(var(--color-muted-foreground));
	}

	.compose-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.375rem;
	}
	.btn-cancel,
	.btn-send {
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
	}
	.btn-cancel {
		background: transparent;
		color: hsl(var(--color-muted-foreground));
	}
	.btn-cancel:hover {
		background: hsl(var(--color-muted));
	}
	.btn-send {
		background: hsl(var(--color-primary));
		color: white;
	}
	.btn-send:hover:not(:disabled) {
		filter: brightness(1.1);
	}
	.btn-send:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* ── Responsive ──────────────────────────────── */
	@media (max-width: 640px) {
		.mail-view {
			grid-template-columns: 1fr;
			grid-template-rows: auto 1fr;
		}
		.mailbox-sidebar {
			flex-direction: row;
			overflow-x: auto;
			padding: 0.375rem;
		}
		.mailbox-list {
			flex-direction: row;
		}
		.compose-btn {
			white-space: nowrap;
		}
		.detail-pane {
			display: none;
		}
	}
</style>
