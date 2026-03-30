<script lang="ts">
	/**
	 * ChatRecentWidget - Recent AI conversations (local-first)
	 */

	import { _ } from 'svelte-i18n';
	import { useRecentConversations } from '$lib/data/cross-app-queries';
	import { APP_URLS } from '@manacore/shared-branding';

	const conversations = useRecentConversations(5);

	const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
	const chatUrl = isDev ? APP_URLS.chat.dev : APP_URLS.chat.prod;

	function formatTime(dateStr?: string): string {
		if (!dateStr) return '';
		const date = new Date(dateStr);
		const now = new Date();
		if (date.toDateString() === now.toDateString()) {
			return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
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

	{#if conversations.loading}
		<div class="space-y-2">
			{#each Array(3) as _}
				<div class="h-10 animate-pulse rounded bg-surface-hover"></div>
			{/each}
		</div>
	{:else if (conversations.value ?? []).length === 0}
		<div class="py-6 text-center">
			<div class="mb-2 text-3xl">💬</div>
			<p class="text-sm text-muted-foreground">{$_('dashboard.widgets.chat.empty')}</p>
		</div>
	{:else}
		<div class="space-y-1">
			{#each conversations.value ?? [] as conv (conv.id)}
				<a
					href="{chatUrl}/chat/{conv.id}"
					target="_blank"
					rel="noopener"
					class="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-hover"
				>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium">{conv.title || 'Neue Unterhaltung'}</p>
					</div>
					<span class="flex-shrink-0 text-xs text-muted-foreground">
						{formatTime(conv.updatedAt)}
					</span>
				</a>
			{/each}
		</div>
	{/if}
</div>
