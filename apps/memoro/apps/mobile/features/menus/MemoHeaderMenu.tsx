import React, { useMemo } from 'react';
import { View, Alert } from 'react-native';
import Icon from '~/components/atoms/Icon';
import CustomMenu from '~/components/atoms/CustomMenu';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useTranslation } from 'react-i18next';

interface MemoHeaderMenuProps {
	onPin?: () => void;
	onCopyTranscript?: () => void;
	onManageSpaces?: () => void;
	onTranslate?: () => void;
	onDelete?: () => void;
	isPinned?: boolean;
}

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

	const showDeleteConfirmation = () => {
		Alert.alert(
			t('memo.deleteMemo', 'Memo loeschen'),
			t(
				'memo.deleteConfirm',
				'Moechtest du dieses Memo wirklich loeschen? Diese Aktion kann nicht rueckgaengig gemacht werden.'
			),
			[
				{ text: t('common.cancel', 'Abbrechen'), style: 'cancel' },
				{ text: t('common.delete', 'Loeschen'), style: 'destructive', onPress: onDelete },
			]
		);
	};

	const menuItems = useMemo(
		() => [
			{
				key: 'pin',
				title: isPinned ? t('memo.unpin', 'Memo losloesen') : t('memo.pin', 'Memo anheften'),
				iconName: isPinned ? 'push-pin-slash' : 'push-pin',
				onSelect: onPin,
			},
			{
				key: 'copy',
				title: t('memo.copy_transcript', 'Transkript kopieren'),
				iconName: 'copy-outline',
				onSelect: onCopyTranscript,
			},
			{
				key: 'spaces',
				title: t('memo.manage_spaces', 'Spaces verwalten'),
				iconName: 'folder-outline',
				onSelect: onManageSpaces,
			},
			{
				key: 'translate',
				title: t('memo.translate', 'Uebersetzen'),
				iconName: 'globe-outline',
				onSelect: onTranslate,
			},
			{ key: 'sep-1', separator: true },
			{
				key: 'delete',
				title: t('common.delete', 'Loeschen'),
				iconName: 'trash-outline',
				destructive: true,
				onSelect: showDeleteConfirmation,
			},
		],
		[isPinned, t, onPin, onCopyTranscript, onManageSpaces, onTranslate]
	);

	return (
		<CustomMenu items={menuItems}>
			<View style={{ padding: 12 }}>
				<Icon name="ellipsis-vertical" size={24} color={iconColor} />
			</View>
		</CustomMenu>
	);
};

export default MemoHeaderMenu;
