<!--
  ItemCard — Single public feedback item, used in ListView, RoadmapView,
  and DetailView (as the parent display). Reactions row is editable when
  the user is logged in; in read-only mode (anonymous SSR) it's static.
-->
<script lang="ts">
	import {
		ReactionBar,
		EulenAvatar,
		FEEDBACK_CATEGORY_LABELS,
		FEEDBACK_STATUS_CONFIG,
		KARMA_TIER_CONFIG,
		tierFromKarma,
		type PublicFeedbackItem,
		type ReactionEmoji,
	} from '@mana/feedback';

	interface Props {
		item: PublicFeedbackItem;
		readOnly?: boolean;
		onReact?: (id: string, emoji: ReactionEmoji) => void | Promise<void>;
		onClick?: (id: string) => void;
		showAdminResponse?: boolean;
	}

	let { item, readOnly = false, onReact, onClick, showAdminResponse = true }: Props = $props();

	let statusConfig = $derived(FEEDBACK_STATUS_CONFIG[item.status]);
	let categoryLabel = $derived(FEEDBACK_CATEGORY_LABELS[item.category] ?? item.category);
	let tier = $derived(tierFromKarma(item.karma ?? 0));
	let tierCfg = $derived(KARMA_TIER_CONFIG[tier]);

	// Hide the bold title when it's just a truncated/prefix copy of the
	// body — pre-rename items have title === feedbackText for short posts.
	let normalizedTitle = $derived(
		(item.title ?? '')
			.toLowerCase()
			.replace(/[…\.]+$/u, '')
			.replace(/\s+/g, ' ')
			.trim()
	);
	let normalizedBody = $derived(
		item.feedbackText
			.toLowerCase()
			.replace(/[…\.]+$/u, '')
			.replace(/\s+/g, ' ')
			.trim()
	);
	let showTitle = $derived(
		!!item.title &&
			normalizedTitle.length > 0 &&
			normalizedTitle !== normalizedBody &&
			!normalizedBody.startsWith(normalizedTitle) &&
			!normalizedTitle.startsWith(normalizedBody)
	);

	function handleClick() {
		if (onClick) onClick(item.id);
	}

	function formatDate(s: string): string {
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

	async function handleReact(emoji: ReactionEmoji) {
		if (onReact) await onReact(item.id, emoji);
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<article
	class="item-card"
	class:clickable={!!onClick}
	onclick={handleClick}
	role={onClick ? 'button' : undefined}
	tabindex={onClick ? 0 : undefined}
>
	<header class="item-header">
		<div class="meta-row">
			<span class="badge category">{categoryLabel}</span>
			{#if item.moduleContext}
				<span class="badge module">{item.moduleContext}</span>
			{/if}
			<span class="badge status" style:color={statusConfig.color}>
				{statusConfig.label}
			</span>
			<span class="muted">{formatDate(item.createdAt)}</span>
		</div>
		{#if showTitle}
			<h3 class="title">{item.title}</h3>
		{/if}
	</header>

	<p class="text">{item.feedbackText}</p>

	{#if showAdminResponse && item.adminResponse}
		<div class="admin-response">
			<div class="admin-label">Antwort vom Team</div>
			<p>{item.adminResponse}</p>
		</div>
	{/if}

	<footer class="item-footer">
		<a
			class="author-link"
			href={`/feedback/eule/${item.displayHash}`}
			onclick={(e) => e.stopPropagation()}
			title={`Profil von ${item.displayName} öffnen · ${tierCfg.label}-Eule (${item.karma ?? 0} Karma)`}
		>
			<EulenAvatar displayHash={item.displayHash} size={24} title={item.displayName} />
			<span class="author">
				<span class="tier-dot" style:background-color={tierCfg.color} aria-hidden="true"></span>
				{item.displayName}
				{#if item.realName}<span class="real-name">· {item.realName}</span>{/if}
			</span>
		</a>
		<ReactionBar
			reactions={item.reactions}
			myReactions={item.myReactions ?? []}
			{readOnly}
			onToggle={handleReact}
			size="sm"
		/>
	</footer>
</article>

<style>
	.item-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.875rem 1rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-card));
		border-radius: 0.875rem;
		text-align: left;
	}

	.item-card.clickable {
		cursor: pointer;
		transition:
			border-color 0.15s,
			transform 0.15s,
			box-shadow 0.15s;
	}

	.item-card.clickable:hover {
		border-color: hsl(var(--color-primary) / 0.4);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px hsl(0 0% 0% / 0.08);
	}

	.item-header {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.meta-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.6875rem;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		padding: 0.125rem 0.4375rem;
		border-radius: 999px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.badge.category {
		background: hsl(var(--color-muted) / 0.45);
		color: hsl(var(--color-foreground));
	}

	.badge.module {
		background: hsl(var(--color-primary) / 0.12);
		color: hsl(var(--color-primary));
	}

	.badge.status {
		background: transparent;
		border: 1px solid currentColor;
	}

	.muted {
		color: hsl(var(--color-muted-foreground));
		font-variant-numeric: tabular-nums;
	}

	.title {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 700;
		line-height: 1.3;
	}

	.text {
		margin: 0;
		font-size: 0.875rem;
		line-height: 1.5;
		color: hsl(var(--color-foreground));
		white-space: pre-wrap;
		word-break: break-word;
	}

	.admin-response {
		margin-top: 0.25rem;
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

	.item-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-top: 0.125rem;
	}

	.author-link {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		text-decoration: none;
		color: inherit;
		padding: 0.125rem 0.25rem;
		margin: -0.125rem -0.25rem;
		border-radius: 0.375rem;
		transition: background 0.15s;
	}

	.author-link:hover {
		background: hsl(var(--color-muted) / 0.4);
	}

	.author {
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
		font-style: italic;
	}

	.real-name {
		font-style: normal;
		opacity: 0.7;
	}

	.tier-dot {
		display: inline-block;
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		margin-right: 0.25rem;
		box-shadow: 0 0 0 1px hsl(0 0% 0% / 0.08);
		vertical-align: middle;
	}
</style>
