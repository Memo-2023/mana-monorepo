export interface ThemeColors {
	// Primary brand colors
	primary: {
		50: string;
		100: string;
		200: string;
		300: string;
		400: string;
		500: string;
		600: string;
		700: string;
		800: string;
		900: string;
		950: string;
	};

	// Background colors
	background: {
		base: string;
		surface: string;
		elevated: string;
		overlay: string;
	};

	// Text colors
	text: {
		primary: string;
		secondary: string;
		tertiary: string;
		inverse: string;
	};

	// Border colors
	border: {
		default: string;
		subtle: string;
		strong: string;
	};

	// State colors
	state: {
		success: string;
		warning: string;
		error: string;
		info: string;
	};

	// Interactive elements
	interactive: {
		hover: string;
		active: string;
		focus: string;
		disabled: string;
	};
}

export interface Theme {
	name: string;
	light: ThemeColors;
	dark: ThemeColors;
}

export const themes: Record<string, Theme> = {
	default: {
		name: 'Standard',
		light: {
			primary: {
				50: 'rgb(245 243 255)', // violet-50
				100: 'rgb(237 233 254)', // violet-100
				200: 'rgb(221 214 254)', // violet-200
				300: 'rgb(196 181 253)', // violet-300
				400: 'rgb(167 139 250)', // violet-400
				500: 'rgb(139 92 246)', // violet-500
				600: 'rgb(124 58 237)', // violet-600
				700: 'rgb(109 40 217)', // violet-700
				800: 'rgb(91 33 182)', // violet-800
				900: 'rgb(76 29 149)', // violet-900
				950: 'rgb(46 16 101)', // violet-950
			},
			background: {
				base: 'rgb(248 250 252)', // slate-50
				surface: 'rgb(255 255 255)', // white
				elevated: 'rgb(255 255 255)', // white
				overlay: 'rgba(0 0 0 / 0.5)',
			},
			text: {
				primary: 'rgb(15 23 42)', // slate-900
				secondary: 'rgb(71 85 105)', // slate-600
				tertiary: 'rgb(148 163 184)', // slate-400
				inverse: 'rgb(255 255 255)', // white
			},
			border: {
				default: 'rgb(203 213 225)', // slate-300
				subtle: 'rgb(226 232 240)', // slate-200
				strong: 'rgb(148 163 184)', // slate-400
			},
			state: {
				success: 'rgb(34 197 94)', // green-500
				warning: 'rgb(251 146 60)', // orange-400
				error: 'rgb(239 68 68)', // red-500
				info: 'rgb(59 130 246)', // blue-500
			},
			interactive: {
				hover: 'rgb(248 250 252)', // slate-50
				active: 'rgb(241 245 249)', // slate-100
				focus: 'rgb(139 92 246)', // violet-500
				disabled: 'rgb(226 232 240)', // slate-200
			},
		},
		dark: {
			primary: {
				50: 'rgb(250 250 250)', // zinc-50
				100: 'rgb(244 244 245)', // zinc-100
				200: 'rgb(228 228 231)', // zinc-200
				300: 'rgb(212 212 216)', // zinc-300
				400: 'rgb(161 161 170)', // zinc-400
				500: 'rgb(113 113 122)', // zinc-500
				600: 'rgb(82 82 91)', // zinc-600
				700: 'rgb(63 63 70)', // zinc-700
				800: 'rgb(39 39 42)', // zinc-800
				900: 'rgb(24 24 27)', // zinc-900
				950: 'rgb(9 9 11)', // zinc-950
			},
			background: {
				base: 'rgb(9 9 11)', // zinc-950
				surface: 'rgb(39 39 42)', // zinc-800
				elevated: 'rgb(63 63 70)', // zinc-700
				overlay: 'rgba(0 0 0 / 0.8)',
			},
			text: {
				primary: 'rgb(244 244 245)', // zinc-100
				secondary: 'rgb(161 161 170)', // zinc-400
				tertiary: 'rgb(82 82 91)', // zinc-600
				inverse: 'rgb(24 24 27)', // zinc-900
			},
			border: {
				default: 'rgb(82 82 91)', // zinc-600
				subtle: 'rgb(63 63 70)', // zinc-700
				strong: 'rgb(113 113 122)', // zinc-500
			},
			state: {
				success: 'rgb(34 197 94)', // green-500
				warning: 'rgb(251 146 60)', // orange-400
				error: 'rgb(239 68 68)', // red-500
				info: 'rgb(59 130 246)', // blue-500
			},
			interactive: {
				hover: 'rgb(63 63 70)', // zinc-700
				active: 'rgb(82 82 91)', // zinc-600
				focus: 'rgb(167 139 250)', // violet-400
				disabled: 'rgb(39 39 42)', // zinc-800
			},
		},
	},
	forest: {
		name: 'Wald',
		light: {
			primary: {
				50: 'rgb(240 253 244)', // green-50
				100: 'rgb(220 252 231)', // green-100
				200: 'rgb(187 247 208)', // green-200
				300: 'rgb(134 239 172)', // green-300
				400: 'rgb(74 222 128)', // green-400
				500: 'rgb(34 197 94)', // green-500
				600: 'rgb(22 163 74)', // green-600
				700: 'rgb(21 128 61)', // green-700
				800: 'rgb(22 101 52)', // green-800
				900: 'rgb(20 83 45)', // green-900
				950: 'rgb(5 46 22)', // green-950
			},
			background: {
				base: 'rgb(240 253 244)', // green-50
				surface: 'rgb(255 255 255)', // white
				elevated: 'rgb(255 255 255)', // white
				overlay: 'rgba(0 0 0 / 0.5)',
			},
			text: {
				primary: 'rgb(20 83 45)', // green-900
				secondary: 'rgb(22 101 52)', // green-800
				tertiary: 'rgb(22 163 74)', // green-600
				inverse: 'rgb(255 255 255)', // white
			},
			border: {
				default: 'rgb(134 239 172)', // green-300
				subtle: 'rgb(187 247 208)', // green-200
				strong: 'rgb(74 222 128)', // green-400
			},
			state: {
				success: 'rgb(34 197 94)', // green-500
				warning: 'rgb(251 146 60)', // orange-400
				error: 'rgb(239 68 68)', // red-500
				info: 'rgb(59 130 246)', // blue-500
			},
			interactive: {
				hover: 'rgb(220 252 231)', // green-100
				active: 'rgb(187 247 208)', // green-200
				focus: 'rgb(34 197 94)', // green-500
				disabled: 'rgb(220 252 231)', // green-100
			},
		},
		dark: {
			primary: {
				50: 'rgb(240 253 244)', // green-50
				100: 'rgb(220 252 231)', // green-100
				200: 'rgb(187 247 208)', // green-200
				300: 'rgb(134 239 172)', // green-300
				400: 'rgb(74 222 128)', // green-400
				500: 'rgb(34 197 94)', // green-500
				600: 'rgb(22 163 74)', // green-600
				700: 'rgb(21 128 61)', // green-700
				800: 'rgb(22 101 52)', // green-800
				900: 'rgb(20 83 45)', // green-900
				950: 'rgb(5 46 22)', // green-950
			},
			background: {
				base: 'rgb(5 46 22)', // green-950
				surface: 'rgb(22 101 52)', // green-800
				elevated: 'rgb(21 128 61)', // green-700
				overlay: 'rgba(0 0 0 / 0.8)',
			},
			text: {
				primary: 'rgb(220 252 231)', // green-100
				secondary: 'rgb(134 239 172)', // green-300
				tertiary: 'rgb(74 222 128)', // green-400
				inverse: 'rgb(20 83 45)', // green-900
			},
			border: {
				default: 'rgb(21 128 61)', // green-700
				subtle: 'rgb(22 101 52)', // green-800
				strong: 'rgb(22 163 74)', // green-600
			},
			state: {
				success: 'rgb(34 197 94)', // green-500
				warning: 'rgb(251 146 60)', // orange-400
				error: 'rgb(239 68 68)', // red-500
				info: 'rgb(59 130 246)', // blue-500
			},
			interactive: {
				hover: 'rgb(21 128 61)', // green-700
				active: 'rgb(22 163 74)', // green-600
				focus: 'rgb(74 222 128)', // green-400
				disabled: 'rgb(22 101 52)', // green-800
			},
		},
	},
	ocean: {
		name: 'Ozean',
		light: {
			primary: {
				50: 'rgb(240 249 255)', // sky-50
				100: 'rgb(224 242 254)', // sky-100
				200: 'rgb(186 230 253)', // sky-200
				300: 'rgb(125 211 252)', // sky-300
				400: 'rgb(56 189 248)', // sky-400
				500: 'rgb(14 165 233)', // sky-500
				600: 'rgb(2 132 199)', // sky-600
				700: 'rgb(3 105 161)', // sky-700
				800: 'rgb(7 89 133)', // sky-800
				900: 'rgb(12 74 110)', // sky-900
				950: 'rgb(8 47 73)', // sky-950
			},
			background: {
				base: 'rgb(240 249 255)', // sky-50
				surface: 'rgb(255 255 255)', // white
				elevated: 'rgb(255 255 255)', // white
				overlay: 'rgba(0 0 0 / 0.5)',
			},
			text: {
				primary: 'rgb(12 74 110)', // sky-900
				secondary: 'rgb(7 89 133)', // sky-800
				tertiary: 'rgb(3 105 161)', // sky-700
				inverse: 'rgb(255 255 255)', // white
			},
			border: {
				default: 'rgb(125 211 252)', // sky-300
				subtle: 'rgb(186 230 253)', // sky-200
				strong: 'rgb(56 189 248)', // sky-400
			},
			state: {
				success: 'rgb(34 197 94)', // green-500
				warning: 'rgb(251 146 60)', // orange-400
				error: 'rgb(239 68 68)', // red-500
				info: 'rgb(14 165 233)', // sky-500
			},
			interactive: {
				hover: 'rgb(224 242 254)', // sky-100
				active: 'rgb(186 230 253)', // sky-200
				focus: 'rgb(14 165 233)', // sky-500
				disabled: 'rgb(224 242 254)', // sky-100
			},
		},
		dark: {
			primary: {
				50: 'rgb(240 249 255)', // sky-50
				100: 'rgb(224 242 254)', // sky-100
				200: 'rgb(186 230 253)', // sky-200
				300: 'rgb(125 211 252)', // sky-300
				400: 'rgb(56 189 248)', // sky-400
				500: 'rgb(14 165 233)', // sky-500
				600: 'rgb(2 132 199)', // sky-600
				700: 'rgb(3 105 161)', // sky-700
				800: 'rgb(7 89 133)', // sky-800
				900: 'rgb(12 74 110)', // sky-900
				950: 'rgb(8 47 73)', // sky-950
			},
			background: {
				base: 'rgb(8 47 73)', // sky-950
				surface: 'rgb(12 74 110)', // sky-900
				elevated: 'rgb(7 89 133)', // sky-800
				overlay: 'rgba(0 0 0 / 0.8)',
			},
			text: {
				primary: 'rgb(224 242 254)', // sky-100
				secondary: 'rgb(125 211 252)', // sky-300
				tertiary: 'rgb(56 189 248)', // sky-400
				inverse: 'rgb(12 74 110)', // sky-900
			},
			border: {
				default: 'rgb(3 105 161)', // sky-700
				subtle: 'rgb(7 89 133)', // sky-800
				strong: 'rgb(2 132 199)', // sky-600
			},
			state: {
				success: 'rgb(34 197 94)', // green-500
				warning: 'rgb(251 146 60)', // orange-400
				error: 'rgb(239 68 68)', // red-500
				info: 'rgb(14 165 233)', // sky-500
			},
			interactive: {
				hover: 'rgb(7 89 133)', // sky-800
				active: 'rgb(3 105 161)', // sky-700
				focus: 'rgb(56 189 248)', // sky-400
				disabled: 'rgb(12 74 110)', // sky-900
			},
		},
	},
};

// Helper function to get CSS variable name
export function getCssVariableName(path: string): string {
	return `--theme-${path.replace(/\./g, '-')}`;
}

// Helper function to generate CSS variables from theme
export function generateCssVariables(
	theme: Theme,
	isDark: boolean = false
): Record<string, string> {
	const variables: Record<string, string> = {};
	const colors = isDark ? theme.dark : theme.light;

	// Flatten the theme colors into CSS variables
	Object.entries(colors).forEach(([category, values]) => {
		if (typeof values === 'object' && values !== null) {
			Object.entries(values as Record<string, string>).forEach(([key, value]) => {
				variables[getCssVariableName(`${category}.${key}`)] = value;
			});
		} else if (typeof values === 'string') {
			variables[getCssVariableName(category)] = values;
		}
	});

	return variables;
}

// Get available theme names
export function getThemeNames(): string[] {
	return Object.keys(themes);
}

// Get theme by name
export function getTheme(name: string): Theme | undefined {
	return themes[name];
}
