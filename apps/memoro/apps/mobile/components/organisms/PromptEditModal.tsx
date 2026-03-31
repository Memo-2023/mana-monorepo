import React, { useState, useEffect } from 'react';
import { View, Platform, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '~/features/theme/ThemeProvider';
import Text from '~/components/atoms/Text';
import BaseModal from '~/components/atoms/BaseModal';
import Icon from '~/components/atoms/Icon';
import Input from '~/components/atoms/Input';

interface PromptEditModalProps {
	isVisible: boolean;
	onClose: () => void;
	onSave: (title: string, promptText: string) => Promise<void>;
	onDelete?: () => Promise<void>;
	initialTitle?: string;
	initialPromptText?: string;
	currentLanguage?: string;
}

const PromptEditModal: React.FC<PromptEditModalProps> = ({
	isVisible,
	onClose,
	onSave,
	onDelete,
	initialTitle = '',
	initialPromptText = '',
	currentLanguage = 'de',
}) => {
	const { t } = useTranslation();
	const { isDark, themeVariant } = useTheme();

	const [title, setTitle] = useState(initialTitle);
	const [promptText, setPromptText] = useState(initialPromptText);
	const [isSaving, setIsSaving] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	// Reset form when modal opens with new data
	useEffect(() => {
		if (isVisible) {
			setTitle(initialTitle);
			setPromptText(initialPromptText);
		}
	}, [isVisible, initialTitle, initialPromptText]);

	// Handle save action
	const handleSave = async () => {
		if (!title.trim() || !promptText.trim()) {
			Alert.alert(
				t('prompts.validation_error', 'Eingabefehler'),
				t('prompts.all_fields_required', 'Bitte fülle alle Felder aus.')
			);
			return;
		}

		try {
			setIsSaving(true);
			await onSave(title, promptText);
			onClose();
		} catch (error) {
			console.debug('Error saving prompt:', error);
			Alert.alert(
				t('prompts.save_error', 'Fehler beim Speichern'),
				t('prompts.try_again', 'Bitte versuche es später erneut.')
			);
		} finally {
			setIsSaving(false);
		}
	};

	// Handle delete action with confirmation
	const handleDelete = async () => {
		if (!onDelete) return;

		// Show confirmation dialog
		if (Platform.OS === 'ios') {
			Alert.alert(
				t('prompts.delete_confirm_title', 'Prompt löschen'),
				t('prompts.delete_confirm_message', 'Möchtest du diesen Prompt wirklich löschen?'),
				[
					{
						text: t('common.cancel', 'Abbrechen'),
						style: 'cancel',
					},
					{
						text: t('common.delete', 'Löschen'),
						style: 'destructive',
						onPress: async () => {
							try {
								setIsDeleting(true);
								await onDelete();
								onClose();
							} catch (error) {
								console.debug('Error deleting prompt:', error);
								Alert.alert(
									t('prompts.delete_error', 'Fehler beim Löschen'),
									t('prompts.try_again', 'Bitte versuche es später erneut.')
								);
							} finally {
								setIsDeleting(false);
							}
						},
					},
				]
			);
		} else {
			// For Android and other platforms
			Alert.alert(
				t('prompts.delete_confirm_title', 'Prompt löschen'),
				t('prompts.delete_confirm_message', 'Möchtest du diesen Prompt wirklich löschen?'),
				[
					{
						text: t('common.cancel', 'Abbrechen'),
						style: 'cancel',
					},
					{
						text: t('common.delete', 'Löschen'),
						style: 'destructive',
						onPress: async () => {
							try {
								setIsDeleting(true);
								await onDelete();
								onClose();
							} catch (error) {
								console.debug('Error deleting prompt:', error);
								Alert.alert(
									t('prompts.delete_error', 'Fehler beim Löschen'),
									t('prompts.try_again', 'Bitte versuche es später erneut.')
								);
							} finally {
								setIsDeleting(false);
							}
						},
					},
				]
			);
		}
	};

	// Theme-Farben werden direkt von den Komponenten verwendet

	// Benutzerdefinierter Footer-Inhalt mit Lösch-Button
	const customFooter = onDelete ? (
		<View className="w-full">
			<View
				className="bg-red-600 rounded-xl py-3 px-4 items-center justify-center mb-4"
				style={{ opacity: isDeleting ? 0.7 : 1 }}
			>
				{isDeleting ? (
					<ActivityIndicator size="small" color="#FFFFFF" />
				) : (
					<View className="flex-row items-center justify-center">
						<Icon name="trash-outline" size={18} color="#FFFFFF" />
						<Text className="text-white font-medium text-base ml-2">
							{t('common.delete', 'Löschen')}
						</Text>
					</View>
				)}
			</View>
		</View>
	) : undefined;

	return (
		<BaseModal
			isVisible={isVisible}
			onClose={onClose}
			title={t('prompts.edit_prompt', 'Prompt bearbeiten')}
			animationType="none"
			primaryButtonText={t('common.save', 'Speichern')}
			secondaryButtonText={t('common.cancel', 'Abbrechen')}
			onPrimaryButtonPress={handleSave}
			primaryButtonLoading={isSaving}
			primaryButtonDisabled={isSaving}
			footerContent={customFooter}
		>
			<View className="w-full">
				<Text className={`text-base font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
					{t('prompts.title', 'Titel')}
				</Text>
				<Input
					value={title}
					onChangeText={setTitle}
					placeholder={t('prompts.title_placeholder', 'Titel eingeben...')}
					style={{ marginBottom: 16 }}
				/>

				<Text className={`text-base font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
					{t('prompts.prompt_text', 'Prompt')}
				</Text>
				<Input
					value={promptText}
					onChangeText={setPromptText}
					placeholder={t('prompts.prompt_placeholder', 'Prompt eingeben...')}
					multiline
					numberOfLines={5}
					textAlignVertical="top"
					style={{ minHeight: 120, marginBottom: 16, textAlignVertical: 'top' }}
				/>
			</View>
		</BaseModal>
	);
};

// Keine Styles mehr nötig, da wir NativeWind verwenden

export default PromptEditModal;
