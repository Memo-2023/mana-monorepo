import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
	SupportedLanguage,
	SUPPORTED_LANGUAGES,
	changeLanguage,
	getCurrentLanguage,
} from '~/utils/i18n';

interface I18nContextType {
	language: SupportedLanguage;
	supportedLanguages: typeof SUPPORTED_LANGUAGES;
	setLanguage: (language: SupportedLanguage) => Promise<void>;
	t: (key: string, options?: any) => string;
	isReady: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = '@basetext:language';

interface I18nProviderProps {
	children: ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
	const { t, i18n } = useTranslation();
	const [language, setLanguageState] = useState<SupportedLanguage>(getCurrentLanguage());
	const [isReady, setIsReady] = useState(false);

	// Load saved language from storage
	useEffect(() => {
		const loadSavedLanguage = async () => {
			try {
				const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
				if (savedLanguage && SUPPORTED_LANGUAGES.some((lang) => lang.code === savedLanguage)) {
					await changeLanguage(savedLanguage as SupportedLanguage);
					setLanguageState(savedLanguage as SupportedLanguage);
				}
			} catch (error) {
				console.error('Error loading saved language:', error);
			} finally {
				setIsReady(true);
			}
		};

		loadSavedLanguage();
	}, []);

	// Listen for language changes
	useEffect(() => {
		const handleLanguageChange = (lng: string) => {
			setLanguageState(lng as SupportedLanguage);
		};

		i18n.on('languageChanged', handleLanguageChange);

		return () => {
			i18n.off('languageChanged', handleLanguageChange);
		};
	}, [i18n]);

	const setLanguage = async (newLanguage: SupportedLanguage) => {
		try {
			await changeLanguage(newLanguage);
			await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
			setLanguageState(newLanguage);
		} catch (error) {
			console.error('Error setting language:', error);
		}
	};

	const value: I18nContextType = {
		language,
		supportedLanguages: SUPPORTED_LANGUAGES,
		setLanguage,
		t,
		isReady,
	};

	return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextType => {
	const context = useContext(I18nContext);
	if (context === undefined) {
		throw new Error('useI18n must be used within an I18nProvider');
	}
	return context;
};

// Custom hook for translations with type safety
export const useTranslations = () => {
	const { t } = useI18n();

	// Helper functions for commonly used namespaces
	const common = (key: string, options?: any) => t(`common.${key}`, options);
	const navigation = (key: string, options?: any) => t(`navigation.${key}`, options);
	const auth = (key: string, options?: any) => t(`auth.${key}`, options);
	const spaces = (key: string, options?: any) => t(`spaces.${key}`, options);
	const documents = (key: string, options?: any) => t(`documents.${key}`, options);
	const tokens = (key: string, options?: any) => t(`tokens.${key}`, options);
	const ai = (key: string, options?: any) => t(`ai.${key}`, options);
	const settings = (key: string, options?: any) => t(`settings.${key}`, options);
	const homepage = (key: string, options?: any) => t(`homepage.${key}`, options);
	const errors = (key: string, options?: any) => t(`errors.${key}`, options);
	const editor = (key: string, options?: any) => t(`editor.${key}`, options);
	const types = (key: string, options?: any) => t(`types.${key}`, options);
	const time = (key: string, options?: any) => t(`time.${key}`, options);
	const units = (key: string, options?: any) => t(`units.${key}`, options);

	return {
		t,
		common,
		navigation,
		auth,
		spaces,
		documents,
		tokens,
		ai,
		settings,
		homepage,
		errors,
		editor,
		types,
		time,
		units,
	};
};
