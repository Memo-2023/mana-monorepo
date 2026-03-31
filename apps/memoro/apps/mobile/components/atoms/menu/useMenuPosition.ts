import { useCallback } from 'react';
import { Dimensions } from 'react-native';
import type { MenuItem } from './MenuTypes';

interface MenuPositionOptions {
	items: MenuItem[];
	menuWidth: number | 'dynamic';
	/** Padding from screen edges */
	padding?: number;
	/** Item height for estimation (default: 48 for ContextMenu, 44 for CustomMenu) */
	itemHeight?: number;
	/** Alignment relative to trigger: 'center' or 'right' */
	align?: 'center' | 'right';
}

interface MenuPositionResult {
	menuX: number;
	menuY: number;
	menuWidth: number;
	showAbove: boolean;
}

export function useMenuPosition(options: MenuPositionOptions) {
	const {
		items,
		menuWidth: menuWidthOption,
		padding = 16,
		itemHeight = 48,
		align = 'center',
	} = options;

	const calculate = useCallback(
		(
			triggerX: number,
			triggerY: number,
			triggerWidth: number,
			triggerHeight: number
		): MenuPositionResult => {
			const screenWidth = Dimensions.get('window').width;
			const screenHeight = Dimensions.get('window').height;

			// Calculate menu width
			const resolvedWidth =
				menuWidthOption === 'dynamic'
					? Math.min(Math.max(triggerWidth, 220), screenWidth - padding * 2)
					: menuWidthOption;

			// Estimate menu height
			const menuItemCount = items.filter((i) => !i.separator).length;
			const separatorCount = items.filter((i) => i.separator).length;
			const estimatedMenuHeight = menuItemCount * itemHeight + separatorCount * 9 + 12;

			// Vertical: above or below trigger
			const spaceBelow = screenHeight - (triggerY + triggerHeight);
			const showAbove = spaceBelow < estimatedMenuHeight + 30;
			const menuY = showAbove ? triggerY - estimatedMenuHeight - 8 : triggerY + triggerHeight + 8;

			// Horizontal positioning
			let menuX: number;
			if (align === 'center') {
				menuX = Math.max(
					padding,
					Math.min(
						triggerX + (triggerWidth - resolvedWidth) / 2,
						screenWidth - resolvedWidth - padding
					)
				);
			} else {
				// right-align: menu right edge aligns with trigger right edge
				menuX = Math.max(
					padding,
					Math.min(triggerX - resolvedWidth + triggerWidth, screenWidth - resolvedWidth - padding)
				);
			}

			return { menuX, menuY, menuWidth: resolvedWidth, showAbove };
		},
		[items, menuWidthOption, padding, itemHeight, align]
	);

	return { calculate };
}
