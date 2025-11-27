import { useEffect, useState } from 'react';

export const useInitialCharacter = () => {
	const [initializing, setInitializing] = useState(false);

	useEffect(() => {
		// Initial character creation is now handled through the backend API
		// Users will create characters manually through the UI
		setInitializing(false);
	}, []);

	return { initializing };
};
