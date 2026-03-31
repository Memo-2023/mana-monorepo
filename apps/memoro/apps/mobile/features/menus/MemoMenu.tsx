import React, { useMemo } from 'react';
import { View } from 'react-native';
import Icon from '~/components/atoms/Icon';
import CustomMenu from '~/components/atoms/CustomMenu';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useTranslation } from 'react-i18next';
import type { MenuItem } from '~/components/atoms/menu/MenuTypes';

interface MemoMenuProps {
	onPin?: () => void;
	onDelete?: () => void;
	onCopyTranscript?: () => void;
	onReplaceWord?: () => void;
	onLabelSpeakers?: () => void;
	onSearch?: () => void;
	onTranslate?: () => void;
	onAskQuestion?: () => void;
	onCreateMemory?: () => void;
	onAddPhoto?: () => void;
	onReprocess?: () => void;
	isPinned?: boolean;
	hasStructuredTranscript?: boolean;
}

const MemoMenu: React.FC<MemoMenuProps> = ({
	onPin,
	onDelete,
	onCopyTranscript,
	onReplaceWord,
	onLabelSpeakers,
	onSearch,
	onTranslate,
	onAskQuestion,
	onCreateMemory,
	onAddPhoto,
	onReprocess,
	isPinned = false,
	hasStructuredTranscript = false,
}) => {
	const { isDark } = useTheme();
	const { t } = useTranslation();
	const iconColor = isDark ? '#FFFFFF' : '#000000';

	const menuItems = useMemo(() => {
		const items: MenuItem[] = [];

		if (onAskQuestion) {
			items.push({
				key: 'ask_question',
				title: t('memo_menu.ask_question', 'Frage stellen'),
				iconName: 'chat-dots',
				onSelect: onAskQuestion,
			});
		}

		if (onCreateMemory) {
			items.push({
				key: 'create_memory',
				title: t('memo_menu.create_memory', 'Memory erstellen'),
				iconName: 'book',
				onSelect: onCreateMemory,
			});
		}

		if (onTranslate) {
			items.push({
				key: 'translate',
				title: t('memo_menu.translate', 'Uebersetzen'),
				iconName: 'globe-outline',
				onSelect: onTranslate,
			});
		}

		if (onReprocess) {
			items.push({
				key: 'reprocess',
				title: t('memo_menu.reprocess', 'Erneut verarbeiten'),
				iconName: 'refresh',
				onSelect: onReprocess,
			});
		}

		if (items.length > 0) {
			items.push({ key: 'sep-1', separator: true });
		}

		if (onAddPhoto) {
			items.push({
				key: 'add_photo',
				title: t('memo_menu.add_photo', 'Foto hinzufuegen'),
				iconName: 'image-outline',
				onSelect: onAddPhoto,
			});
		}

		if (onReplaceWord) {
			items.push({
				key: 'replace_word',
				title: t('memo_menu.replace_word', 'Wort ersetzen'),
				iconName: 'arrows-left-right',
				onSelect: onReplaceWord,
			});
		}

		if (onLabelSpeakers && hasStructuredTranscript) {
			items.push({
				key: 'label_speakers',
				title: t('memo_menu.label_speakers', 'Sprecher benennen'),
				iconName: 'people-outline',
				onSelect: onLabelSpeakers,
			});
		}

		if (onSearch) {
			items.push({
				key: 'search',
				title: t('memo_menu.search', 'Suchen'),
				iconName: 'search-outline',
				onSelect: onSearch,
			});
		}

		if (onCopyTranscript) {
			items.push({
				key: 'copy_transcript',
				title: t('memo_menu.copy_transcript', 'Transkript kopieren'),
				iconName: 'copy-outline',
				onSelect: onCopyTranscript,
			});
		}

		if (onPin || onDelete) {
			items.push({ key: 'sep-2', separator: true });
		}

		if (onPin) {
			items.push({
				key: 'pin',
				title: isPinned ? t('memo_menu.unpin', 'Loesen') : t('memo_menu.pin', 'Anpinnen'),
				iconName: isPinned ? 'push-pin-slash' : 'push-pin',
				onSelect: onPin,
			});
		}

		if (onDelete) {
			items.push({
				key: 'delete',
				title: t('memo_menu.delete', 'Loeschen'),
				iconName: 'trash-outline',
				destructive: true,
				onSelect: onDelete,
			});
		}

		return items;
	}, [
		t,
		onAskQuestion,
		onCreateMemory,
		onTranslate,
		onReprocess,
		onAddPhoto,
		onReplaceWord,
		onLabelSpeakers,
		onSearch,
		onCopyTranscript,
		onPin,
		onDelete,
		isPinned,
		hasStructuredTranscript,
	]);

	return (
		<CustomMenu items={menuItems}>
			<View style={{ padding: 12 }}>
				<Icon name="ellipsis-vertical" size={24} color={iconColor} />
			</View>
		</CustomMenu>
	);
};

export default MemoMenu;
