<!--
  MyWishesView — Persönliche Roadmap.
  Zeigt:
    - eigene Posts mit Status-Badge + Live-Reactions-Count
    - Items, auf die man reagiert hat (mit deren Status)
    - Notification-Inbox (zuletzt empfangene Status-Änderungen)
  Schließt den Loop: User sieht seinen Beitrag durchs System wandern.
-->
<script lang="ts">
	import {
		FEEDBACK_STATUS_CONFIG,
		type Feedback,
		type FeedbackNotification,
		type FeedbackStatus,
		type PublicFeedbackItem,
	} from '@mana/feedback';
	import { feedbackService } from '$lib/api/feedback';
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import ItemCard from '../components/ItemCard.svelte';

	type Tab = 'mine' | 'reacted' | 'inbox';

	let active = $state<Tab>('mine');

	let myItems = $state<Feedback[]>([]);
	let reactedItems = $state<PublicFeedbackItem[]>([]);
	let notifications = $state<FeedbackNotification[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadAll() {
		if (!authStore.user) {
			error = 'Login erforderlich.';
			loading = false;
			return;
		}
		loading = true;
		error = null;
		try {
			// Run the three fetches in parallel — they don't depend on each
			// other and the user wants the page to feel snappy.
			const [mineRes, reactedRes, notifsRes] = await Promise.all([
				feedbackService.getMyFeedback(),
				feedbackService.getMyReactedItems(),
				feedbackService.getNotifications({ limit: 30 }),
			]);
			myItems = mineRes.items as unknown as Feedback[];
			reactedItems = reactedRes;
			notifications = notifsRes;
		} catch (err) {
			console.error('[my-wishes] load failed:', err);
			error = err instanceof Error ? err.message : 'Laden fehlgeschlagen';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		void loadAll();
	});

	let unreadCount = $derived(notifications.filter((n) => !n.readAt).length);

	function statusOf(s: string) {
		return FEEDBACK_STATUS_CONFIG[s as FeedbackStatus] ?? null;
	}

	function fmtDate(s: string): string {
		try {
			return new Date(s).toLocaleDateString('de-DE', {
				day: '2-digit',
				month: '2-digit',
				year: '2-digit',
			});
		} catch {
			return s.slice(0, 10);
		}
	}

	function fmtRelativeFromNow(iso: string): string {
		const ms = Date.now() - new Date(iso).getTime();
		const min = Math.round(ms / 60000);
		if (min < 1) return 'gerade eben';
		if (min < 60) return `vor ${min} Min`;
		const hrs = Math.round(min / 60);
		if (hrs < 24) return `vor ${hrs} Std`;
		const days = Math.round(hrs / 24);
		if (days < 7) return `vor ${days} Tg`;
		return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
	}

	async function markAllRead() {
		try {
			await feedbackService.markAllNotificationsRead();
			notifications = notifications.map((n) => ({
				...n,
				readAt: n.readAt ?? new Date().toISOString(),
			}));
		} catch (err) {
			console.warn('[my-wishes] markAllRead failed:', err);
		}
	}

	function goToItem(id: string) {
		void goto(`/community/${id}`);
	}
</script>

<div class="my-wishes">
	<header class="hero">
		<h1>Meine Wünsche</h1>
		<p class="lead">
			Was du eingereicht hast, was du unterstützt hast, und was sich getan hat. Dein persönlicher
			Loop in der Community.
		</p>
	</header>

	<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
	<nav class="tabs" role="tablist">
		<button
			type="button"
			class="tab"
			class:active={active === 'mine'}
			role="tab"
			aria-selected={active === 'mine'}
			onclick={() => (active = 'mine')}
		>
			<span>Eigene</span>
			{#if myItems.length > 0}<span class="count">{myItems.length}</span>{/if}
		</button>
		<button
			type="button"
			class="tab"
			class:active={active === 'reacted'}
			role="tab"
			aria-selected={active === 'reacted'}
			onclick={() => (active = 'reacted')}
		>
			<span>Unterstützt</span>
			{#if reactedItems.length > 0}<span class="count">{reactedItems.length}</span>{/if}
		</button>
		<button
			type="button"
			class="tab"
			class:active={active === 'inbox'}
			role="tab"
			aria-selected={active === 'inbox'}
			onclick={() => (active = 'inbox')}
		>
			<span>Inbox</span>
			{#if unreadCount > 0}<span class="count badge-unread">{unreadCount}</span>{/if}
		</button>
	</nav>

	{#if loading}
		<div class="state">Lade…</div>
	{:else if error}
		<div class="state error">{error}</div>
	{:else if active === 'mine'}
		{#if myItems.length === 0}
			<div class="state">
				Noch keine eigenen Wünsche. Schreib einen über das Idee-Lämpchen oder die Pille unten rechts
				— oder über
				<a class="link" href="/community">/community</a>.
			</div>
		{:else}
			<div class="grid">
				{#each myItems as item (item.id)}
					{@const cfg = statusOf(item.status)}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
					<article class="row" role="button" tabindex="0" onclick={() => goToItem(item.id)}>
						<div class="row-meta">
							{#if cfg}
								<span class="status-pill" style:color={cfg.color} style:border-color={cfg.color}>
									{cfg.label}
								</span>
							{/if}
							{#if item.moduleContext}
								<span class="badge module">{item.moduleContext}</span>
							{/if}
							<span class="muted">{fmtDate(item.createdAt)}</span>
							{#if !item.isPublic}
								<span class="badge private">privat</span>
							{/if}
						</div>
						{#if item.title}
							<h3 class="row-title">{item.title}</h3>
						{/if}
						<p class="row-text">{item.feedbackText}</p>
						{#if item.adminResponse}
							<div class="admin-response">
								<div class="admin-label">Antwort vom Team</div>
								<p>{item.adminResponse}</p>
							</div>
						{/if}
					</article>
				{/each}
			</div>
		{/if}
	{:else if active === 'reacted'}
		{#if reactedItems.length === 0}
			<div class="state">
				Du hast noch nichts unterstützt. Reagier mit 👍 / ❤️ / 🚀 auf einen Wunsch im
				<a class="link" href="/community">Community-Feed</a>.
			</div>
		{:else}
			<div class="grid">
				{#each reactedItems as item (item.id)}
					<ItemCard {item} readOnly onClick={goToItem} />
				{/each}
			</div>
		{/if}
	{:else if active === 'inbox'}
		<div class="inbox-controls">
			{#if unreadCount > 0}
				<button class="btn-ghost" onclick={markAllRead}> Alle als gelesen markieren </button>
			{/if}
		</div>
		{#if notifications.length === 0}
			<div class="state">Noch keine Benachrichtigungen.</div>
		{:else}
			<div class="grid">
				{#each notifications as n (n.id)}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
					<article
						class="notif"
						class:unread={!n.readAt}
						role="button"
						tabindex="0"
						onclick={() => goToItem(n.feedbackId)}
					>
						<header class="notif-head">
							<span class="notif-title">{n.title}</span>
							<span class="muted">{fmtRelativeFromNow(n.createdAt)}</span>
						</header>
						{#if n.body}
							<p class="notif-body">{n.body}</p>
						{/if}
						{#if n.creditsAwarded > 0}
							<span class="reward">+{n.creditsAwarded} Mana</span>
						{/if}
					</article>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.my-wishes {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 0.5rem 0.5rem 1rem;
	}

	.hero {
		padding: 0.5rem 0 0;
	}

	.hero h1 {
		margin: 0 0 0.375rem 0;
		font-size: 1.5rem;
		font-weight: 700;
		letter-spacing: -0.02em;
	}

	.lead {
		margin: 0;
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		line-height: 1.5;
		max-width: 60ch;
	}

	.tabs {
		display: flex;
		gap: 0.25rem;
		padding: 0.25rem;
		background: hsl(var(--color-muted) / 0.3);
		border-radius: 0.625rem;
		align-self: flex-start;
	}

	.tab {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		border: none;
		background: transparent;
		border-radius: 0.5rem;
		font-size: 0.8125rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition:
			background 0.15s,
			color 0.15s,
			box-shadow 0.15s;
	}

	.tab:hover {
		color: hsl(var(--color-foreground));
	}

	.tab.active {
		background: hsl(var(--color-card));
		color: hsl(var(--color-foreground));
		box-shadow: 0 1px 3px hsl(0 0% 0% / 0.08);
	}

	.count {
		font-size: 0.6875rem;
		padding: 0 0.4rem;
		border-radius: 999px;
		background: hsl(var(--color-muted) / 0.5);
		color: hsl(var(--color-muted-foreground));
		font-variant-numeric: tabular-nums;
		font-weight: 700;
	}

	.tab.active .count {
		background: hsl(var(--color-muted) / 0.7);
		color: hsl(var(--color-foreground));
	}

	.count.badge-unread {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground, 0 0% 100%));
	}

	.grid {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.row {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.875rem 1rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-card));
		border-radius: 0.875rem;
		text-align: left;
		cursor: pointer;
		transition:
			border-color 0.15s,
			transform 0.15s;
	}

	.row:hover {
		border-color: hsl(var(--color-primary) / 0.4);
		transform: translateY(-1px);
	}

	.row-meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.6875rem;
	}

	.status-pill {
		padding: 0.125rem 0.4375rem;
		border: 1px solid currentColor;
		border-radius: 999px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.badge {
		padding: 0.125rem 0.4375rem;
		border-radius: 999px;
		background: hsl(var(--color-muted) / 0.4);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.badge.module {
		background: hsl(var(--color-primary) / 0.12);
		color: hsl(var(--color-primary));
	}

	.badge.private {
		background: hsl(var(--color-error, 0 84% 60%) / 0.12);
		color: hsl(var(--color-error, 0 84% 60%));
	}

	.muted {
		color: hsl(var(--color-muted-foreground));
		font-variant-numeric: tabular-nums;
	}

	.row-title {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 700;
	}

	.row-text {
		margin: 0;
		font-size: 0.875rem;
		line-height: 1.5;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.admin-response {
		padding: 0.5rem 0.75rem;
		border-left: 3px solid hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.06);
		border-radius: 0.375rem;
		font-size: 0.8125rem;
	}

	.admin-response p {
		margin: 0;
	}

	.admin-label {
		font-size: 0.6875rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: hsl(var(--color-primary));
		margin-bottom: 0.125rem;
	}

	.notif {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 0.75rem 0.875rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-card));
		border-radius: 0.75rem;
		cursor: pointer;
		transition:
			border-color 0.15s,
			background 0.15s;
	}

	.notif.unread {
		border-color: hsl(var(--color-primary) / 0.5);
		background: hsl(var(--color-primary) / 0.05);
	}

	.notif:hover {
		border-color: hsl(var(--color-primary));
	}

	.notif-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.notif-title {
		font-weight: 600;
		font-size: 0.875rem;
	}

	.notif-body {
		margin: 0;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		line-height: 1.4;
	}

	.reward {
		align-self: flex-start;
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
		background: hsl(var(--color-primary) / 0.12);
		color: hsl(var(--color-primary));
		font-size: 0.75rem;
		font-weight: 700;
	}

	.inbox-controls {
		display: flex;
		justify-content: flex-end;
	}

	.btn-ghost {
		padding: 0.375rem 0.625rem;
		background: transparent;
		border: 1px solid hsl(var(--color-border));
		color: hsl(var(--color-muted-foreground));
		font-size: 0.75rem;
		border-radius: 0.5rem;
		cursor: pointer;
	}

	.btn-ghost:hover {
		color: hsl(var(--color-foreground));
		border-color: hsl(var(--color-primary) / 0.4);
	}

	.state {
		padding: 2rem 1rem;
		text-align: center;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.875rem;
	}

	.state.error {
		color: hsl(var(--color-error, 0 84% 60%));
	}

	.link {
		color: hsl(var(--color-primary));
		text-decoration: underline;
	}
</style>
