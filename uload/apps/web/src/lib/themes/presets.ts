export interface ColorScheme {
	primary: string;
	primaryHover: string;
	background: string;
	surface: string;
	surfaceHover: string;
	text: string;
	textMuted: string;
	border: string;
	accent: string;
	accentHover: string;
}

export interface ThemePreset {
	id: string;
	name: string;
	description: string;
	font: {
		family: string;
		import?: string; // Google Fonts import URL
	};
	colors: {
		light: ColorScheme;
		dark: ColorScheme;
	};
}

export const themes: Record<string, ThemePreset> = {
	minimal: {
		id: 'minimal',
		name: 'Minimal',
		description: 'Ruhiges, minimalistisches Design',
		font: {
			family: 'Inter, system-ui, -apple-system, sans-serif',
			import: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
		},
		colors: {
			light: {
				primary: '#171717',
				primaryHover: '#0a0a0a',
				background: '#f5f5f5',
				surface: '#fafafa',
				surfaceHover: '#eeeeee',
				text: '#171717',
				textMuted: '#737373',
				border: '#d4d4d4',
				accent: '#525252',
				accentHover: '#404040'
			},
			dark: {
				primary: '#b8b8b8',
				primaryHover: '#ffffff',
				background: '#0a0a0a',
				surface: '#171717',
				surfaceHover: '#262626',
				text: '#fafafa',
				textMuted: '#a3a3a3',
				border: '#404040',
				accent: '#d4d4d4',
				accentHover: '#e5e5e5'
			}
		}
	},
	ocean: {
		id: 'ocean',
		name: 'Ocean',
		description: 'Beruhigende Blautöne',
		font: {
			family: 'Poppins, system-ui, -apple-system, sans-serif',
			import: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap'
		},
		colors: {
			light: {
				primary: '#0ea5e9',
				primaryHover: '#0284c7',
				background: '#e0f2fe',
				surface: '#f0f9ff',
				surfaceHover: '#bae6fd',
				text: '#0c4a6e',
				textMuted: '#475569',
				border: '#7dd3fc',
				accent: '#06b6d4',
				accentHover: '#0891b2'
			},
			dark: {
				primary: '#38bdf8',
				primaryHover: '#7dd3fc',
				background: '#082f49',
				surface: '#0c4a6e',
				surfaceHover: '#075985',
				text: '#f0f9ff',
				textMuted: '#94a3b8',
				border: '#1e3a8a',
				accent: '#22d3ee',
				accentHover: '#67e8f9'
			}
		}
	},
	forest: {
		id: 'forest',
		name: 'Forest',
		description: 'Natürliche Grüntöne',
		font: {
			family: 'Lora, Georgia, serif',
			import: 'https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap'
		},
		colors: {
			light: {
				primary: '#16a34a',
				primaryHover: '#15803d',
				background: '#dcfce7',
				surface: '#f0fdf4',
				surfaceHover: '#bbf7d0',
				text: '#14532d',
				textMuted: '#4b5563',
				border: '#86efac',
				accent: '#84cc16',
				accentHover: '#65a30d'
			},
			dark: {
				primary: '#4ade80',
				primaryHover: '#86efac',
				background: '#052e16',
				surface: '#14532d',
				surfaceHover: '#166534',
				text: '#f0fdf4',
				textMuted: '#86b896',
				border: '#15803d',
				accent: '#a3e635',
				accentHover: '#bef264'
			}
		}
	},
	sunset: {
		id: 'sunset',
		name: 'Sunset',
		description: 'Warme Orange- und Rottöne',
		font: {
			family: 'Raleway, system-ui, -apple-system, sans-serif',
			import: 'https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700&display=swap'
		},
		colors: {
			light: {
				primary: '#ea580c',
				primaryHover: '#c2410c',
				background: '#fed7aa',
				surface: '#fff7ed',
				surfaceHover: '#fdba74',
				text: '#7c2d12',
				textMuted: '#57534e',
				border: '#fb923c',
				accent: '#f97316',
				accentHover: '#fb923c'
			},
			dark: {
				primary: '#fb923c',
				primaryHover: '#fdba74',
				background: '#431407',
				surface: '#7c2d12',
				surfaceHover: '#9a3412',
				text: '#fff7ed',
				textMuted: '#94a3b8',
				border: '#c2410c',
				accent: '#fbbf24',
				accentHover: '#fcd34d'
			}
		}
	},
	lavender: {
		id: 'lavender',
		name: 'Lavender',
		description: 'Sanfte Violett-Töne',
		font: {
			family: 'Playfair Display, Georgia, serif',
			import:
				'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap'
		},
		colors: {
			light: {
				primary: '#9333ea',
				primaryHover: '#7e22ce',
				background: '#f3e8ff',
				surface: '#faf5ff',
				surfaceHover: '#e9d5ff',
				text: '#581c87',
				textMuted: '#525252',
				border: '#d8b4fe',
				accent: '#a855f7',
				accentHover: '#c084fc'
			},
			dark: {
				primary: '#c084fc',
				primaryHover: '#d8b4fe',
				background: '#3b0764',
				surface: '#581c87',
				surfaceHover: '#6b21a8',
				text: '#faf5ff',
				textMuted: '#94a3b8',
				border: '#7e22ce',
				accent: '#d946ef',
				accentHover: '#e879f9'
			}
		}
	}
};

export const defaultTheme = 'minimal';
