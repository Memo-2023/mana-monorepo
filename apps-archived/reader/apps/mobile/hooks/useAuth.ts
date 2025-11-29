import { useEffect, useState } from 'react';
import { supabase } from '~/utils/supabase';
import { useStore } from '~/store/store';
import { Session } from '@supabase/supabase-js';

export const useAuth = () => {
	const [session, setSession] = useState<Session | null>(null);
	const [loading, setLoading] = useState(true);
	const { setUser } = useStore();

	useEffect(() => {
		// Get initial session
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
			if (session?.user) {
				setUser({
					id: session.user.id,
					email: session.user.email!,
				});
			}
			setLoading(false);
		});

		// Listen for auth changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
			if (session?.user) {
				setUser({
					id: session.user.id,
					email: session.user.email!,
				});
			} else {
				setUser(null);
			}
		});

		return () => subscription.unsubscribe();
	}, [setUser]);

	const signUp = async (email: string, password: string) => {
		try {
			const { data, error } = await supabase.auth.signUp({
				email,
				password,
			});

			if (error) throw error;
			return { data, error: null };
		} catch (error) {
			return {
				data: null,
				error: error instanceof Error ? error.message : 'Fehler bei der Registrierung',
			};
		}
	};

	const signIn = async (email: string, password: string) => {
		try {
			const { data, error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});

			if (error) throw error;
			return { data, error: null };
		} catch (error) {
			return {
				data: null,
				error: error instanceof Error ? error.message : 'Fehler beim Anmelden',
			};
		}
	};

	const signOut = async () => {
		try {
			const { error } = await supabase.auth.signOut();
			if (error) throw error;
			return { error: null };
		} catch (error) {
			return {
				error: error instanceof Error ? error.message : 'Fehler beim Abmelden',
			};
		}
	};

	const resetPassword = async (email: string) => {
		try {
			const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
				redirectTo: 'reader://reset-password',
			});

			if (error) throw error;
			return { data, error: null };
		} catch (error) {
			return {
				data: null,
				error: error instanceof Error ? error.message : 'Fehler beim Zurücksetzen',
			};
		}
	};

	return {
		session,
		user: session?.user ?? null,
		loading,
		signUp,
		signIn,
		signOut,
		resetPassword,
	};
};
