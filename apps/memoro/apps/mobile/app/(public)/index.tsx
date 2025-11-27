import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function PublicIndex() {
	const router = useRouter();

	useEffect(() => {
		// Redirect to login when accessing the public index
		router.replace('/(public)/login');
	}, [router]);

	// Return null while redirecting
	return null;
}
