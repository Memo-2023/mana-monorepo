<script lang="ts">
	import type { Email } from '$lib/api/emails';
	import { emailsStore } from '$lib/stores/emails.svelte';

	interface Props {
		emails: Email[];
		loading: boolean;
		selectedId: string | null;
		onSelect: (id: string) => void;
	}

	let { emails, loading, selectedId, onSelect }: Props = $props();

	let selectedIds = $state<Set<string>>(new Set());

	function formatDate(dateString: string | null): string {
		if (!dateString) return '';
		const date = new Date(dateString);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (days === 0) {
			return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
		} else if (days === 1) {
			return 'Yesterday';
		} else if (days < 7) {
			return date.toLocaleDateString('en-US', { weekday: 'short' });
		} else {
			return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		}
	}

	function getInitials(name: string | null, email: string | null): string {
		if (name) {
			return name
				.split(' ')
				.map((n) => n[0])
				.join('')
				.toUpperCase()
				.slice(0, 2);
		}
		if (email) {
			return email[0].toUpperCase();
		}
		return '?';
	}

	function getAvatarColor(email: string | null): string {
		if (!email) return 'hsl(220, 13%, 50%)';
		const colors = [
			'hsl(217, 91%, 60%)',
			'hsl(142, 76%, 36%)',
			'hsl(262, 83%, 58%)',
			'hsl(31, 97%, 52%)',
			'hsl(350, 89%, 60%)',
			'hsl(199, 89%, 48%)',
		];
		const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
		return colors[hash % colors.length];
	}

	function toggleSelect(id: string, event: Event) {
		event.stopPropagation();
		const newSelected = new Set(selectedIds);
		if (newSelected.has(id)) {
			newSelected.delete(id);
		} else {
			newSelected.add(id);
		}
		selectedIds = newSelected;
	}

	async function toggleStar(id: string, event: Event) {
		event.stopPropagation();
		await emailsStore.toggleStar(id);
	}
</script>

<div class="h-full overflow-y-auto scrollbar-thin">
	{#if loading && emails.length === 0}
		<div class="flex items-center justify-center h-32">
			<div class="text-muted-foreground">Loading emails...</div>
		</div>
	{:else if emails.length === 0}
		<div class="flex items-center justify-center h-32">
			<div class="text-center">
				<div class="text-4xl mb-2">📭</div>
				<div class="text-muted-foreground">No emails yet</div>
			</div>
		</div>
	{:else}
		{#each emails as email}
			<div
				class="email-row"
				class:selected={selectedId === email.id}
				class:unread={!email.isRead}
				onclick={() => onSelect(email.id)}
				role="button"
				tabindex="0"
				onkeydown={(e) => e.key === 'Enter' && onSelect(email.id)}
			>
				<!-- Checkbox -->
				<input
					type="checkbox"
					class="email-checkbox mr-3"
					checked={selectedIds.has(email.id)}
					onclick={(e) => toggleSelect(email.id, e)}
				/>

				<!-- Star -->
				<button
					class="star-button mr-2"
					class:starred={email.isStarred}
					onclick={(e) => toggleStar(email.id, e)}
				>
					{email.isStarred ? '⭐' : '☆'}
				</button>

				<!-- Avatar -->
				<div
					class="email-avatar mr-3"
					style="background-color: {getAvatarColor(email.fromAddress)}"
				>
					{getInitials(email.fromName, email.fromAddress)}
				</div>

				<!-- Content -->
				<div class="email-content">
					<div class="flex items-center gap-2">
						<span class="font-medium text-sm truncate">
							{email.fromName || email.fromAddress || 'Unknown'}
						</span>
						{#if email.aiCategory}
							<span class="category-badge {email.aiCategory}">{email.aiCategory}</span>
						{/if}
					</div>
					<div class="email-subject">{email.subject || '(No Subject)'}</div>
					<div class="email-snippet">{email.snippet || ''}</div>
				</div>

				<!-- Attachment indicator -->
				{#if email.hasAttachments}
					<span class="mr-2 text-muted-foreground" title="Has attachments">📎</span>
				{/if}

				<!-- Date -->
				<div class="email-date">{formatDate(email.receivedAt || email.sentAt)}</div>
			</div>
		{/each}

		{#if loading}
			<div class="flex items-center justify-center py-4">
				<div class="text-muted-foreground text-sm">Loading more...</div>
			</div>
		{/if}
	{/if}
</div>
