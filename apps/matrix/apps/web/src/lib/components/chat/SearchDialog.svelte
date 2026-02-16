<script lang="ts">
	import { matrixStore } from '$lib/matrix';
	import { MagnifyingGlass, X, CircleNotch, ChatText } from '@manacore/shared-icons';
	import { formatDistanceToNow } from 'date-fns';
	import { de } from 'date-fns/locale';

	interface Props {
		open: boolean;
		onClose: () => void;
		onSelectResult?: (roomId: string, eventId: string) => void;
	}

	let { open, onClose, onSelectResult }: Props = $props();

	let query = $state('');
	let searching = $state(false);
	let searchResults = $state<
		{
			eventId: string;
			sender: string;
			senderName: string;
			body: string;
			timestamp: number;
			roomId: string;
			roomName: string;
		}[]
	>([]);
	let searchScope = $state<'room' | 'all'>('room');
	let hasSearched = $state(false);

	let inputRef: HTMLInputElement;

	$effect(() => {
		if (open && inputRef) {
			setTimeout(() => inputRef?.focus(), 100);
		}
		if (!open) {
			query = '';
			searchResults = [];
			hasSearched = false;
		}
	});

	async function handleSearch() {
		if (!query.trim() || searching) return;

		searching = true;
		hasSearched = true;

		try {
			const roomId = searchScope === 'room' ? matrixStore.currentRoomId : undefined;
			searchResults = await matrixStore.searchMessages(query, roomId || undefined);
		} catch (e) {
			console.error('Search failed:', e);
			searchResults = [];
		} finally {
			searching = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleSearch();
		} else if (e.key === 'Escape') {
			onClose();
		}
	}

	function handleSelectResult(result: (typeof searchResults)[0]) {
		matrixStore.selectRoom(result.roomId);
		onSelectResult?.(result.roomId, result.eventId);
		onClose();
	}

	function formatTime(timestamp: number): string {
		return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: de });
	}

	function highlightMatch(text: string, searchTerm: string): string {
		if (!searchTerm.trim()) return text;
		const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
		return text.replace(
			regex,
			'<mark class="bg-yellow-300/50 dark:bg-yellow-500/30 rounded px-0.5">$1</mark>'
		);
	}
</script>

{#if open}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm pt-20 px-4"
		onclick={onClose}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<!-- Dialog -->
		<div
			class="w-full max-w-2xl rounded-2xl bg-surface-elevated shadow-2xl overflow-hidden"
			onclick={(e) => e.stopPropagation()}
			role="document"
		>
			<!-- Search Header -->
			<div class="flex items-center gap-3 p-4 border-b border-border">
				<MagnifyingGlass class="h-5 w-5 text-muted-foreground flex-shrink-0" />
				<input
					bind:this={inputRef}
					bind:value={query}
					type="text"
					placeholder="Nachrichten durchsuchen..."
					class="flex-1 bg-transparent outline-none text-lg placeholder:text-muted-foreground"
					onkeydown={handleKeydown}
				/>
				{#if searching}
					<CircleNotch class="h-5 w-5 animate-spin text-muted-foreground" />
				{/if}
				<button class="p-1.5 rounded-lg hover:bg-surface-hover transition-colors" onclick={onClose}>
					<X class="h-5 w-5" />
				</button>
			</div>

			<!-- Scope Toggle -->
			<div class="flex gap-2 px-4 py-2 border-b border-border bg-muted/30">
				<button
					class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
					       {searchScope === 'room' ? 'bg-primary text-primary-foreground' : 'hover:bg-surface-hover'}"
					onclick={() => (searchScope = 'room')}
				>
					Aktueller Raum
				</button>
				<button
					class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
					       {searchScope === 'all' ? 'bg-primary text-primary-foreground' : 'hover:bg-surface-hover'}"
					onclick={() => (searchScope = 'all')}
				>
					Alle Räume
				</button>
			</div>

			<!-- Results -->
			<div class="max-h-[60vh] overflow-y-auto">
				{#if searching}
					<div class="flex items-center justify-center gap-2 py-12 text-muted-foreground">
						<CircleNotch class="h-5 w-5 animate-spin" />
						<span>Suche läuft...</span>
					</div>
				{:else if searchResults.length > 0}
					<div class="divide-y divide-border">
						{#each searchResults as result}
							<button
								class="w-full text-left px-4 py-3 hover:bg-surface-hover transition-colors"
								onclick={() => handleSelectResult(result)}
							>
								<div class="flex items-center gap-2 mb-1">
									<span class="font-medium text-sm">{result.senderName}</span>
									{#if searchScope === 'all'}
										<span class="text-xs text-muted-foreground">in {result.roomName}</span>
									{/if}
									<span class="text-xs text-muted-foreground ml-auto"
										>{formatTime(result.timestamp)}</span
									>
								</div>
								<p class="text-sm text-muted-foreground line-clamp-2">
									{@html highlightMatch(result.body, query)}
								</p>
							</button>
						{/each}
					</div>
				{:else if hasSearched && query.trim()}
					<div class="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
						<ChatText class="h-10 w-10 opacity-50" />
						<p>Keine Nachrichten gefunden</p>
						<p class="text-sm">Versuche es mit anderen Suchbegriffen</p>
					</div>
				{:else}
					<div class="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
						<MagnifyingGlass class="h-10 w-10 opacity-50" />
						<p>Gib einen Suchbegriff ein</p>
						<p class="text-sm">Drücke Enter zum Suchen</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
