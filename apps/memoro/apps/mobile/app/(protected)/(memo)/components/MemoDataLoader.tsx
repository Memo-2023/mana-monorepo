import React from 'react';
import { MemoDetailSkeleton } from '~/components/skeletons/MemoDetailSkeleton';
import { useTheme } from '~/features/theme/ThemeProvider';

interface MemoDataLoaderProps {
	isLoading: boolean;
	children: React.ReactNode;
}

export default function MemoDataLoader({ isLoading, children }: MemoDataLoaderProps) {
	const { isDark } = useTheme();

	if (isLoading) {
		return <MemoDetailSkeleton />;
	}

	return <>{children}</>;
}
