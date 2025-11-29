import React from 'react';
import { useTranslation } from 'react-i18next';
import BaseModal from '~/components/atoms/BaseModal';
import BaseLanguageSelector, { LanguageItem } from '~/components/molecules/BaseLanguageSelector';
import { useLanguage } from './LanguageContext';

interface LanguageSelectorProps {
	isVisible: boolean;
	onClose: () => void;
}

/**
 * Komponente zur Auswahl der Sprache in der App.
 * Zeigt alle verfügbaren Sprachen in einer scrollbaren Liste an.
 */
const LanguageSelector: React.FC<LanguageSelectorProps> = ({ isVisible, onClose }) => {
	const { currentLanguage, changeLanguage, languages } = useLanguage();
	const { t } = useTranslation();

	// Convert languages to BaseLanguageSelector format
	const languageItems: Record<string, LanguageItem> = Object.entries(languages).reduce(
		(acc, [code, lang]) => {
			acc[code] = {
				code,
				...lang,
			};
			return acc;
		},
		{} as Record<string, LanguageItem>
	);

	// Handler für die Auswahl einer Sprache
	const handleLanguageSelect = async (selectedLanguages: string[]) => {
		if (selectedLanguages.length > 0) {
			await changeLanguage(selectedLanguages[0]);
			onClose();
		}
	};

	return (
		<BaseModal
			isVisible={isVisible}
			onClose={onClose}
			title={t('language.interface_language_title', 'App Interface Language')}
			animationType="fade"
			closeOnOverlayPress={true}
			hideFooter={true}
			noPadding={true}
			size="medium"
		>
			<BaseLanguageSelector
				languages={languageItems}
				selectedLanguages={[currentLanguage]}
				onSelect={handleLanguageSelect}
				mode="single"
				showAutoDetect={false}
				height={450}
				autoSelectOnSingle={true}
				onClose={onClose}
			/>
		</BaseModal>
	);
};

export default LanguageSelector;
