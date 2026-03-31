import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import Text from '~/components/atoms/Text';
import Button from '~/components/atoms/Button';
import Input from '~/components/atoms/Input';
import BaseModal from '~/components/atoms/BaseModal';
import { useTranslation } from 'react-i18next';

interface ReplaceWordModalProps {
	visible: boolean;
	onClose: () => void;
	onSubmit: (wordToReplace: string, replacementWord: string) => void;
	initialWordToReplace?: string;
	initialReplacementWord?: string;
}

/**
 * Modal component for replacing words in text
 *
 * Allows input of a word to replace and a replacement word.
 */
const ReplaceWordModal: React.FC<ReplaceWordModalProps> = ({
	visible,
	onClose,
	onSubmit,
	initialWordToReplace = '',
	initialReplacementWord = '',
}) => {
	const { isDark } = useTheme();
	const { t } = useTranslation();

	// Debug borders (set to true to enable)
	const DEBUG_BORDERS = false;

	// State for input fields
	const [wordToReplace, setWordToReplace] = useState(initialWordToReplace);
	const [replacementWord, setReplacementWord] = useState(initialReplacementWord);

	// Reset input fields when initial values change
	useEffect(() => {
		setWordToReplace(initialWordToReplace);
		setReplacementWord(initialReplacementWord);
	}, [initialWordToReplace, initialReplacementWord]);

	// Handler for form submission
	const handleSubmit = () => {
		onSubmit(wordToReplace, replacementWord);
		onClose();
	};

	// Render the form content
	const renderContent = () => (
		<View className="w-full">
			<View className="mb-4 w-full">
				<Text className={`mb-1 ${isDark ? 'text-white/80' : 'text-black/80'}`}>
					{t('memo.word_to_replace', 'Zu ersetzendes Wort:')}
				</Text>
				<Input
					value={wordToReplace}
					onChangeText={setWordToReplace}
					placeholder={t('memo.word_to_replace_placeholder', 'Zu ersetzendes Wort eingeben')}
					autoFocus
				/>
			</View>

			<View className="mb-4 w-full">
				<Text className={`mb-1 ${isDark ? 'text-white/80' : 'text-black/80'}`}>
					{t('memo.new_word', 'Neues Wort:')}
				</Text>
				<Input
					value={replacementWord}
					onChangeText={setReplacementWord}
					placeholder={t('memo.new_word_placeholder', 'Neues Wort eingeben')}
				/>
			</View>
		</View>
	);

	// Render the footer with action buttons
	const renderFooter = () => (
		<View
			className="flex-row justify-between w-full"
			style={DEBUG_BORDERS ? { borderWidth: 2, borderColor: 'yellow' } : {}}
		>
			<Button
				title={t('common.cancel', 'Abbrechen')}
				onPress={onClose}
				variant="secondary"
				style={{
					flex: 1,
					marginRight: 8,
					...(DEBUG_BORDERS ? { borderWidth: 2, borderColor: 'cyan' } : {}),
				}}
			/>
			<Button
				title={t('memo.replace', 'Ersetzen')}
				onPress={handleSubmit}
				variant="primary"
				style={{
					flex: 1,
					...(DEBUG_BORDERS ? { borderWidth: 2, borderColor: 'magenta' } : {}),
				}}
				disabled={!wordToReplace.trim() || !replacementWord.trim()}
			/>
		</View>
	);

	return (
		<BaseModal
			isVisible={visible}
			onClose={onClose}
			title={t('memo.replace_word', 'Wort ersetzen')}
			animationType="fade"
			closeOnOverlayPress={true}
			footerContent={renderFooter()}
		>
			{renderContent()}
		</BaseModal>
	);
};

export default ReplaceWordModal;
