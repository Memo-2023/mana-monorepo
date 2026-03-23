import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthProvider';

type ProtectedRouteProps = {
	children: React.ReactNode;
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
	const { user, loading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!loading && !user) {
			// Benutzer ist nicht angemeldet, leite zur Login-Seite weiter
			router.replace('/login');
		}
	}, [user, loading, router]);

	if (loading) {
		// Zeige Ladeindikator während die Authentifizierung geprüft wird
		return (
			<View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
				<ActivityIndicator size="large" color="#6366f1" />
			</View>
		);
	}

	// Wenn der Benutzer angemeldet ist, zeige die geschützten Inhalte an
	return user ? <>{children}</> : null;
};
