export const theme = {
	colors: {
		// Primary colors - Memoro Yellow/Gold
		primary: {
			DEFAULT: '#806b00',
			light: '#f8d62b',
			dark: '#f8d62b',
			hover: '#ae9200',
		},

		// Text colors
		text: {
			primary: '#ffffff',
			primaryHover: '#f3f4f6',
			secondary: '#9ca3af',
			secondaryHover: '#d1d5db',
			muted: '#6b7280',
			mutedHover: '#9ca3af',
		},

		// Background colors
		background: {
			global: '#000000',
			page: '#0D0C12',
			card: '#1a1a1a',
			cardHover: '#262626',
			input: '#262626',
		},

		// Border colors
		border: {
			DEFAULT: '#333333',
			light: '#404040',
		},

		// Status/Accent colors
		status: {
			success: '#10b981',
			warning: '#f59e0b',
			error: '#ef4444',
			info: '#3b82f6',
		},

		// Accent colors (alias for status)
		accent: {
			success: '#10b981',
			warning: '#f59e0b',
			error: '#ef4444',
			info: '#3b82f6',
		},
	},

	// Font families
	fontFamily: {
		sans: ['Inter', 'system-ui', 'sans-serif'],
		mono: ['Fira Code', 'monospace'],
	},

	// Spacing scale
	spacing: {
		xs: '0.5rem',
		sm: '1rem',
		md: '1.5rem',
		lg: '2rem',
		xl: '3rem',
		'2xl': '4rem',
	},

	// Animation
	animation: {
		'fade-in': 'fadeIn 0.3s ease-in-out',
		'slide-up': 'slideUp 0.3s ease-out',
	},

	keyframes: {
		fadeIn: {
			'0%': { opacity: '0' },
			'100%': { opacity: '1' },
		},
		slideUp: {
			'0%': { transform: 'translateY(10px)', opacity: '0' },
			'100%': { transform: 'translateY(0)', opacity: '1' },
		},
	},

	// Transitions
	transitionDuration: {
		DEFAULT: '200ms',
		fast: '150ms',
		slow: '300ms',
	},
};
