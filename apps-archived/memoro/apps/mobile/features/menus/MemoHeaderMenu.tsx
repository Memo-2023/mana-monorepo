import React, { useMemo } from 'react';
import { Platform, View, Alert } from 'react-native';
import Icon from '~/components/atoms/Icon';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useTranslation } from 'react-i18next';

// @expo/ui ContextMenu - use appropriate platform import
import {
	ContextMenu as ContextMenuiOS,
	Button as ButtoniOS,
	Host as HostiOS,
} from '@expo/ui/swift-ui';
import {
	ContextMenu as ContextMenuAndroid,
	Button as ButtonAndroid,
} from '@expo/ui/jetpack-compose';

// Select the correct components based on platform
const ContextMenu = Platform.OS === 'ios' ? ContextMenuiOS : ContextMenuAndroid;
const ExpoButton = Platform.OS === 'ios' ? ButtoniOS : ButtonAndroid;
const Host = Platform.OS === 'ios' ? HostiOS : View;

interface MemoHeaderMenuProps {
	onPin?: () => void;
	onCopyTranscript?: () => void;
	onManageSpaces?: () => void;
	onTranslate?: () => void;
	onDelete?: () => void;
	isPinned?: boolean;
}

/**
 * MemoHeaderMenu-Komponente
 *
 * Ein Dropdown-Menü für die Memo-Detailseite mit Aktionen wie Anpinnen,
 * Transkript kopieren, Spaces verwalten und Löschen.
 * Nutzt @expo/ui ContextMenu für native Menus auf iOS und Android.
 */
const MemoHeaderMenu: React.FC<MemoHeaderMenuProps> = ({
	onPin,
	onCopyTranscript,
	onManageSpaces,
	onTranslate,
	onDelete,
	isPinned = false,
}) => {
	const { isDark } = useTheme();
	const { t } = useTranslation();

	const iconColor = isDark ? '#FFFFFF' : '#000000';

	// Bestätigungsdialog für Löschen
	const showDeleteConfirmation = () => {
		Alert.alert(
			t('memo.deleteMemo', 'Memo löschen'),
			t(
				'memo.deleteConfirm',
				'Möchtest du dieses Memo wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.'
			),
			[
				{
					text: t('common.cancel', 'Abbrechen'),
					style: 'cancel',
				},
				{
					text: t('common.delete', 'Löschen'),
					style: 'destructive',
					onPress: onDelete,
				},
			]
		);
	};

	// Menu items
	const menuItems = useMemo(() => {
		return [
			{
				key: 'pin',
				title: isPinned ? t('memo.unpin', 'Memo loslösen') : t('memo.pin', 'Memo anheften'),
				systemIcon: isPinned ? 'pin.slash' : 'pin',
				onSelect: onPin,
			},
			{
				key: 'copy',
				title: t('memo.copy_transcript', 'Transkript kopieren'),
				systemIcon: 'doc.on.doc',
				onSelect: onCopyTranscript,
			},
			{
				key: 'spaces',
				title: t('memo.manage_spaces', 'Spaces verwalten'),
				systemIcon: 'folder',
				onSelect: onManageSpaces,
			},
			{
				key: 'translate',
				title: t('memo.translate', 'Übersetzen'),
				systemIcon: 'globe',
				onSelect: onTranslate,
			},
			{
				key: 'delete',
				title: t('common.delete', 'Löschen'),
				systemIcon: 'trash',
				destructive: true,
				onSelect: showDeleteConfirmation,
			},
		];
	}, [isPinned, t, onPin, onCopyTranscript, onManageSpaces, onTranslate]);

	return (
		<Host>
			<ContextMenu>
				<ContextMenu.Items>
					{menuItems.map((item) => (
						<ExpoButton
							key={item.key}
							{...(Platform.OS === 'ios' && { systemImage: item.systemIcon })}
							{...(item.destructive && Platform.OS === 'android' && { color: '#FF3B30' })}
							onPress={item.onSelect}
						>
							{item.title}
						</ExpoButton>
					))}
				</ContextMenu.Items>

				<ContextMenu.Trigger>
					<View style={{ padding: 12 }}>
						<Icon name="ellipsis-vertical" size={24} color={iconColor} />
					</View>
				</ContextMenu.Trigger>
			</ContextMenu>
		</Host>
	);
};

export default MemoHeaderMenu;
