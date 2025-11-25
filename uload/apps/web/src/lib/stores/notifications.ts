import { writable, derived, get } from 'svelte/store';
import type { User } from '$lib/types/accounts';

export interface Notification {
	id: string;
	user: string;
	type: 'team_invite' | 'team_accepted' | 'team_declined' | 'link_shared' | 'system' | 'general';
	title: string;
	message: string;
	data?: any;
	read: boolean;
	action_url?: string;
	expires_at?: string;
	created: string;
	updated: string;
}

interface NotificationStore {
	notifications: Notification[];
	loading: boolean;
	error: string | null;
}

function createNotificationStore() {
	const { subscribe, set, update } = writable<NotificationStore>({
		notifications: [],
		loading: false,
		error: null
	});

	return {
		subscribe,
		
		// Load notifications from server
		async load(pb: any) {
			update(s => ({ ...s, loading: true, error: null }));
			
			try {
				const result = await pb.collection('notifications').getList(1, 50, {
					sort: '-created',
					filter: 'expires_at = null || expires_at > @now'
				});
				
				update(s => ({
					...s,
					notifications: result.items,
					loading: false
				}));
				
				return result.items;
			} catch (error: any) {
				update(s => ({
					...s,
					error: error.message,
					loading: false
				}));
				return [];
			}
		},
		
		// Mark notification as read
		async markAsRead(pb: any, notificationId: string) {
			try {
				await pb.collection('notifications').update(notificationId, {
					read: true
				});
				
				update(s => ({
					...s,
					notifications: s.notifications.map(n => 
						n.id === notificationId ? { ...n, read: true } : n
					)
				}));
				
				return true;
			} catch (error: any) {
				console.error('Failed to mark notification as read:', error);
				return false;
			}
		},
		
		// Mark all notifications as read
		async markAllAsRead(pb: any) {
			const store = get(notifications);
			const unreadIds = store.notifications
				.filter(n => !n.read)
				.map(n => n.id);
			
			try {
				// Update all unread notifications
				await Promise.all(
					unreadIds.map(id => 
						pb.collection('notifications').update(id, { read: true })
					)
				);
				
				update(s => ({
					...s,
					notifications: s.notifications.map(n => ({ ...n, read: true }))
				}));
				
				return true;
			} catch (error: any) {
				console.error('Failed to mark all as read:', error);
				return false;
			}
		},
		
		// Delete notification
		async delete(pb: any, notificationId: string) {
			try {
				await pb.collection('notifications').delete(notificationId);
				
				update(s => ({
					...s,
					notifications: s.notifications.filter(n => n.id !== notificationId)
				}));
				
				return true;
			} catch (error: any) {
				console.error('Failed to delete notification:', error);
				return false;
			}
		},
		
		// Add new notification (for real-time updates)
		add(notification: Notification) {
			update(s => ({
				...s,
				notifications: [notification, ...s.notifications]
			}));
		},
		
		// Clear all notifications
		clear() {
			set({
				notifications: [],
				loading: false,
				error: null
			});
		}
	};
}

export const notifications = createNotificationStore();

// Derived store for unread count
export const unreadCount = derived(
	notifications,
	$notifications => $notifications.notifications.filter(n => !n.read).length
);

// Derived store for pending invitations
export const pendingInvitations = derived(
	notifications,
	$notifications => $notifications.notifications.filter(n => n.type === 'team_invite' && !n.read)
);