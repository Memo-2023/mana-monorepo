import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

type AuthContextType = {
	user: User | null;
	session: Session | null;
	loading: boolean;
	signUp: (email: string, password: string) => Promise<{ error: any }>;
	signIn: (email: string, password: string) => Promise<{ error: any }>;
	signOut: () => Promise<{ error: any }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [user, setUser] = useState<User | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Lade den aktuellen Benutzer beim Start
		const loadUser = async () => {
			const { data } = await supabase.auth.getSession();
			setSession(data.session);
			setUser(data.session?.user || null);
			setLoading(false);

			// Abonniere Authentifizierungsänderungen
			const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
				setSession(session);
				setUser(session?.user || null);
				setLoading(false);
			});

			return () => {
				authListener.subscription.unsubscribe();
			};
		};

		loadUser();
	}, []);

	const signUp = async (email: string, password: string) => {
		try {
			const { error } = await supabase.auth.signUp({ email, password });
			return { error };
		} catch (error) {
			return { error };
		}
	};

	const signIn = async (email: string, password: string) => {
		try {
			const { error } = await supabase.auth.signInWithPassword({ email, password });
			return { error };
		} catch (error) {
			return { error };
		}
	};

	const signOut = async () => {
		try {
			const { error } = await supabase.auth.signOut();
			return { error };
		} catch (error) {
			return { error };
		}
	};

	const value = {
		user,
		session,
		loading,
		signUp,
		signIn,
		signOut,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};
