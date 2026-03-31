import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import Button from '~/components/atoms/Button';
import Text from '~/components/atoms/Text';
import Input from '~/components/atoms/Input';
import BaseModal from '~/components/atoms/BaseModal';
import ColorPicker from '~/features/tags/ColorPicker';
import { TAG_COLORS } from '~/features/tags/CreateTagElement';
import { useTranslation } from 'react-i18next';

interface Tag {
	id: string;
	name: string;
	style: { color?: string; [key: string]: any };
	user_id?: string;
	created_at?: string;
	updated_at?: string;
}

interface ModalTagCreateAndEditProps {
	isVisible: boolean;
	onCancel: () => void;
	onClose: () => void;
	onSave: (name: string, color: string) => void;
	editingTag: Tag | null;
	isDark: boolean;
}

const ModalTagCreateAndEdit = ({
	isVisible,
	onCancel,
	onClose,
	onSave,
	editingTag,
	isDark,
}: ModalTagCreateAndEditProps): React.ReactElement => {
	const { t } = useTranslation();
	const [tagName, setTagName] = useState('');
	const [tagColor, setTagColor] = useState(TAG_COLORS[0]);

	// Reset form when modal visibility changes or editing tag changes
	useEffect(() => {
		if (isVisible) {
			if (editingTag) {
				setTagName(editingTag.name || '');
				setTagColor(editingTag.style?.color || TAG_COLORS[0]);
			} else {
				setTagName('');
				setTagColor(TAG_COLORS[0]);
			}
		}
	}, [isVisible, editingTag]);

	const handleSave = () => {
		onSave(tagName, tagColor);
	};

	// Handler für Farbauswahl
	const handleColorSelect = (color: string) => {
		setTagColor(color);
	};

	// Render the content
	const renderContent = () => (
		<View className="w-full">
			<View className="mb-4 w-full">
				<Text className={`mb-1 ${isDark ? 'text-white/80' : 'text-black/80'}`}>
					{editingTag ? t('tags.change_name', 'Name ändern:') : t('tags.name_tag', 'Tag benennen:')}
				</Text>
				<View className="flex-row items-center w-full">
					<View
						className="w-6 h-6 rounded-full mr-3 border border-black/10"
						style={{ backgroundColor: tagColor }}
					/>
					<View className="flex-1">
						<Input
							value={tagName}
							onChangeText={setTagName}
							placeholder={t('tags.enter_tag_name', 'Tag-Name eingeben...')}
							autoFocus
						/>
					</View>
				</View>
			</View>

			<View className="w-full">
				<Text className={`${isDark ? 'text-white/80' : 'text-black/80'}`}>
					{editingTag
						? t('tags.change_color', 'Farbe ändern:')
						: t('tags.select_color', 'Farbe auswählen:')}
				</Text>
				<ColorPicker
					colors={TAG_COLORS}
					selectedColor={tagColor}
					onSelectColor={handleColorSelect}
					isDark={isDark}
				/>
			</View>
		</View>
	);

	// Render the footer with action buttons
	const renderFooter = () => (
		<View className="flex-row justify-between w-full">
			<Button
				title={t('common.cancel', 'Abbrechen')}
				onPress={onCancel}
				variant="secondary"
				style={{ flex: 1, marginRight: 8 }}
			/>
			<Button
				title={editingTag ? t('common.save', 'Speichern') : t('common.create', 'Erstellen')}
				onPress={handleSave}
				variant="primary"
				style={{ flex: 1 }}
				disabled={!tagName.trim()}
			/>
		</View>
	);

	return (
		<BaseModal
			isVisible={isVisible}
			onClose={onCancel}
			title={
				editingTag ? t('tags.edit_tag', 'Tag bearbeiten') : t('tags.create_tag', 'Tag erstellen')
			}
			animationType="fade"
			closeOnOverlayPress={true}
			position="top"
			footerContent={renderFooter()}
		>
			{renderContent()}
		</BaseModal>
	);
};

export default ModalTagCreateAndEdit;
