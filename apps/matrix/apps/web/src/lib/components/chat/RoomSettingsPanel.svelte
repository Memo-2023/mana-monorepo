<script lang="ts">
	import { matrixStore } from '$lib/matrix';
	import type { RoomWidget } from '$lib/matrix/types';
	import {
		X,
		Users,
		Gear,
		UserPlus,
		SignOut,
		Crown,
		Shield,
		Bell,
		BellSlash,
		CircleNotch,
		SquaresFour,
		MagnifyingGlass,
	} from '@mana/shared-icons';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open, onClose }: Props = $props();

	let activeTab = $state<'members' | 'widgets' | 'settings'>('members');
	let inviteQuery = $state('');
	let searchResults = $state<{ userId: string; displayName?: string; avatarUrl?: string }[]>([]);
	let searching = $state(false);
	let inviting = $state(false);
	let searchTimeout: ReturnType<typeof setTimeout>;
	let expandedWidget = $state<string | null>(null);

	let room = $derived(matrixStore.currentSimpleRoom);
	let members = $derived(matrixStore.getRoomMembers());
	let widgets = $derived(matrixStore.getRoomWidgets());

	function getWidgetUrl(widget: RoomWidget): string {
		return matrixStore.buildWidgetUrl(widget);
	}

	function toggleWidget(widgetId: string) {
		expandedWidget = expandedWidget === widgetId ? null : widgetId;
	}

	function handleSearchInput() {
		clearTimeout(searchTimeout);
		if (inviteQuery.trim().length < 2) {
			searchResults = [];
			return;
		}

		searchTimeout = setTimeout(async () => {
			searching = true;
			const results = await matrixStore.searchUsers(inviteQuery);
			// Filter out existing members
			const memberIds = new Set(members.map((m) => m.userId));
			searchResults = results.filter((r) => !memberIds.has(r.userId));
			searching = false;
		}, 300);
	}

	async function inviteUser(userId: string) {
		if (!matrixStore.currentRoomId) return;

		inviting = true;
		const success = await matrixStore.inviteUser(matrixStore.currentRoomId, userId);
		inviting = false;

		if (success) {
			inviteQuery = '';
			searchResults = [];
		}
	}

	async function leaveRoom() {
		if (!matrixStore.currentRoomId) return;
		if (!confirm('Möchtest du diesen Raum wirklich verlassen?')) return;

		const success = await matrixStore.leaveRoom(matrixStore.currentRoomId);
		if (success) {
			onClose();
		}
	}

	function getPowerLevelIcon(level: number) {
		if (level >= 100) return Crown;
		if (level >= 50) return Shield;
		return null;
	}
</script>

