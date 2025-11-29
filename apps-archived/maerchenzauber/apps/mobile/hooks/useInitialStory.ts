import { useEffect, useState } from 'react';

export const useInitialStory = () => {
	const [initializing, setInitializing] = useState(false);

	useEffect(() => {
		// Initial story creation is now handled through the backend API
		// Users will create stories manually through the UI
		setInitializing(false);
	}, []);

	return { initializing };
};
