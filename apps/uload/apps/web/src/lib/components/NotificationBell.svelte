<script lang="ts">
	import { Bell, Check, Trash2, ExternalLink, X } from 'lucide-svelte';
	import { notifications, unreadCount } from '$lib/stores/notifications';
	import { pb } from '$lib/pocketbase';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { scale } from 'svelte/transition';
	import { clickOutside } from '$lib/actions/clickOutside';
	
	interface Props {
		position?: 'right' | 'left-outside';
	}
	
	let { position = 'right' }: Props = $props();
	let showDropdown = $state(false);
	
	onMount(() => {
		// Load notifications on mount
		notifications.load(pb);
		
		// Set up real-time subscription
		pb.collection('notifications').subscribe('*', (e) => {
			if (e.action === 'create') {
				notifications.add(e.record);
			} else if (e.action === 'update') {
				// Reload notifications to get updated data
				notifications.load(pb);
			} else if (e.action === 'delete') {
				// Remove deleted notification
				notifications.load(pb);
			}
		});
		
		return () => {
			pb.collection('notifications').unsubscribe('*');
		};
	});
	
	function handleClickOutside() {
		showDropdown = false;
	}
	
	async function handleMarkAsRead(notificationId: string) {
		await notifications.markAsRead(pb, notificationId);
	}
	
	async function handleMarkAllAsRead() {
		await notifications.markAllAsRead(pb);
	}
	
	async function handleDelete(notificationId: string) {
		await notifications.delete(pb, notificationId);
	}
	
	async function handleAction(notification: any) {
		// Mark as read first
		await handleMarkAsRead(notification.id);
		
		// Navigate to action URL if available
		if (notification.action_url) {
			if (notification.action_url.startsWith('http')) {
				window.location.href = notification.action_url;
			} else {
				goto(notification.action_url);
			}
		}
		
		showDropdown = false;
	}
	
	function getNotificationIcon(type: string) {
		switch (type) {
			case 'team_invite':
				return '👥';
			case 'team_accepted':
				return '✅';
			case 'team_declined':
				return '⛔';
			case 'link_shared':
				return '🔗';
			case 'system':
				return '💡';
			default:
				return '🔔';
		}
	}
	
	function getNotificationIconColor(type: string) {
		switch (type) {
			case 'team_invite':
				return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/20';
			case 'team_accepted':
				return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20';
			case 'team_declined':
				return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20';
			case 'link_shared':
				return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20';
			case 'system':
				return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20';
			default:
				return 'text-theme-text-muted bg-theme-primary/10';
		}
	}
	
	function formatTime(dateString: string) {
		const date = new Date(dateString);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);
		
		if (minutes < 1) return 'Gerade eben';
		if (minutes < 60) return `vor ${minutes} Min.`;
		if (hours < 24) return `vor ${hours} Std.`;
		if (days < 7) return `vor ${days} Tag${days === 1 ? '' : 'en'}`;
		return date.toLocaleDateString('de-DE');
	}
</script>

<div class="relative" use:clickOutside={handleClickOutside}>
	<!-- Bell Button -->
	<button
		onclick={() => showDropdown = !showDropdown}
		class="relative p-2 text-theme-text-muted hover:text-theme-text transition-colors"
		aria-label="Benachrichtigungen"
		aria-expanded={showDropdown}
		aria-haspopup="true"
	>
		<Bell class="h-5 w-5" />
		{#if $unreadCount > 0}
			<span class="absolute -top-1 -right-1 bg-theme-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
				{$unreadCount > 9 ? '9+' : $unreadCount}
			</span>
		{/if}
	</button>
	
	<!-- Dropdown Panel -->
	{#if showDropdown}
		<div 
			transition:scale={{ duration: 200, start: 0.95 }}
			class="absolute {position === 'left-outside' ? 'left-0 top-full mt-2 origin-top-left' : 'right-0 mt-2 origin-top-right'} w-96 max-h-[600px] rounded-lg border border-theme-border bg-theme-surface shadow-xl overflow-hidden z-50">
			<!-- Header -->
			<div class="border-b border-theme-border p-2">
				<div class="px-3 py-2 flex items-center justify-between">
					<h3 class="text-sm font-medium text-theme-text">Benachrichtigungen</h3>
					<div class="flex items-center gap-2">
						{#if $unreadCount > 0}
							<button
								onclick={handleMarkAllAsRead}
								class="text-xs text-theme-primary hover:text-theme-primary-hover transition-colors"
							>
								Alle als gelesen markieren
							</button>
						{/if}
						<button
							onclick={() => showDropdown = false}
							class="p-1 rounded-md text-theme-text-muted hover:text-theme-text hover:bg-theme-surface-hover transition-colors"
						>
							<X class="h-4 w-4" />
						</button>
					</div>
				</div>
			</div>
			
			<!-- Notifications List -->
			<div class="overflow-y-auto max-h-[500px]">
				{#if $notifications.loading}
					<div class="p-8 text-center text-theme-text-muted">
						<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto"></div>
						<p class="mt-2 text-sm">Lade Benachrichtigungen...</p>
					</div>
				{:else if $notifications.notifications.length === 0}
					<div class="p-8 text-center text-theme-text-muted">
						<Bell class="h-12 w-12 mx-auto mb-3 opacity-20" />
						<p class="text-sm">Keine Benachrichtigungen</p>
					</div>
				{:else}
					<div class="p-2">
						{#each $notifications.notifications as notification, i}
							<div
								class="group rounded-md px-3 py-3 mb-1 transition-colors hover:bg-theme-surface-hover {!notification.read ? 'bg-theme-primary/5' : ''}"
							>
								<div class="flex items-start gap-3">
									<!-- Icon -->
									<div class="flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 {getNotificationIconColor(notification.type)}">
										<span class="text-base">
											{getNotificationIcon(notification.type)}
										</span>
									</div>
									
									<!-- Content -->
									<div class="flex-1 min-w-0">
										<div class="flex items-start justify-between gap-2">
											<button 
												onclick={() => handleAction(notification)}
												class="flex-1 text-left"
											>
												<p class="text-sm font-medium text-theme-text">
													{notification.title}
												</p>
												<p class="text-xs text-theme-text-muted mt-0.5">
													{notification.message}
												</p>
												<p class="text-xs text-theme-text-muted mt-1.5">
													{formatTime(notification.created)}
												</p>
											</button>
											
											<!-- Actions -->
											<div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
												{#if !notification.read}
													<button
														onclick={(e) => {
															e.stopPropagation();
															handleMarkAsRead(notification.id);
														}}
														class="p-1 rounded text-theme-text-muted hover:text-theme-primary hover:bg-theme-surface-hover transition-colors"
														title="Als gelesen markieren"
													>
														<Check class="h-3.5 w-3.5" />
													</button>
												{/if}
												<button
													onclick={(e) => {
														e.stopPropagation();
														handleDelete(notification.id);
													}}
													class="p-1 rounded text-theme-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
													title="Löschen"
												>
													<Trash2 class="h-3.5 w-3.5" />
												</button>
											</div>
										</div>
										
										{#if notification.type === 'team_invite' && notification.action_url}
											<button
												onclick={(e) => {
													e.stopPropagation();
													handleAction(notification);
												}}
												class="mt-2 inline-flex items-center gap-1 px-2.5 py-1 bg-theme-primary/10 text-theme-primary text-xs font-medium rounded-md hover:bg-theme-primary/20 transition-colors"
											>
												Einladung annehmen
												<ExternalLink class="h-3 w-3" />
											</button>
										{/if}
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>