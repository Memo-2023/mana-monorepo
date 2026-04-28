<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		EulenAvatar,
		KARMA_TIER_CONFIG,
		tierFromKarma,
		FEEDBACK_STATUS_CONFIG,
		type FeedbackStatus,
	} from '@mana/feedback';

	let { data } = $props();

	let tier = $derived(tierFromKarma(data.karma));
	let tierCfg = $derived(KARMA_TIER_CONFIG[tier]);

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

	function goToItem(id: string) {
		void goto(`/community/${id}`);
	}
</script>

<svelte:head>
	<title>{data.displayName ?? 'Eule'} — Mana Community</title>
	<meta
		name="description"
		content={`Profil von ${data.displayName ?? 'einer Eule'} mit ${data.items.length} Wünschen und ${data.karma} Karma.`}
	/>
</svelte:head>

<div class="profile">
	<a href="/community" class="back-link">← Zurück zum Feed</a>

	<header class="hero">
		<EulenAvatar displayHash={data.displayHash} size={96} title={data.displayName ?? ''} />
		<div class="hero-meta">
			<h1>{data.displayName ?? 'Anonym'}</h1>
			<div class="badges">
				<span class="tier" style:background-color="{tierCfg.color}22" style:color={tierCfg.color}>
					<span class="tier-dot" style:background-color={tierCfg.color}></span>
					{tierCfg.label}-Eule
				</span>
				<span class="karma">{data.karma} Karma</span>
				<span class="post-count">{data.items.length} Wünsche</span>
			</div>
			<p class="lead">
				Alle öffentlichen Beiträge dieser Eule. Anonym, aber konsistent — derselbe Mensch dahinter,
				derselbe Avatar.
			</p>
		</div>
	</header>

	{#if data.items.length === 0}
		<div class="state">Diese Eule hat noch nichts gepostet.</div>
	{:else}
		<div class="grid">
			{#each data.items as item (item.id)}
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
					</div>
					{#if item.title}
						<h3 class="row-title">{item.title}</h3>
					{/if}
					<p class="row-text">{item.feedbackText}</p>
				</article>
			{/each}
		</div>
	{/if}
</div>

<style>
	.profile {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		color: hsl(var(--color-muted-foreground));
		text-decoration: none;
		font-size: 0.8125rem;
		padding: 0.5rem 0;
	}

	.back-link:hover {
		color: hsl(var(--color-foreground));
	}

	.hero {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		padding: 1rem 0 0.5rem;
	}

	.hero-meta {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.hero-meta h1 {
		margin: 0;
		font-size: 1.75rem;
		letter-spacing: -0.02em;
	}

	.badges {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
	}

	.tier {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.625rem;
		border-radius: 999px;
		font-weight: 700;
	}

	.tier-dot {
		display: inline-block;
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
	}

	.karma,
	.post-count {
		padding: 0.25rem 0.625rem;
		border-radius: 999px;
		background: hsl(var(--color-muted) / 0.4);
		color: hsl(var(--color-muted-foreground));
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.lead {
		margin: 0;
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		line-height: 1.5;
		max-width: 60ch;
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

	.state {
		padding: 2rem 1rem;
		text-align: center;
		color: hsl(var(--color-muted-foreground));
	}
</style>
