<script lang="ts">
	import { matrixStore } from '$lib/matrix';
	import { RoomList, RoomHeader, Timeline, MessageInput } from '$lib/components/chat';
	import { goto } from '$app/navigation';
	import { Settings, LogOut, MessageSquare } from 'lucide-svelte';

	let sidebarOpen = $state(true);

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}

	function handleLogout() {
		matrixStore.logout();
		goto('/login');
	}
</script>

<div class="flex h-screen overflow-hidden bg-base-100">
	<!-- Sidebar -->
	<aside
		class="flex w-80 flex-shrink-0 flex-col border-r border-base-300 bg-base-200 transition-all duration-300 ease-in-out"
		class:hidden={!sidebarOpen}
		class:lg:flex={true}
	>
		<!-- Sidebar Header -->
		<header class="flex items-center justify-between border-b border-base-300 p-4">
			<div class="flex items-center gap-2">
				<MessageSquare class="h-6 w-6 text-primary" />
				<h1 class="text-xl font-bold">Mana Matrix</h1>
			</div>
			<div class="dropdown dropdown-end">
				<button tabindex="0" class="btn btn-ghost btn-sm btn-circle">
					<Settings class="h-5 w-5" />
				</button>
				<ul
					tabindex="0"
					class="dropdown-content menu rounded-box z-50 w-52 bg-base-100 p-2 shadow-lg"
				>
					<li>
						<a href="/settings">
							<Settings class="h-4 w-4" />
							Settings
						</a>
					</li>
					<li>
						<button onclick={handleLogout} class="text-error">
							<LogOut class="h-4 w-4" />
							Sign out
						</button>
					</li>
				</ul>
			</div>
		</header>

		<!-- User Info -->
		<div class="border-b border-base-300 px-4 py-2">
			<p class="truncate text-sm font-medium">{matrixStore.userId}</p>
			<p class="flex items-center gap-1 text-xs text-base-content/60">
				<span class="h-2 w-2 rounded-full bg-success"></span>
				{matrixStore.syncState === 'SYNCING' ? 'Connected' : matrixStore.syncState}
			</p>
		</div>

		<!-- Room List -->
		<div class="flex-1 overflow-hidden">
			<RoomList />
		</div>
	</aside>

	<!-- Main Chat Area -->
	<main class="flex flex-1 flex-col overflow-hidden">
		{#if matrixStore.currentRoom}
			<!-- Room Header -->
			<RoomHeader onMenuClick={toggleSidebar} />

			<!-- Timeline -->
			<Timeline />

			<!-- Message Input -->
			<MessageInput />
		{:else}
			<!-- No Room Selected -->
			<div class="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-base-content/50">
				<MessageSquare class="h-16 w-16" />
				<div class="text-center">
					<h2 class="text-xl font-semibold text-base-content">Welcome to Mana Matrix</h2>
					<p class="mt-2">Select a conversation from the sidebar to start chatting</p>
				</div>

				<!-- Stats -->
				<div class="mt-8 flex gap-8 text-center">
					<div>
						<p class="text-3xl font-bold text-base-content">{matrixStore.rooms.length}</p>
						<p class="text-sm">Rooms</p>
					</div>
					<div>
						<p class="text-3xl font-bold text-base-content">{matrixStore.totalUnreadCount}</p>
						<p class="text-sm">Unread</p>
					</div>
				</div>
			</div>
		{/if}
	</main>
</div>
