<!--
  Shared-Event-View — the public render of a calendar event behind
  an unlisted share link.

  Whitelist: title, startTime, endTime, isAllDay, timezone, location.
  That's everything the resolver put into the blob (see
  apps/mana/apps/web/src/lib/data/unlisted/resolvers.ts :: buildEventBlob).

  Design goals: legible date, one-glance "when + where", trivial
  "add to calendar" via .ics download, quiet CTA at the end. Works
  in light + dark (via prefers-color-scheme in the layout).
-->
<script lang="ts">
	interface EventBlob {
		title: string;
		startTime: string;
		endTime: string;
		isAllDay: boolean;
		timezone: string | null;
		location: string | null;
	}

	let {
		blob,
		token,
		expiresAt,
	}: {
		blob: Record<string, unknown>;
		token: string;
		expiresAt: string | null;
	} = $props();

	const event = $derived(blob as unknown as EventBlob);
	const start = $derived(new Date(event.startTime));
	const end = $derived(new Date(event.endTime));

	function formatDate(d: Date): string {
		return new Intl.DateTimeFormat('de-DE', {
			weekday: 'long',
			day: '2-digit',
			month: 'long',
			year: 'numeric',
		}).format(d);
	}

	function formatTime(d: Date): string {
		return new Intl.DateTimeFormat('de-DE', {
			hour: '2-digit',
			minute: '2-digit',
		}).format(d);
	}

	const dateLabel = $derived(formatDate(start));
	const timeLabel = $derived(
		event.isAllDay ? 'Ganztägig' : `${formatTime(start)} – ${formatTime(end)}`
	);

	// Same-day range = compact; otherwise show two dates
	const sameDay = $derived(
		start.getFullYear() === end.getFullYear() &&
			start.getMonth() === end.getMonth() &&
			start.getDate() === end.getDate()
	);
	const dateRangeLabel = $derived(
		sameDay ? dateLabel : `${formatDate(start)} – ${formatDate(end)}`
	);

	const icsUrl = $derived(`/share/${token}/ical`);

	const ogDescription = $derived(
		[event.isAllDay ? dateLabel : `${dateLabel}, ${formatTime(start)}`, event.location]
			.filter(Boolean)
			.join(' · ')
	);
</script>

<svelte:head>
	<title>{event.title} · Mana</title>
	<meta name="robots" content="noindex, nofollow" />
	<meta property="og:title" content={event.title} />
	<meta property="og:description" content={ogDescription} />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary" />
</svelte:head>

<article class="event">
	<span class="event__kind">Termin</span>
	<h1 class="event__title">{event.title}</h1>

	<dl class="event__meta">
		<div class="event__row">
			<dt>Wann</dt>
			<dd>
				<div class="event__date">{dateRangeLabel}</div>
				<div class="event__time">{timeLabel}</div>
				{#if event.timezone}
					<div class="event__tz">Zeitzone: {event.timezone}</div>
				{/if}
			</dd>
		</div>

		{#if event.location}
			<div class="event__row">
				<dt>Wo</dt>
				<dd>{event.location}</dd>
			</div>
		{/if}
	</dl>

	<a class="event__ics" href={icsUrl} download="event.ics">📅 Zum eigenen Kalender hinzufügen</a>

	{#if expiresAt}
		<p class="event__expiry">
			Dieser Link läuft am {new Intl.DateTimeFormat('de-DE', {
				day: '2-digit',
				month: 'long',
				year: 'numeric',
			}).format(new Date(expiresAt))} ab.
		</p>
	{/if}
</article>

<style>
	.event {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.event__kind {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #6b7280;
		font-weight: 600;
	}
	.event__title {
		margin: 0;
		font-size: 2rem;
		font-weight: 700;
		line-height: 1.15;
	}
	.event__meta {
		margin: 0;
		padding: 1.25rem;
		background: rgba(0, 0, 0, 0.03);
		border-radius: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.event__row {
		display: grid;
		grid-template-columns: 5rem 1fr;
		gap: 1rem;
		align-items: baseline;
	}
	.event__row dt {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #6b7280;
		font-weight: 600;
	}
	.event__row dd {
		margin: 0;
	}
	.event__date {
		font-weight: 600;
		font-size: 1.0625rem;
	}
	.event__time {
		font-size: 0.9375rem;
		color: #374151;
		margin-top: 0.15rem;
	}
	.event__tz {
		font-size: 0.75rem;
		color: #6b7280;
		margin-top: 0.25rem;
	}
	.event__ics {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.75rem 1rem;
		background: #4f46e5;
		color: white;
		border-radius: 0.5rem;
		text-decoration: none;
		font-weight: 600;
		font-size: 0.9375rem;
		align-self: flex-start;
	}
	.event__ics:hover {
		background: #4338ca;
	}
	.event__expiry {
		font-size: 0.8125rem;
		color: #6b7280;
		margin: 0;
		font-style: italic;
	}

	@media (prefers-color-scheme: dark) {
		.event__kind {
			color: #9ca3af;
		}
		.event__meta {
			background: rgba(255, 255, 255, 0.05);
		}
		.event__row dt {
			color: #9ca3af;
		}
		.event__time {
			color: #d1d5db;
		}
		.event__tz {
			color: #9ca3af;
		}
		.event__ics {
			background: #818cf8;
		}
		.event__ics:hover {
			background: #6366f1;
		}
		.event__expiry {
			color: #9ca3af;
		}
	}
</style>
