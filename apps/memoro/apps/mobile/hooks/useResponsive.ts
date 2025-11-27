import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

const BREAKPOINTS = {
	mobile: 640,
	tablet: 768,
	desktop: 1024,
	wide: 1440,
} as const;

export function useResponsive() {
	const [dimensions, setDimensions] = useState(() => {
		const { width, height } = Dimensions.get('window');
		return { width, height };
	});

	useEffect(() => {
		if (Platform.OS !== 'web') return;

		const updateDimensions = () => {
			const { width, height } = Dimensions.get('window');
			setDimensions({ width, height });
		};

		const subscription = Dimensions.addEventListener('change', updateDimensions);
		return () => subscription?.remove();
	}, []);

	const { width } = dimensions;

	return {
		width,
		height: dimensions.height,
		isMobile: width < BREAKPOINTS.tablet,
		isTablet: width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop,
		isDesktop: width >= BREAKPOINTS.desktop,
		isWide: width >= BREAKPOINTS.wide,
		breakpoint:
			width < BREAKPOINTS.tablet
				? 'mobile'
				: width < BREAKPOINTS.desktop
					? 'tablet'
					: width < BREAKPOINTS.wide
						? 'desktop'
						: 'wide',
	};
}
