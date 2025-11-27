export type ThemeVariant = 'default' | 'modern' | 'classic' | 'dark' | 'light';

export interface Theme {
	colors: {
		primary: string;
		backgroundPage: string;
		backgroundPrimary: string;
		backgroundSecondary: string;
		textPrimary: string;
		textSecondary: string;
		error: string;
		success: string;
	};
}

export const THEME_NAMES: Record<ThemeVariant, string> = {
	default: 'Standard',
	modern: 'Modern',
	classic: 'Klassisch',
	dark: 'Dunkel',
	light: 'Hell',
};

const LIGHT_THEME: Theme = {
	colors: {
		primary: '#007AFF',
		backgroundPage: '#F2F2F7',
		backgroundPrimary: '#FFFFFF',
		backgroundSecondary: '#F2F2F7',
		textPrimary: '#000000',
		textSecondary: '#6C6C6C',
		error: '#FF3B30',
		success: '#34C759',
	},
};

const DARK_THEME: Theme = {
	colors: {
		primary: '#0A84FF',
		backgroundPage: '#000000',
		backgroundPrimary: '#1C1C1E',
		backgroundSecondary: '#2C2C2E',
		textPrimary: '#FFFFFF',
		textSecondary: '#8E8E93',
		error: '#FF453A',
		success: '#32D74B',
	},
};

export function getTheme(mode: 'light' | 'dark'): Theme {
	return mode === 'light' ? LIGHT_THEME : DARK_THEME;
}
