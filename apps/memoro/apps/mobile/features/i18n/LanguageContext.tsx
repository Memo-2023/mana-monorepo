import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import i18n from './index';
import { getStoredLanguage, changeLanguage, LANGUAGES } from './index';

// Definiere den Typ für den Kontext
interface LanguageContextType {
	currentLanguage: string;
	changeLanguage: (language: string) => Promise<void>;
	languages: typeof LANGUAGES;
	isRTL: boolean;
}

// Erstelle den Kontext
const LanguageContext = createContext<LanguageContextType>({
	currentLanguage: 'en',
	changeLanguage: async () => {},
	languages: LANGUAGES,
	isRTL: false,
});

// Hook für den Zugriff auf den Kontext
export const useLanguage = () => useContext(LanguageContext);

// Provider-Komponente
interface LanguageProviderProps {
	children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
	const [currentLanguage, setCurrentLanguage] = useState<string>(i18n.language || 'en');
	const [isRTL, setIsRTL] = useState<boolean>(false);

	// Aktualisiere den Zustand, wenn sich die i18n-Sprache ändert
	useEffect(() => {
		const handleLanguageChanged = (lng: string) => {
			setCurrentLanguage(lng);
			setIsRTL(['ar', 'he'].includes(lng));
		};

		// Registriere den Event-Listener für Sprachänderungen
		i18n.on('languageChanged', handleLanguageChanged);

		// Setze den initialen Zustand basierend auf der aktuellen i18n-Sprache
		setCurrentLanguage(i18n.language);
		setIsRTL(['ar', 'he'].includes(i18n.language));

		return () => {
			// Entferne den Event-Listener beim Aufräumen
			i18n.off('languageChanged', handleLanguageChanged);
		};
	}, []);

	// Synchronisiere den Zustand mit AsyncStorage, wenn die App geladen wird
	useEffect(() => {
		const syncStoredLanguage = async () => {
			const storedLanguage = await getStoredLanguage();
			if (storedLanguage && storedLanguage !== i18n.language) {
				await i18n.changeLanguage(storedLanguage);
			}
		};

		syncStoredLanguage();
	}, []);

	// Funktion zum Ändern der Sprache
	const handleChangeLanguage = async (language: string) => {
		await changeLanguage(language);
		setCurrentLanguage(language);
		// Prüfe, ob die Sprache RTL ist (für zukünftige Unterstützung)
		setIsRTL(['ar', 'he'].includes(language));
	};

	return (
		<LanguageContext.Provider
			value={{
				currentLanguage,
				changeLanguage: handleChangeLanguage,
				languages: LANGUAGES,
				isRTL,
			}}
		>
			{children}
		</LanguageContext.Provider>
	);
};
