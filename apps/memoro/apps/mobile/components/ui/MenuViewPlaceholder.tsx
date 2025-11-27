import React from 'react';
import { View } from 'react-native';

/**
 * Temporary placeholder for MenuView while migrating to @expo/ui
 * This allows the app to compile without @react-native-menu/menu
 *
 * TODO: Migrate all usages to @expo/ui ContextMenu
 */
export const MenuView: React.FC<{
	children: React.ReactNode;
	actions?: any[];
	onPressAction?: (event: any) => void;
	shouldOpenOnLongPress?: boolean;
	[key: string]: any;
}> = ({ children }) => {
	return <View>{children}</View>;
};
