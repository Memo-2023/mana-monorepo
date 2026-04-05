import type { ContextMenuItem } from '@mana/shared-ui';
import type { AppDescriptor, ContextMenuLocation } from '$lib/app-registry/types';
import {
	CornersOut,
	CornersIn,
	Minus,
	CaretLeft,
	CaretRight,
	X,
	ArrowSquareOut,
	Link,
	ArrowLineUp,
} from '@mana/shared-icons';

export interface ContextMenuContext {
	location: ContextMenuLocation;
	appId: string;
	app: AppDescriptor;
	/** Is the card currently maximized? */
	maximized?: boolean;
	// Window management callbacks (optional per location)
	onMaximize?: () => void;
	onMinimize?: () => void;
	onRestore?: () => void;
	onClose?: () => void;
	onMoveLeft?: () => void;
	onMoveRight?: () => void;
	/** Override route (default: /${appId}) */
	appRoute?: string;
}

export function buildContextMenuItems(ctx: ContextMenuContext): ContextMenuItem[] {
	const items: ContextMenuItem[] = [];

	// 1. App-specific actions
	const appActions = (ctx.app.contextMenuActions ?? []).filter(
		(a) => !a.showIn || a.showIn.includes(ctx.location)
	);

	for (const action of appActions) {
		items.push({
			id: action.id,
			label: action.label,
			icon: action.icon,
			shortcut: action.shortcut,
			action: action.action,
		});
	}

	if (appActions.length > 0) {
		items.push({ id: 'div-app', label: '', type: 'divider' });
	}

	// 2. Window management (location-dependent)
	if (ctx.location === 'card') {
		if (ctx.onMaximize) {
			items.push({
				id: 'maximize',
				label: ctx.maximized ? 'Verkleinern' : 'Maximieren',
				icon: ctx.maximized ? CornersIn : CornersOut,
				action: ctx.onMaximize,
			});
		}
		if (ctx.onMinimize) {
			items.push({
				id: 'minimize',
				label: 'Minimieren',
				icon: Minus,
				action: ctx.onMinimize,
			});
		}
		if (ctx.onMoveLeft) {
			items.push({
				id: 'move-left',
				label: 'Nach links',
				icon: CaretLeft,
				action: ctx.onMoveLeft,
			});
		}
		if (ctx.onMoveRight) {
			items.push({
				id: 'move-right',
				label: 'Nach rechts',
				icon: CaretRight,
				action: ctx.onMoveRight,
			});
		}
		items.push({ id: 'div-window', label: '', type: 'divider' });
	}

	if (ctx.location === 'tab') {
		if (ctx.onRestore) {
			items.push({
				id: 'restore',
				label: 'Wiederherstellen',
				icon: ArrowLineUp,
				action: ctx.onRestore,
			});
		}
		if (ctx.onMaximize) {
			items.push({
				id: 'maximize',
				label: 'Maximieren',
				icon: CornersOut,
				action: ctx.onMaximize,
			});
		}
		items.push({ id: 'div-window', label: '', type: 'divider' });
	}

	// 3. Navigation actions (always)
	const route = ctx.appRoute ?? `/${ctx.appId}`;
	items.push({
		id: 'open-route',
		label: 'In neuem Tab öffnen',
		icon: ArrowSquareOut,
		action: () => window.open(route, '_blank'),
	});
	items.push({
		id: 'copy-link',
		label: 'Link kopieren',
		icon: Link,
		action: () => navigator.clipboard.writeText(window.location.origin + route),
	});

	// 4. Close (at the end, danger variant) — only for card/tab
	if (ctx.location === 'card' || ctx.location === 'tab') {
		if (ctx.onClose) {
			items.push({ id: 'div-close', label: '', type: 'divider' });
			items.push({
				id: 'close',
				label: 'Schließen',
				icon: X,
				variant: 'danger',
				action: ctx.onClose,
			});
		}
	}

	return items;
}
