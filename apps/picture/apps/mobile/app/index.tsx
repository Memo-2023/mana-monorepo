import { Redirect } from 'expo-router';

export default function Index() {
	// Redirect to tabs when app starts
	return <Redirect href="/(tabs)" />;
}
