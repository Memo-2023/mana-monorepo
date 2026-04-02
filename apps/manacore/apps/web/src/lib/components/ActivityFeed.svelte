<script lang="ts">
	import { db } from '$lib/data/database';

	interface Props {
		maxItems?: number;
		locale?: 'de' | 'en';
	}

	let { maxItems = 8, locale = 'de' }: Props = $props();

	interface FeedItem {
		id: string;
		type: 'task' | 'event' | 'contact';
		title: string;
		subtitle?: string;
		timestamp: string;
		color: string;
		icon: string;
	}

	// Query recent completed tasks
	let recentTasks = $state<FeedItem[]>([]);
	let upcomingEvents = $state<FeedItem[]>([]);
	let recentContacts = $state<FeedItem[]>([]);

	$effect(() => {
		loadFeed();
	});

	async function loadFeed() {
		try {
			// Completed tasks from today
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const todayStr = today.toISOString();

			const tasks = await db.table('tasks').toArray();
			recentTasks = tasks
				.filter((t) => t.isCompleted && t.completedAt && t.completedAt >= todayStr)
				.sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''))
				.slice(0, 5)
				.map((t) => ({
					id: `task-${t.id}`,
					type: 'task' as const,
					title: t.title,
					subtitle: locale === 'de' ? 'Erledigt' : 'Completed',
					timestamp: t.completedAt || t.updatedAt,
					color: '#22c55e',
					icon: '\u2705',
				}));
		} catch {
			recentTasks = [];
		}

		try {
			// Upcoming events (next 24h)
			const now = new Date().toISOString();
			const tomorrow = new Date(Date.now() + 86400000).toISOString();

			const events = await db.table('events').toArray();
			upcomingEvents = events
				.filter((e) => e.startDate >= now && e.startDate <= tomorrow)
				.sort((a, b) => a.startDate.localeCompare(b.startDate))
				.slice(0, 5)
				.map((e) => ({
					id: `event-${e.id}`,
					type: 'event' as const,
					title: e.title,
					subtitle: formatTime(e.startDate),
					timestamp: e.startDate,
					color: e.color || '#6366f1',
					icon: '\uD83D\uDCC5',
				}));
		} catch {
			upcomingEvents = [];
		}

		try {
			// Recently added contacts
			const contacts = await db.table('contacts').toArray();
			recentContacts = contacts
				.filter((c) => !c.isArchived)
				.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
				.slice(0, 3)
				.map((c) => {
					const name = [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email || '?';
					return {
						id: `contact-${c.id}`,
						type: 'contact' as const,
						title: name,
						subtitle: c.company || undefined,
						timestamp: c.createdAt,
						color: '#8b5cf6',
						icon: '\uD83D\uDC64',
					};
				});
		} catch {
			recentContacts = [];
		}
	}

	let feedItems = $derived(
		[...recentTasks, ...upcomingEvents, ...recentContacts]
			.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
			.slice(0, maxItems)
	);

	function formatTime(isoString: string): string {
		try {
			const date = new Date(isoString);
			return date.toLocaleTimeString(locale === 'de' ? 'de-DE' : 'en-US', {
				hour: '2-digit',
				minute: '2-digit',
			});
		} catch {
			return '';
		}
	}

	function formatRelative(isoString: string): string {
		try {
			const diff = Date.now() - new Date(isoString).getTime();
			const mins = Math.floor(diff / 60000);
			if (mins < 1) return locale === 'de' ? 'gerade eben' : 'just now';
			if (mins < 60) return `${mins}m`;
			const hrs = Math.floor(mins / 60);
			if (hrs < 24) return `${hrs}h`;
			return `${Math.floor(hrs / 24)}d`;
		} catch {
			return '';
		}
	}
</script>

{#if feedItems.length > 0}
	<section class="feed-section">
		<h2 class="feed-title">{locale === 'de' ? 'Aktivität' : 'Activity'}</h2>
		<div class="feed-list">
			{#each feedItems as item (item.id)}
				<div class="feed-item">
					<span class="feed-icon">{item.icon}</span>
					<div class="feed-content">
						<span class="feed-item-title">{item.title}</span>
						{#if item.subtitle}
							<span class="feed-item-sub">{item.subtitle}</span>
						{/if}
					</div>
					<span class="feed-time">{formatRelative(item.timestamp)}</span>
				</div>
			{/each}
		</div>
	</section>
{/if}

<style>
	.feed-section {
		margin-bottom: 2rem;
	}

	.feed-title {
		font-size: 0.8125rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: hsl(var(--muted-foreground, 0 0% 45%));
		margin: 0 0 0.625rem;
	}

	.feed-list {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.feed-item {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.5rem 0.625rem;
		border-radius: 0.5rem;
		transition: background 0.1s;
	}

	.feed-item:hover {
		background: hsl(var(--muted, 0 0% 96%) / 0.5);
	}

	.feed-icon {
		font-size: 0.875rem;
		flex-shrink: 0;
		width: 1.5rem;
		text-align: center;
	}

	.feed-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.feed-item-title {
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--foreground, 0 0% 9%));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.feed-item-sub {
		font-size: 0.6875rem;
		color: hsl(var(--muted-foreground, 0 0% 45%));
	}

	.feed-time {
		font-size: 0.6875rem;
		color: hsl(var(--muted-foreground, 0 0% 45%));
		flex-shrink: 0;
	}
</style>
