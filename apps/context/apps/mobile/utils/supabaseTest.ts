import { supabase } from './supabase';

/**
 * Testet die Verbindung zu Supabase
 * @returns Ein Promise mit dem Ergebnis des Tests
 */
export const testSupabaseConnection = async () => {
	try {
		// Einfache Abfrage, um zu testen, ob die Verbindung funktioniert
		// Verwende eine einfache Systemabfrage, die keine RLS-Richtlinien auslöst
		const { data, error } = await supabase.auth.getSession();

		if (error) {
			return {
				success: false,
				message: `Fehler bei der Verbindung zu Supabase: ${error.message}`,
				error,
			};
		}

		return {
			success: true,
			message: 'Verbindung zu Supabase erfolgreich hergestellt!',
			data,
		};
	} catch (err: any) {
		return {
			success: false,
			message: `Unerwarteter Fehler: ${err.message}`,
			error: err,
		};
	}
};

/**
 * Testet die Authentifizierung mit Supabase
 * @param email E-Mail-Adresse
 * @param password Passwort
 * @returns Ein Promise mit dem Ergebnis des Tests
 */
export const testSupabaseAuth = async (email: string, password: string) => {
	try {
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			return {
				success: false,
				message: `Fehler bei der Authentifizierung: ${error.message}`,
				error,
			};
		}

		return {
			success: true,
			message: 'Authentifizierung erfolgreich!',
			user: data.user,
			session: data.session,
		};
	} catch (err: any) {
		return {
			success: false,
			message: `Unerwarteter Fehler: ${err.message}`,
			error: err,
		};
	}
};

/**
 * Ruft alle Spaces aus der Datenbank ab
 * @returns Ein Promise mit dem Ergebnis der Abfrage
 */
export const fetchAllSpaces = async () => {
	try {
		// Verwende eine Abfrage mit einer expliziten Bedingung, um RLS-Probleme zu vermeiden
		// Hier verwenden wir eine Abfrage, die nur öffentliche Spaces abruft oder Spaces, bei denen der Benutzer Mitglied ist
		const { data: session } = await supabase.auth.getSession();

		// Wenn der Benutzer angemeldet ist, rufe seine Spaces ab
		if (session?.session?.user) {
			const userId = session.session.user.id;

			const { data, error } = await supabase
				.from('spaces')
				.select('id, name, description, created_at')
				.or(`created_by.eq.${userId},public.eq.true`);

			if (error) {
				return {
					success: false,
					message: `Fehler beim Abrufen der Spaces: ${error.message}`,
					error,
				};
			}

			return {
				success: true,
				message: `${data?.length || 0} Spaces erfolgreich abgerufen`,
				spaces: data || [],
			};
		} else {
			// Wenn kein Benutzer angemeldet ist, gib eine leere Liste zurück
			return {
				success: true,
				message: 'Keine Spaces gefunden (nicht angemeldet)',
				spaces: [],
			};
		}
	} catch (err: any) {
		return {
			success: false,
			message: `Unerwarteter Fehler: ${err.message}`,
			error: err,
		};
	}
};
