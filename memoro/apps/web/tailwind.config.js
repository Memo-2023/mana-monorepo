/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				// Mana - Consistent color for subscription page
				mana: '#4287f5',
				// Lume Theme - Modern Gold & Dark
				lume: {
					primary: '#f8d62b',
					primaryButton: '#f8d62b',
					primaryButtonText: '#000000',
					secondary: '#D4B200',
					secondaryButton: '#FFE9A3',
					contentBackground: '#ffffff',
					contentBackgroundHover: '#f5f5f5',
					contentPageBackground: '#ffffff',
					menuBackground: '#dddddd',
					menuBackgroundHover: '#cccccc',
					pageBackground: '#dddddd',
					text: '#2c2c2c',
					borderLight: '#f2f2f2',
					border: '#e6e6e6',
					borderStrong: '#cccccc',
					error: '#e74c3c'
				},
				// Nature Theme - Soothing Green
				nature: {
					primary: '#4CAF50',
					primaryButton: '#A08500',
					primaryButtonText: '#ffffff',
					secondary: '#81C784',
					secondaryButton: '#F1F8E9',
					contentBackground: '#F1F8E9',
					contentBackgroundHover: '#E8F5E9',
					contentPageBackground: '#ffffff',
					menuBackground: '#E8F5E9',
					menuBackgroundHover: '#C8E6C9',
					pageBackground: '#FBFDF8',
					text: '#1B5E20',
					borderLight: '#E8F5E9',
					border: '#C8E6C9',
					borderStrong: '#A5D6A7',
					error: '#E57373'
				},
				// Stone Theme - Elegant Slate
				stone: {
					primary: '#607D8B',
					primaryButton: '#FF9500',
					primaryButtonText: '#000000',
					secondary: '#90A4AE',
					secondaryButton: '#ECEFF1',
					contentBackground: '#ECEFF1',
					contentBackgroundHover: '#E0E6EA',
					contentPageBackground: '#ffffff',
					menuBackground: '#E0E6EA',
					menuBackgroundHover: '#CFD8DC',
					pageBackground: '#F5F7F9',
					text: '#263238',
					borderLight: '#ECEFF1',
					border: '#CFD8DC',
					borderStrong: '#B0BEC5',
					error: '#EF5350'
				},
				// Ocean Theme - Tranquil Blue
				ocean: {
					primary: '#039BE5',
					primaryButton: '#FF9500',
					primaryButtonText: '#000000',
					secondary: '#4FC3F7',
					secondaryButton: '#E1F5FE',
					contentBackground: '#E1F5FE',
					contentBackgroundHover: '#B3E5FC',
					contentPageBackground: '#ffffff',
					menuBackground: '#E1F5FE',
					menuBackgroundHover: '#B3E5FC',
					pageBackground: '#F5FCFF',
					text: '#01579B',
					borderLight: '#E1F5FE',
					border: '#B3E5FC',
					borderStrong: '#81D4FA',
					error: '#EF5350'
				},
				// Dark Mode Variants
				dark: {
					lume: {
						primary: '#f8d62b',
						primaryButton: '#7C6B16',
						primaryButtonText: '#ffffff',
						secondary: '#D4B200',
						secondaryButton: '#1E1E1E',
						contentBackground: '#1E1E1E',
						contentBackgroundHover: '#333333',
						contentPageBackground: '#121212',
						menuBackground: '#101010',
						menuBackgroundHover: '#333333',
						pageBackground: '#101010',
						text: '#ffffff',
						borderLight: '#333333',
						border: '#424242',
						borderStrong: '#616161',
						error: '#e74c3c'
					},
					nature: {
						primary: '#4CAF50',
						primaryButton: '#FF9500',
						primaryButtonText: '#000000',
						secondary: '#81C784',
						secondaryButton: '#1E1E1E',
						contentBackground: '#1E1E1E',
						contentBackgroundHover: '#2E7D32',
						contentPageBackground: '#121212',
						menuBackground: '#252525',
						menuBackgroundHover: '#2E7D32',
						pageBackground: '#121212',
						text: '#FFFFFF',
						borderLight: '#1B5E20',
						border: '#2E7D32',
						borderStrong: '#388E3C',
						error: '#CF6679'
					},
					stone: {
						primary: '#78909C',
						primaryButton: '#FF9500',
						primaryButtonText: '#000000',
						secondary: '#90A4AE',
						secondaryButton: '#1E1E1E',
						contentBackground: '#1E1E1E',
						contentBackgroundHover: '#37474F',
						contentPageBackground: '#121212',
						menuBackground: '#252525',
						menuBackgroundHover: '#37474F',
						pageBackground: '#121212',
						text: '#FFFFFF',
						borderLight: '#37474F',
						border: '#455A64',
						borderStrong: '#546E7A',
						error: '#CF6679'
					},
					ocean: {
						primary: '#039BE5',
						primaryButton: '#FF9500',
						primaryButtonText: '#000000',
						secondary: '#4FC3F7',
						secondaryButton: '#1E1E1E',
						contentBackground: '#1E1E1E',
						contentBackgroundHover: '#0277BD',
						contentPageBackground: '#121212',
						menuBackground: '#252525',
						menuBackgroundHover: '#0277BD',
						pageBackground: '#121212',
						text: '#FFFFFF',
						borderLight: '#01579B',
						border: '#0277BD',
						borderStrong: '#0288D1',
						error: '#CF6679'
					}
				}
			}
		}
	},
	plugins: [require('@tailwindcss/typography')]
};
