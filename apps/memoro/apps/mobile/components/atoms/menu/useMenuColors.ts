import { useTheme } from '~/features/theme/ThemeProvider';

export function useMenuColors() {
	const { isDark } = useTheme();

	return {
		isDark,
		menuBg: isDark ? 'rgba(30, 30, 30, 0.98)' : 'rgba(250, 250, 250, 0.98)',
		textColor: isDark ? '#FFFFFF' : '#000000',
		separatorColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
		borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
		separatorBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
	};
}