{#if open && room}
	<!-- Backdrop for mobile -->
	<button
		class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
		onclick={onClose}
		aria-label="Schließen"
	></button>

	<!-- Slide-in Panel -->
	<div
		class="fixed inset-y-0 right-0 z-50 flex w-[90vw] max-w-[320px] lg:w-80 flex-col
		       bg-surface-elevated border-l border-border shadow-xl"
	>
		<!-- Header -->
		<header class="flex items-center justify-between border-b border-border px-4 py-3">
			<h2 class="font-semibold text-foreground">Raum-Details</h2>
			<button class="p-2 rounded-lg hover:bg-surface-hover transition-colors" onclick={onClose}>
				<X class="h-5 w-5 text-foreground" />
			</button>
		</header>

		<!-- Room Info -->
		<div class="border-b border-border p-4 text-center">
			<div class="mx-auto mb-3 w-20 h-20 rounded-full overflow-hidden">
				{#if room.avatar}
					<img src={room.avatar} alt={room.name} class="w-full h-full object-cover" />
				{:else}
					<div
						class="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 text-white"
					>
						<span class="text-2xl font-semibold">{room.name.charAt(0).toUpperCase()}</span>
					</div>
				{/if}
			</div>
			<h3 class="text-lg font-semibold text-foreground">{room.name}</h3>
			{#if room.topic}
				<p class="mt-1 text-sm text-muted-foreground">{room.topic}</p>
			{/if}
			<p class="mt-2 text-xs text-muted-foreground">
				{room.memberCount} Mitglieder
				{#if room.isEncrypted}
					• Verschlüsselt
				{/if}
			</p>
		</div>

		<!-- Tabs -->
		<div class="flex border-b border-border">
			<button
				class="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors
				       {activeTab === 'members'
					? 'text-primary border-b-2 border-primary'
					: 'text-muted-foreground hover:text-foreground'}"
				onclick={() => (activeTab = 'members')}
			>
				<Users class="h-4 w-4" />
				Mitglieder
			</button>
			<button
				class="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors
				       {activeTab === 'widgets'
					? 'text-primary border-b-2 border-primary'
					: 'text-muted-foreground hover:text-foreground'}"
				onclick={() => (activeTab = 'widgets')}
			>
				<SquaresFour class="h-4 w-4" />
				Widgets
				{#if widgets.length > 0}
					<span
						class="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white text-[10px] font-medium"
					>
						{widgets.length}
					</span>
				{/if}
			</button>
			<button
				class="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors
				       {activeTab === 'settings'
					? 'text-primary border-b-2 border-primary'
					: 'text-muted-foreground hover:text-foreground'}"
				onclick={() => (activeTab = 'settings')}
			>
				<Gear class="h-4 w-4" />
				Einstellungen
			</button>
		</div>

		<!-- Content -->
		<div class="flex-1 overflow-y-auto chat-scrollbar">
			{#if activeTab === 'members'}
				<!-- Invite User -->
				<div class="border-b border-border p-3">
					<div class="relative">
						<MagnifyingGlass
							class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
						/>
						<input
							type="text"
							bind:value={inviteQuery}
							oninput={handleSearchInput}
							class="w-full rounded-xl bg-surface border border-border px-4 py-2 pl-10
							       text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none
							       placeholder:text-muted-foreground"
							placeholder="Benutzer einladen..."
						/>
						{#if searching}
							<CircleNotch
								class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
							/>
						{/if}
					</div>

					<!-- Search Results -->
					{#if searchResults.length > 0}
						<div class="mt-2 rounded-xl bg-surface border border-border overflow-hidden">
							{#each searchResults as user}
								<button
									class="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-hover transition-colors"
									onclick={() => inviteUser(user.userId)}
									disabled={inviting}
								>
									<div
										class="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs font-medium"
									>
										{user.displayName?.[0]?.toUpperCase() || '?'}
									</div>
									<span class="flex-1 truncate text-sm text-foreground text-left">
										{user.displayName || user.userId}
									</span>
									<UserPlus class="h-4 w-4 text-primary" />
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Member List -->
				<div class="p-2">
					{#each members as member}
						{@const PowerIcon = getPowerLevelIcon(member.powerLevel)}
						<div
							class="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-hover transition-colors"
						>
							<div class="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
								{#if member.avatarUrl}
									<img src={member.avatarUrl} alt="" class="w-full h-full object-cover" />
								{:else}
									<div
										class="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 text-white text-sm font-medium"
									>
										{member.displayName.charAt(0).toUpperCase()}
									</div>
								{/if}
							</div>
							<div class="flex-1 min-w-0">
								<p class="truncate font-medium text-foreground">{member.displayName}</p>
								<p class="truncate text-xs text-muted-foreground">{member.userId}</p>
							</div>
							{#if PowerIcon}
								<PowerIcon class="h-4 w-4 text-amber-500" />
							{/if}
						</div>
					{/each}
				</div>
			{:else if activeTab === 'widgets'}
				<!-- Widgets -->
				<div class="p-3">
					{#if widgets.length === 0}
						<div class="text-center py-8">
							<SquaresFour class="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
							<p class="text-muted-foreground">Keine Widgets in diesem Raum</p>
							<p class="text-xs mt-1 text-muted-foreground">Bots können Widgets hinzufügen</p>
						</div>
					{:else}
						<div class="space-y-3">
							{#each widgets as widget}
								<div class="rounded-xl bg-surface border border-border overflow-hidden">
									<div class="flex items-center justify-between p-3">
										<h3 class="font-medium text-sm text-foreground">{widget.name}</h3>
										<button
											class="px-3 py-1 text-xs font-medium rounded-lg
											       bg-muted hover:bg-surface-hover
											       text-foreground transition-colors"
											onclick={() => toggleWidget(widget.id)}
										>
											{expandedWidget === widget.id ? 'Schließen' : 'Öffnen'}
										</button>
									</div>
									{#if expandedWidget === widget.id}
										<div class="border-t border-border">
											<iframe
												src={getWidgetUrl(widget)}
												title={widget.name}
												class="w-full border-0 bg-surface"
												style="height: 300px;"
												sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
											></iframe>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{:else}
				<!-- Settings -->
				<div class="p-3 space-y-2">
					<!-- Notifications -->
					<button
						class="w-full flex items-center gap-3 px-4 py-3 rounded-xl
						       hover:bg-surface-hover transition-colors"
					>
						<Bell class="h-5 w-5 text-foreground" />
						<span class="flex-1 text-left text-foreground">Benachrichtigungen</span>
						<span class="px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-medium">
							An
						</span>
					</button>

					<!-- Leave Room -->
					<button
						class="w-full flex items-center gap-3 px-4 py-3 rounded-xl
						       text-error hover:bg-error/10 transition-colors"
						onclick={leaveRoom}
					>
						<SignOut class="h-5 w-5" />
						<span class="flex-1 text-left">Raum verlassen</span>
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}
