<script lang="ts">
	import type { Email } from '$lib/api/emails';
	import { emailsStore } from '$lib/stores/emails.svelte';

	interface Props {
		email: Email;
		onClose: () => void;
		onReply: () => void;
		onReplyAll: () => void;
		onForward: () => void;
	}

	let { email, onClose, onReply, onReplyAll, onForward }: Props = $props();

	let summaryLoading = $state(false);
	let repliesLoading = $state(false);

	function formatDate(dateString: string | null): string {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
		});
	}

	function formatAddresses(addresses: { email: string; name?: string }[] | null): string {
		if (!addresses || addresses.length === 0) return '';
		return addresses.map((a) => (a.name ? `${a.name} <${a.email}>` : a.email)).join(', ');
	}

	async function handleSummarize() {
		summaryLoading = true;
		await emailsStore.summarize(email.id);
		summaryLoading = false;
	}

	async function handleSuggestReplies() {
		repliesLoading = true;
		await emailsStore.suggestReplies(email.id);
		repliesLoading = false;
	}
</script>

<div class="email-detail h-full flex flex-col">
	<!-- Header -->
	<div class="email-detail-header">
		<div class="flex items-center justify-between mb-4">
			<button class="btn btn-ghost btn-icon" onclick={onClose} title="Close"> ✕ </button>
			<div class="flex items-center gap-2">
				<button class="btn btn-ghost btn-sm" onclick={onReply} title="Reply"> ↩️ Reply </button>
				<button class="btn btn-ghost btn-sm" onclick={onReplyAll} title="Reply All"> ↩️↩️ </button>
				<button class="btn btn-ghost btn-sm" onclick={onForward} title="Forward">
					↪️ Forward
				</button>
			</div>
		</div>

		<h2 class="text-xl font-semibold mb-2">{email.subject || '(No Subject)'}</h2>

		<div class="flex items-start gap-3">
			<div class="email-avatar" style="background-color: hsl(217, 91%, 60%)">
				{(email.fromName || email.fromAddress || '?')[0].toUpperCase()}
			</div>
			<div class="flex-1 min-w-0">
				<div class="font-medium">{email.fromName || email.fromAddress}</div>
				<div class="text-sm text-muted-foreground">{email.fromAddress}</div>
				<div class="text-sm text-muted-foreground mt-1">
					To: {formatAddresses(email.toAddresses)}
				</div>
				{#if email.ccAddresses && email.ccAddresses.length > 0}
					<div class="text-sm text-muted-foreground">
						Cc: {formatAddresses(email.ccAddresses)}
					</div>
				{/if}
			</div>
			<div class="text-sm text-muted-foreground">
				{formatDate(email.receivedAt || email.sentAt)}
			</div>
		</div>

		{#if email.aiCategory}
			<div class="mt-3">
				<span class="category-badge {email.aiCategory}">{email.aiCategory}</span>
				{#if email.aiPriority}
					<span class="ml-2 text-sm text-muted-foreground">
						Priority: {email.aiPriority}
					</span>
				{/if}
			</div>
		{/if}
	</div>

	<!-- AI Features -->
	<div class="px-4 py-3 border-b border-border">
		{#if email.aiSummary}
			<div class="ai-summary-card">
				<div class="label">✨ AI Summary</div>
				<p class="text-sm">{email.aiSummary}</p>
			</div>
		{:else}
			<button class="btn btn-secondary btn-sm" onclick={handleSummarize} disabled={summaryLoading}>
				{summaryLoading ? 'Summarizing...' : '✨ Summarize'}
			</button>
		{/if}

		{#if email.aiSuggestedReplies && email.aiSuggestedReplies.length > 0}
			<div class="mt-3">
				<div class="text-xs font-semibold text-muted-foreground mb-2">Smart Replies</div>
				<div class="flex flex-wrap gap-2">
					{#each email.aiSuggestedReplies as reply}
						<button class="smart-reply-chip" title={reply.tone}>
							{reply.text}
						</button>
					{/each}
				</div>
			</div>
		{:else}
			<button
				class="btn btn-secondary btn-sm mt-2"
				onclick={handleSuggestReplies}
				disabled={repliesLoading}
			>
				{repliesLoading ? 'Generating...' : '💬 Suggest Replies'}
			</button>
		{/if}
	</div>

	<!-- Body -->
	<div class="email-detail-body flex-1 overflow-y-auto scrollbar-thin">
		{#if email.bodyHtml}
			<div class="prose prose-sm max-w-none">
				{@html email.bodyHtml}
			</div>
		{:else if email.bodyPlain}
			<pre class="whitespace-pre-wrap font-sans text-sm">{email.bodyPlain}</pre>
		{:else}
			<p class="text-muted-foreground italic">No content</p>
		{/if}
	</div>

	<!-- Attachments -->
	{#if email.hasAttachments}
		<div class="px-4 py-3 border-t border-border">
			<div class="text-sm font-semibold mb-2">📎 Attachments</div>
			<div class="text-sm text-muted-foreground">Attachments available (click to download)</div>
		</div>
	{/if}
</div>
