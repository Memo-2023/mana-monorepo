import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useFirstVisit = (pageId: string) => {
	const [isFirstVisit, setIsFirstVisit] = useState(true);
	const [showAllTooltips, setShowAllTooltips] = useState(false);

	useEffect(() => {
		const checkFirstVisit = async () => {
			try {
				const visited = await AsyncStorage.getItem(`visited_${pageId}`);
				if (!visited) {
					setShowAllTooltips(true);
					await AsyncStorage.setItem(`visited_${pageId}`, 'true');
				}
				setIsFirstVisit(false);
			} catch (error) {
				console.error('Error checking first visit:', error);
			}
		};

		checkFirstVisit();
	}, [pageId]);

	return { isFirstVisit, showAllTooltips };
};
