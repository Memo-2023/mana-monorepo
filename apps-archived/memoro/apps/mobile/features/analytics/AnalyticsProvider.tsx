import React, { useEffect, type ReactNode } from 'react';
import { multiPlatformAnalytics } from './services/multiPlatformAnalytics';

interface AnalyticsProviderProps {
	children: ReactNode;
}

const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
	useEffect(() => {
		multiPlatformAnalytics.initialize();
	}, []);

	return <>{children}</>;
};

export default AnalyticsProvider;
