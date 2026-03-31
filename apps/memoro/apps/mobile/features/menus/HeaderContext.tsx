import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Platform } from 'react-native';

// Interface für die Header-Konfiguration
export interface HeaderIcon {
	name: string;
	onPress?: () => void;
	href?: string;
	customElement?: React.ReactNode;
}

export interface TagItem {
	id: string;
	name: string;
	color: string;
}

export interface HeaderConfig {
	title?: string;
	showBackButton?: boolean;
	rightIcons?: HeaderIcon[];
	selectedTags?: TagItem[];
	onTagRemove?: (tagId: string) => void;
	isHomePage?: boolean;
	scrollableTitle?: boolean;
	showTitle?: boolean;
	isMemoDetailPage?: boolean;
	backgroundColor?: string;
}

// Context für die Header-Konfiguration
interface HeaderContextType {
	config: HeaderConfig;
	updateConfig: (newConfig: Partial<HeaderConfig>) => void;
	resetConfig: () => void;
	/** Gemessene Header-Höhe in px (inkl. SafeArea) */
	headerHeight: number;
	setHeaderHeight: (height: number) => void;
}

const defaultConfig: HeaderConfig = {
	title: 'Memoro',
	showBackButton: false,
	rightIcons: [],
	selectedTags: [],
	isHomePage: false,
	showTitle: true,
	isMemoDetailPage: false,
};

// Safe initial estimate: status bar (iOS ~54px, Android ~24px) + header row (44px)
const INITIAL_HEADER_HEIGHT = Platform.OS === 'ios' ? 98 : 68;

const HeaderContext = createContext<HeaderContextType>({
	config: defaultConfig,
	updateConfig: () => {},
	resetConfig: () => {},
	headerHeight: INITIAL_HEADER_HEIGHT,
	setHeaderHeight: () => {},
});

// Hook für den Zugriff auf den Header-Context
export const useHeader = () => useContext(HeaderContext);

// Provider-Komponente für den Header-Context
export const HeaderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const [config, setConfig] = useState<HeaderConfig>(defaultConfig);
	const [headerHeight, setHeaderHeight] = useState(INITIAL_HEADER_HEIGHT);

	const updateConfig = (newConfig: Partial<HeaderConfig>) => {
		setConfig((prevConfig) => ({
			...prevConfig,
			...newConfig,
		}));
	};

	const resetConfig = () => {
		setConfig(defaultConfig);
	};

	return (
		<HeaderContext.Provider
			value={{ config, updateConfig, resetConfig, headerHeight, setHeaderHeight }}
		>
			{children}
		</HeaderContext.Provider>
	);
};
