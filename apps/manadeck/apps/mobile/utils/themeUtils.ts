import { useCurrentColors } from '~/store/themeStore';
import { themes } from '~/themes';

export function useThemeColors() {
	const currentColors = useCurrentColors();

	// Fallback to default theme if currentColors is undefined
	const safeColors = currentColors || themes.default.light;

	return {
		// Convert RGB strings to hex for React Native compatibility
		background: `rgb(${safeColors.background})`,
		foreground: `rgb(${safeColors.foreground})`,
		card: `rgb(${safeColors.surface})`, // Use surface color for cards
		surface: `rgb(${safeColors.surface})`,
		surfaceElevated: `rgb(${safeColors.surfaceElevated})`,
		muted: `rgb(${safeColors.muted})`,
		mutedForeground: `rgb(${safeColors.mutedForeground})`,
		primary: `rgb(${safeColors.primary})`,
		primaryForeground: `rgb(${safeColors.primaryForeground})`,
		secondary: `rgb(${safeColors.secondary})`,
		secondaryForeground: `rgb(${safeColors.secondaryForeground})`,
		accent: `rgb(${safeColors.accent})`,
		accentForeground: `rgb(${safeColors.accentForeground})`,
		destructive: `rgb(${safeColors.destructive})`,
		destructiveForeground: `rgb(${safeColors.destructiveForeground})`,
		border: `rgb(${safeColors.border})`,
		input: `rgb(${safeColors.input})`,
		ring: `rgb(${safeColors.ring})`,
	};
}
