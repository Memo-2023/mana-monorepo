import React, { type FC, type ReactNode } from 'react';
// TODO: Migrate to @expo/ui ContextMenu
import { MenuView } from '~/components/ui/MenuViewPlaceholder';
import type { MenuActionConfig } from '~/config/menuActions';
import { buildMenuActions } from '~/utils/menuBuilder';

export interface NativeMenuProps {
	/**
	 * Die Menu Actions die angezeigt werden sollen
	 */
	actions: MenuActionConfig[];

	/**
	 * Callback wenn eine Action ausgewählt wird
	 */
	onAction: (actionId: string) => void;

	/**
	 * Die Komponente die das Menu triggert
	 */
	children: ReactNode;

	/**
	 * Ob das Menu ein Context Menu ist (Long Press) oder Dropdown (Tap)
	 * @default false (Dropdown)
	 */
	isContextMenu?: boolean;

	/**
	 * Optional: Titel des Menus (nur iOS)
	 */
	title?: string;

	/**
	 * Optional: Callbacks für Menu Events
	 */
	onOpenMenu?: () => void;
	onCloseMenu?: () => void;

	/**
	 * Optional: Theme Variant (nur iOS)
	 */
	themeVariant?: 'light' | 'dark';
}

/**
 * Wrapper-Komponente für @react-native-menu/menu
 * Vereinfacht die Verwendung von nativen Menus im Projekt
 */
export const NativeMenu: FC<NativeMenuProps> = ({
	actions,
	onAction,
	children,
	isContextMenu = false,
	title,
	onOpenMenu,
	onCloseMenu,
	themeVariant,
}) => {
	const menuActions = buildMenuActions(actions);

	return (
		<MenuView
			title={title}
			actions={menuActions}
			onPressAction={({ nativeEvent }) => {
				onAction(nativeEvent.event);
			}}
			onOpenMenu={onOpenMenu}
			onCloseMenu={onCloseMenu}
			shouldOpenOnLongPress={isContextMenu}
			themeVariant={themeVariant}
		>
			{children}
		</MenuView>
	);
};
