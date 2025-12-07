<script lang="ts">
	/**
	 * ChatRecentWidget - Recent AI conversations
	 */

	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { chatService, type Conversation } from '$lib/api/services';
	import WidgetSkeleton from '../WidgetSkeleton.svelte';
	import WidgetError from '../WidgetError.svelte';

	let state = $state<'loading' | 'success' | 'error'>('loading');
	let data = $state<Conversation[]>([]);
	let error = $state<string | null>(null);
	let retrying = $state(false);
	let retryCount = $state(0);

	const MAX_DISPLAY = 5;

	async function load() {
		state = 'loading';
		retrying = true;

		const result = await chatService.getRecentConversations(MAX_DISPLAY);

		if (result.data) {
			data = result.data;
			state = 'success';
			retryCount = 0;
		} else {
			error = result.error;
			state = 'error';

			// Don't retry if service is unavailable (network error)
			const isServiceUnavailable = error?.includes('nicht erreichbar');
			if (!isServiceUnavailable && retryCount < 3) {
				retryCount++;
				setTimeout(load, 5000 * retryCount);
			}
		}

		retrying = false;
	}

	onMount(load);

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		if (date.toDateString() === today.toDateString()) {
			return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
		}
		if (date.toDateString() === yesterday.toDateString()) {
			return 'Gestern';
		}

		return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
	}
</script>

<div>
	<div class="mb-3 flex items-center justify-between">
		<h3 class="flex items-center gap-2 text-lg font-semibold">
			<span>💬</span>
			{$_('dashboard.widgets.chat.title')}
		</h3>
	</div>

	{#if state === 'loading'}
		<WidgetSkeleton lines={4} />
	{:else if state === 'error'}
		<WidgetError {error} onRetry={load} {retrying} />
	{:else if data.length === 0}
		<div class="py-6 text-center">
			<div class="mb-2 text-3xl">💭</div>
			<p class="text-sm text-muted-foreground">
				{$_('dashboard.widgets.chat.empty')}
			</p>
			<a
				href="http://localhost:5174"
				target="_blank"
				rel="noopener"
				class="mt-3 inline-block rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
			>
				Chat starten
			</a>
		</div>
	{:else}
		<div class="space-y-2">
			{#each data as conversation}
				<a
					href="http://localhost:5174/chat/{conversation.id}"
					target="_blank"
					rel="noopener"
					class="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-surface-hover"
				>
					<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
						{#if conversation.isPinned}
							📌
						{:else}
							🤖
						{/if}
					</div>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium">
							{conversation.title || 'Neue Unterhaltung'}
						</p>
						<p class="text-xs text-muted-foreground">
							{formatDate(conversation.updatedAt)}
						</p>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
