import React, { createContext, useContext, useMemo } from 'react';
import { ManaAuthConfig, ManaAuthTheme, ManaAuthText, ManaAuthEnvironment } from './types';
import { defaultTheme, defaultText, defaultEnvironment } from './defaults';

/**
 * Deep merge helper
 */
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
	const output = { ...target };

	for (const key in source) {
		if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
			output[key] = deepMerge(output[key] || {}, source[key] as any);
		} else if (source[key] !== undefined) {
			output[key] = source[key] as any;
		}
	}

	return output;
}

/**
 * Configuration context
 */
const ManaAuthConfigContext = createContext<ManaAuthConfig | null>(null);

/**
 * Hook to access Mana Auth configuration
 */
export const useManaAuthConfig = () => {
	const context = useContext(ManaAuthConfigContext);
	if (!context) {
		throw new Error('useManaAuthConfig must be used within ManaAuthConfigProvider');
	}
	return context;
};

/**
 * Props for ManaAuthConfigProvider
 */
export interface ManaAuthConfigProviderProps {
	children: React.ReactNode;
	theme?: Partial<ManaAuthTheme>;
	text?: Partial<ManaAuthText>;
	environment: ManaAuthEnvironment; // Required
}

/**
 * Configuration provider component
 */
export const ManaAuthConfigProvider: React.FC<ManaAuthConfigProviderProps> = ({
	children,
	theme = {},
	text = {},
	environment,
}) => {
	const config = useMemo<ManaAuthConfig>(() => {
		// Merge configurations with defaults
		const mergedTheme = deepMerge(defaultTheme, theme);
		const mergedText = deepMerge(defaultText, text);
		const mergedEnvironment = deepMerge(defaultEnvironment as ManaAuthEnvironment, environment);

		return {
			theme: mergedTheme,
			text: mergedText,
			environment: mergedEnvironment,
		};
	}, [theme, text, environment]);

	return <ManaAuthConfigContext.Provider value={config}>{children}</ManaAuthConfigContext.Provider>;
};
