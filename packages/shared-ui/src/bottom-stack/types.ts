export interface MinimizedPage {
	id: string;
	title: string;
	color: string;
}

export interface MinimizedTabsCallbacks {
	restore: (pageId: string) => void;
	remove: (pageId: string) => void;
	add: () => void;
}

export interface BottomNotification {
	id: string;
	message: string;
	type: 'info' | 'warning' | 'error';
	action?: { label: string; icon?: any; onClick: () => void };
	dismissible?: boolean;
	onDismiss?: () => void;
}
