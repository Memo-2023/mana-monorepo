import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';

// Definiere den Typ für den Authentifizierungskontext
type AuthContextType = {
	session: Session | null;
	user: User | null;
	loading: boolean;
	signIn: (
		email: string,
		password: string
	) => Promise<{
		success: boolean;
		error?: string;
	}>;
	signUp: (
		email: string,
		password: string,
		name: string
	) => Promise<{
		success: boolean;
		error?: string;
	}>;
	signOut: () => Promise<void>;
	resetPassword: (email: string) => Promise<{
		success: boolean;
		error?: string;
	}>;
};

// Erstelle den Authentifizierungskontext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider-Komponente für den Authentifizierungskontext
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [session, setSession] = useState<Session | null>(null);
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	// Initialisiere die Authentifizierung beim Laden der App
	useEffect(() => {
		// Hole die aktuelle Session
		const getSession = async () => {
			try {
				const { data } = await supabase.auth.getSession();
				setSession(data.session);
				setUser(data.session?.user || null);
			} catch (error) {
				console.error('Fehler beim Abrufen der Session:', error);
			} finally {
				setLoading(false);
			}
		};

		getSession();

		// Abonniere Änderungen an der Authentifizierung
		const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
			setSession(newSession);
			setUser(newSession?.user || null);
			setLoading(false);
		});

		// Bereinige den Listener beim Unmount
		return () => {
			authListener?.subscription.unsubscribe();
		};
	}, []);

	// Anmeldung mit E-Mail und Passwort
	const signIn = async (email: string, password: string) => {
		try {
			const { data, error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});

			if (error) {
				return { success: false, error: error.message };
			}

			return { success: true };
		} catch (error: any) {
			return { success: false, error: error.message };
		}
	};

	// Registrierung mit E-Mail und Passwort
	const signUp = async (email: string, password: string, name: string) => {
		try {
			// Registriere den Benutzer
			const { data, error } = await supabase.auth.signUp({
				email,
				password,
				options: {
					data: {
						name,
					},
				},
			});

			if (error) {
				return { success: false, error: error.message };
			}

			// Wenn die Registrierung erfolgreich war, aber eine E-Mail-Bestätigung erforderlich ist
			if (data?.user && !data.user.confirmed_at) {
				return {
					success: true,
					error: 'Bitte bestätige deine E-Mail-Adresse, um die Registrierung abzuschließen.',
				};
			}

			// Erstelle einen Eintrag in der users-Tabelle
			if (data?.user) {
				const { error: profileError } = await supabase.from('users').insert([
					{
						id: data.user.id,
						email: data.user.email,
						name,
						created_at: new Date().toISOString(),
					},
				]);

				if (profileError) {
					return { success: false, error: profileError.message };
				}
			}

			return { success: true };
		} catch (error: any) {
			return { success: false, error: error.message };
		}
	};

	// Abmeldung
	const signOut = async () => {
		await supabase.auth.signOut();
	};

	// Passwort zurücksetzen
	const resetPassword = async (email: string) => {
		try {
			const { error } = await supabase.auth.resetPasswordForEmail(email, {
				redirectTo: 'exp://localhost:8081/reset-password',
			});

			if (error) {
				return { success: false, error: error.message };
			}

			return {
				success: true,
				error: 'Bitte überprüfe deine E-Mails für weitere Anweisungen.',
			};
		} catch (error: any) {
			return { success: false, error: error.message };
		}
	};

	// Werte, die über den Kontext bereitgestellt werden
	const value: AuthContextType = {
		session,
		user,
		loading,
		signIn,
		signUp,
		signOut,
		resetPassword,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook für den einfachen Zugriff auf den Authentifizierungskontext
export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth muss innerhalb eines AuthProviders verwendet werden');
	}
	return context;
};
