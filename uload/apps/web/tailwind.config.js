/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				theme: {
					primary: 'var(--theme-primary)',
					'primary-hover': 'var(--theme-primary-hover)',
					background: 'var(--theme-background)',
					surface: 'var(--theme-surface)',
					'surface-hover': 'var(--theme-surface-hover)',
					text: 'var(--theme-text)',
					'text-muted': 'var(--theme-text-muted)',
					border: 'var(--theme-border)',
					accent: 'var(--theme-accent)',
					'accent-hover': 'var(--theme-accent-hover)'
				}
			}
		}
	},
	plugins: []
};
