import { useWindowDimensions } from 'react-native';

export type ScreenSize = 'small' | 'medium' | 'large' | 'xlarge';

export const useResponsive = () => {
	const { width, height } = useWindowDimensions();

	// Breakpoints
	const isSmall = width < 768; // Phone
	const isMedium = width >= 768 && width < 1024; // Tablet Portrait
	const isLarge = width >= 1024 && width < 1440; // Tablet Landscape / Small Desktop
	const isXLarge = width >= 1440; // Large Desktop / Mac

	const screenSize: ScreenSize = isSmall
		? 'small'
		: isMedium
			? 'medium'
			: isLarge
				? 'large'
				: 'xlarge';

	// Responsive values
	const maxContentWidth = isSmall ? width : isMedium ? 720 : isLarge ? 960 : 1200;
	const numColumns = isSmall ? 1 : isMedium ? 2 : isLarge ? 2 : 3;
	const horizontalPadding = isSmall ? 16 : isMedium ? 32 : 48;
	const cardAspectRatio = isSmall ? 16 / 9 : 2 / 1;

	return {
		width,
		height,
		isSmall,
		isMedium,
		isLarge,
		isXLarge,
		isTablet: isMedium || isLarge,
		isDesktop: isLarge || isXLarge,
		screenSize,
		maxContentWidth,
		numColumns,
		horizontalPadding,
		cardAspectRatio,
	};
};
