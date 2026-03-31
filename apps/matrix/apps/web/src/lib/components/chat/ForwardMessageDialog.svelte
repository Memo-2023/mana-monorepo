<script lang="ts">
	import { matrixStore, type SimpleMessage, type SimpleRoom } from '$lib/matrix';
	import { Check, MagnifyingGlass, PaperPlaneTilt, User, Users, X } from '@manacore/shared-icons';

	interface Props {
		open: boolean;
		message: SimpleMessage | null;
		onClose: () => void;
	}

	let { open, message, onClose }: Props = $props();

	let search = $state('');
	let sending = $state(false);
	let selectedRooms = $state<Set<string>>(new Set());

	// Filter rooms by search
	let filteredRooms = $derived(
		matrixStore.rooms
			.filter(
				(room) =>
					room.membership === 'join' &&
					room.id !== matrixStore.currentRoomId &&
					room.name.toLowerCase().includes(search.toLowerCase())
			)
			.slice(0, 20)
	);

	function toggleRoom(roomId: string) {
		const newSet = new Set(selectedRooms);
		if (newSet.has(roomId)) {
			newSet.delete(roomId);
		} else {
			newSet.add(roomId);
		}
		selectedRooms = newSet;
	}

	async function handleForward() {
		if (!message || selectedRooms.size === 0) return;

		sending = true;

		// Forward to each selected room
		for (const roomId of selectedRooms) {
			// Create forward message with quote
			const forwardText = `> ${message.senderName}: ${message.body}\n\nWeitergeleitete Nachricht`;
			await matrixStore.sendMessageToRoom(roomId, forwardText);
		}

		sending = false;
		selectedRooms = new Set();
		search = '';
		onClose();
	}

	function handleClose() {
		selectedRooms = new Set();
		search = '';
		onClose();
	}
</script>

{#if open && message}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
		role="dialog"
		aria-modal="true"
	>
		<!-- Dialog -->
		<div
			class="w-full max-w-md rounded-2xl bg-surface-elevated shadow-2xl overflow-hidden"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-border px-4 py-3">
				<h2 class="text-lg font-semibold">Nachricht weiterleiten</h2>
				<button
					class="p-1.5 rounded-lg hover:bg-surface-hover transition-colors"
					onclick={handleClose}
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<!-- Message Preview -->
			<div class="px-4 py-3 bg-muted border-b border-border">
				<p class="text-xs text-muted-foreground mb-1">Von {message.senderName}</p>
				<p class="text-sm line-clamp-3">{message.body}</p>
			</div>

			<!-- Search -->
			<div class="p-4 border-b border-border">
				<div class="relative">
					<MagnifyingGlass
						class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
					/>
					<input
						type="text"
						bind:value={search}
						placeholder="Chat suchen..."
						class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border
						       text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
					/>
				</div>
			</div>

			<!-- Room List -->
			<div class="max-h-64 overflow-y-auto">
				{#if filteredRooms.length === 0}
					<p class="px-4 py-8 text-center text-muted-foreground">Keine Chats gefunden</p>
				{:else}
					{#each filteredRooms as room (room.id)}
						<button
							class="flex items-center gap-3 w-full px-4 py-3 transition-colors text-left
							       {selectedRooms.has(room.id) ? 'bg-violet-500/10' : 'hover:bg-surface-hover'}"
							onclick={() => toggleRoom(room.id)}
						>
							<!-- Checkbox -->
							<div
								class="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors
								       {selectedRooms.has(room.id)
									? 'bg-violet-500 border-violet-500'
									: 'border-black/20 dark:border-white/20'}"
							>
								{#if selectedRooms.has(room.id)}
									<Check size={14} class="text-white" />
								{/if}
							</div>

							<!-- Avatar -->
							<div
								class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
								       bg-gradient-to-br from-violet-500 to-purple-600 text-white"
							>
								{#if room.avatar}
									<img
										src={room.avatar}
										alt={room.name}
										class="w-10 h-10 rounded-full object-cover"
									/>
								{:else if room.isDirect}
									<User class="w-5 h-5" />
								{:else}
									<Users class="w-5 h-5" />
								{/if}
							</div>

							<!-- Room info -->
							<div class="flex-1 min-w-0">
								<p class="font-medium truncate">{room.name}</p>
								<p class="text-xs text-muted-foreground">
									{room.isDirect ? 'Direktnachricht' : `${room.memberCount} Mitglieder`}
								</p>
							</div>
						</button>
					{/each}
				{/if}
			</div>

			<!-- Footer -->
			<div class="flex items-center justify-between border-t border-border px-4 py-3">
				<p class="text-sm text-muted-foreground">
					{selectedRooms.size} ausgewählt
				</p>
				<button
					class="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-medium transition-colors
					       disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={selectedRooms.size === 0 || sending}
					onclick={handleForward}
				>
					<PaperPlaneTilt class="h-4 w-4" weight="bold" />
					{sending ? 'Sende...' : 'Weiterleiten'}
				</button>
			</div>
		</div>
	</div>
{/if}
