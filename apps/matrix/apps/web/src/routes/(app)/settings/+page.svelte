<script lang="ts">
	import { matrixStore } from '$lib/matrix';
	import { goto } from '$app/navigation';
	import { ArrowLeft, User, Bell, Palette, Shield, LogOut, Server } from 'lucide-svelte';

	function handleLogout() {
		matrixStore.logout();
		goto('/login');
	}
</script>

<div class="flex h-screen flex-col bg-base-100">
	<!-- Header -->
	<header class="flex items-center gap-4 border-b border-base-300 p-4">
		<a href="/chat" class="btn btn-ghost btn-sm btn-circle">
			<ArrowLeft class="h-5 w-5" />
		</a>
		<h1 class="text-xl font-bold">Settings</h1>
	</header>

	<!-- Content -->
	<div class="flex-1 overflow-y-auto p-4">
		<div class="mx-auto max-w-2xl space-y-6">
			<!-- Profile Section -->
			<section class="card bg-base-200">
				<div class="card-body">
					<h2 class="card-title">
						<User class="h-5 w-5" />
						Profile
					</h2>
					<div class="mt-4 flex items-center gap-4">
						<div class="avatar placeholder">
							<div class="w-16 rounded-full bg-neutral text-neutral-content">
								<span class="text-2xl">
									{matrixStore.userId?.charAt(1).toUpperCase() || '?'}
								</span>
							</div>
						</div>
						<div>
							<p class="font-medium">{matrixStore.userId}</p>
							<p class="text-sm text-base-content/60">Matrix ID</p>
						</div>
					</div>
				</div>
			</section>

			<!-- Server Section -->
			<section class="card bg-base-200">
				<div class="card-body">
					<h2 class="card-title">
						<Server class="h-5 w-5" />
						Server
					</h2>
					<div class="mt-2 space-y-2 text-sm">
						<div class="flex justify-between">
							<span class="text-base-content/60">Homeserver</span>
							<span class="font-mono">{matrixStore.client?.getHomeserverUrl() || 'Unknown'}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-base-content/60">Sync Status</span>
							<span
								class="badge"
								class:badge-success={matrixStore.isReady}
								class:badge-warning={!matrixStore.isReady}
							>
								{matrixStore.syncState}
							</span>
						</div>
						<div class="flex justify-between">
							<span class="text-base-content/60">Rooms</span>
							<span>{matrixStore.rooms.length}</span>
						</div>
					</div>
				</div>
			</section>

			<!-- Appearance Section (Placeholder) -->
			<section class="card bg-base-200">
				<div class="card-body">
					<h2 class="card-title">
						<Palette class="h-5 w-5" />
						Appearance
					</h2>
					<p class="text-sm text-base-content/60">Theme and display settings coming soon...</p>
				</div>
			</section>

			<!-- Notifications Section (Placeholder) -->
			<section class="card bg-base-200">
				<div class="card-body">
					<h2 class="card-title">
						<Bell class="h-5 w-5" />
						Notifications
					</h2>
					<p class="text-sm text-base-content/60">Notification settings coming soon...</p>
				</div>
			</section>

			<!-- Security Section (Placeholder) -->
			<section class="card bg-base-200">
				<div class="card-body">
					<h2 class="card-title">
						<Shield class="h-5 w-5" />
						Security
					</h2>
					<p class="text-sm text-base-content/60">
						End-to-end encryption settings coming in Phase 2...
					</p>
				</div>
			</section>

			<!-- Logout -->
			<section class="card bg-base-200">
				<div class="card-body">
					<button class="btn btn-error w-full" onclick={handleLogout}>
						<LogOut class="h-5 w-5" />
						Sign Out
					</button>
				</div>
			</section>
		</div>
	</div>
</div>
