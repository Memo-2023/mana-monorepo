import { supabase } from '../utils/supabase';
import { User } from '@supabase/supabase-js';

// Definiere den Typ für einen Space
export type Space = {
	id: string;
	name: string;
	description: string | null;
	created_by: string;
	created_at: string;
	settings: any | null;
};

// Definiere den Typ für einen Space mit zusätzlichen Informationen
export type SpaceWithDetails = Space & {
	document_count: number;
	tags: string[];
	members: {
		id: string;
		name: string;
		email: string;
		role: 'owner' | 'editor' | 'viewer';
	}[];
};

// Definiere den Typ für die Erstellung eines neuen Space
export type CreateSpaceParams = {
	name: string;
	description?: string;
	settings?: any;
};

// Definiere den Typ für die Aktualisierung eines Space
export type UpdateSpaceParams = {
	name?: string;
	description?: string;
	settings?: any;
};

/**
 * Ruft alle Spaces ab, auf die der aktuelle Benutzer Zugriff hat
 * @returns Promise mit einem Array von Spaces
 */
export const getSpaces = async (): Promise<{
	data: Space[] | null;
	error: Error | null;
}> => {
	try {
		// Rufe die aktuelle Session ab, um die Benutzer-ID zu erhalten
		const { data: sessionData } = await supabase.auth.getSession();
		const user = sessionData?.session?.user;

		if (!user) {
			return { data: null, error: new Error('Benutzer nicht angemeldet') };
		}

		// Rufe alle Spaces ab, bei denen der Benutzer Mitglied ist
		const { data, error } = await supabase
			.from('spaces')
			.select(
				`
        *,
        space_members!inner(user_id)
      `
			)
			.eq('space_members.user_id', user.id);

		if (error) {
			console.error('Fehler beim Abrufen der Spaces:', error);
			return { data: null, error };
		}

		return { data, error: null };
	} catch (error: any) {
		console.error('Unerwarteter Fehler beim Abrufen der Spaces:', error);
		return { data: null, error };
	}
};

/**
 * Ruft einen Space anhand seiner ID ab
 * @param id ID des Space
 * @returns Promise mit dem Space
 */
export const getSpaceById = async (
	id: string
): Promise<{
	data: SpaceWithDetails | null;
	error: Error | null;
}> => {
	try {
		// Rufe die aktuelle Session ab, um die Benutzer-ID zu erhalten
		const { data: sessionData } = await supabase.auth.getSession();
		const user = sessionData?.session?.user;

		if (!user) {
			return { data: null, error: new Error('Benutzer nicht angemeldet') };
		}

		// Rufe den Space ab
		const { data: spaceData, error: spaceError } = await supabase
			.from('spaces')
			.select(
				`
        *,
        space_members!inner(user_id)
      `
			)
			.eq('id', id)
			.eq('space_members.user_id', user.id)
			.single();

		if (spaceError) {
			console.error('Fehler beim Abrufen des Space:', spaceError);
			return { data: null, error: spaceError };
		}

		// Rufe die Anzahl der Dokumente im Space ab
		const { count: documentCount, error: countError } = await supabase
			.from('document_space')
			.select('*', { count: 'exact', head: true })
			.eq('space_id', id);

		if (countError) {
			console.error('Fehler beim Abrufen der Dokumentanzahl:', countError);
			return { data: null, error: countError };
		}

		// Rufe die Mitglieder des Space ab
		const { data: membersData, error: membersError } = await supabase
			.from('space_members')
			.select(
				`
        id,
        role,
        users (
          id,
          name,
          email
        )
      `
			)
			.eq('space_id', id);

		if (membersError) {
			console.error('Fehler beim Abrufen der Mitglieder:', membersError);
			return { data: null, error: membersError };
		}

		// Extrahiere Tags aus den Einstellungen (falls vorhanden)
		const tags = spaceData.settings?.tags || [];

		// Transformiere die Mitgliederdaten
		const members = membersData.map((member: any) => ({
			id: member.users?.id,
			name: member.users?.name,
			email: member.users?.email,
			role: member.role,
		}));

		// Erstelle das erweiterte Space-Objekt
		const spaceWithDetails: SpaceWithDetails = {
			...spaceData,
			document_count: documentCount || 0,
			tags,
			members,
		};

		return { data: spaceWithDetails, error: null };
	} catch (error: any) {
		console.error('Unerwarteter Fehler beim Abrufen des Space:', error);
		return { data: null, error };
	}
};

/**
 * Erstellt einen neuen Space
 * @param params Parameter für den neuen Space
 * @returns Promise mit dem erstellten Space
 */
export const createSpace = async (
	params: CreateSpaceParams
): Promise<{
	data: Space | null;
	error: Error | null;
}> => {
	try {
		// Rufe die aktuelle Session ab, um die Benutzer-ID zu erhalten
		const { data: sessionData } = await supabase.auth.getSession();
		const user = sessionData?.session?.user;

		if (!user) {
			return { data: null, error: new Error('Benutzer nicht angemeldet') };
		}

		// Verwende eine Transaktion mit rpc, um das Problem mit der RLS-Policy zu umgehen
		const { data, error } = await supabase.rpc('create_space_with_owner', {
			space_name: params.name,
			space_description: params.description || null,
			space_settings: params.settings || null,
			owner_id: user.id,
		});

		if (error) {
			console.error('Fehler beim Erstellen des Space:', error);
			return { data: null, error };
		}

		// Hole den neu erstellten Space
		const { data: spaceData, error: fetchError } = await supabase
			.from('spaces')
			.select('*')
			.eq('id', data.space_id)
			.single();

		if (fetchError) {
			console.error('Fehler beim Abrufen des erstellten Space:', fetchError);
			return { data: null, error: fetchError };
		}

		return { data: spaceData, error: null };
	} catch (error: any) {
		console.error('Unerwarteter Fehler beim Erstellen des Space:', error);
		return { data: null, error };
	}
};

/**
 * Aktualisiert einen Space
 * @param id ID des Space
 * @param params Parameter für die Aktualisierung
 * @returns Promise mit dem aktualisierten Space
 */
export const updateSpace = async (
	id: string,
	params: UpdateSpaceParams
): Promise<{
	data: Space | null;
	error: Error | null;
}> => {
	try {
		// Rufe die aktuelle Session ab, um die Benutzer-ID zu erhalten
		const { data: sessionData } = await supabase.auth.getSession();
		const user = sessionData?.session?.user;

		if (!user) {
			return { data: null, error: new Error('Benutzer nicht angemeldet') };
		}

		// Prüfe, ob der Benutzer Besitzer oder Editor des Space ist
		const { data: memberData, error: memberError } = await supabase
			.from('space_members')
			.select('role')
			.eq('space_id', id)
			.eq('user_id', user.id)
			.single();

		if (memberError) {
			console.error('Fehler beim Prüfen der Berechtigung:', memberError);
			return { data: null, error: memberError };
		}

		if (memberData.role !== 'owner' && memberData.role !== 'editor') {
			return {
				data: null,
				error: new Error('Keine Berechtigung zum Bearbeiten des Space'),
			};
		}

		// Erstelle ein Objekt mit den zu aktualisierenden Feldern
		const updateData: any = {};
		if (params.name !== undefined) updateData.name = params.name;
		if (params.description !== undefined) updateData.description = params.description;
		if (params.settings !== undefined) updateData.settings = params.settings;

		// Aktualisiere den Space
		const { data: spaceData, error: spaceError } = await supabase
			.from('spaces')
			.update(updateData)
			.eq('id', id)
			.select()
			.single();

		if (spaceError) {
			console.error('Fehler beim Aktualisieren des Space:', spaceError);
			return { data: null, error: spaceError };
		}

		return { data: spaceData, error: null };
	} catch (error: any) {
		console.error('Unerwarteter Fehler beim Aktualisieren des Space:', error);
		return { data: null, error };
	}
};

/**
 * Löscht einen Space
 * @param id ID des Space
 * @returns Promise mit dem Ergebnis der Löschung
 */
export const deleteSpace = async (
	id: string
): Promise<{
	success: boolean;
	error: Error | null;
}> => {
	try {
		// Rufe die aktuelle Session ab, um die Benutzer-ID zu erhalten
		const { data: sessionData } = await supabase.auth.getSession();
		const user = sessionData?.session?.user;

		if (!user) {
			return { success: false, error: new Error('Benutzer nicht angemeldet') };
		}

		// Prüfe, ob der Benutzer Besitzer des Space ist
		const { data: memberData, error: memberError } = await supabase
			.from('space_members')
			.select('role')
			.eq('space_id', id)
			.eq('user_id', user.id)
			.single();

		if (memberError) {
			console.error('Fehler beim Prüfen der Berechtigung:', memberError);
			return { success: false, error: memberError };
		}

		if (memberData.role !== 'owner') {
			return {
				success: false,
				error: new Error('Keine Berechtigung zum Löschen des Space'),
			};
		}

		// Lösche alle Mitgliedschaften für diesen Space
		const { error: membersError } = await supabase
			.from('space_members')
			.delete()
			.eq('space_id', id);

		if (membersError) {
			console.error('Fehler beim Löschen der Mitgliedschaften:', membersError);
			return { success: false, error: membersError };
		}

		// Lösche alle Dokument-Space-Verknüpfungen
		const { error: docSpaceError } = await supabase
			.from('document_space')
			.delete()
			.eq('space_id', id);

		if (docSpaceError) {
			console.error('Fehler beim Löschen der Dokument-Space-Verknüpfungen:', docSpaceError);
			return { success: false, error: docSpaceError };
		}

		// Lösche den Space
		const { error: spaceError } = await supabase.from('spaces').delete().eq('id', id);

		if (spaceError) {
			console.error('Fehler beim Löschen des Space:', spaceError);
			return { success: false, error: spaceError };
		}

		return { success: true, error: null };
	} catch (error: any) {
		console.error('Unerwarteter Fehler beim Löschen des Space:', error);
		return { success: false, error };
	}
};

/**
 * Fügt einen Benutzer zu einem Space hinzu
 * @param spaceId ID des Space
 * @param email E-Mail-Adresse des Benutzers
 * @param role Rolle des Benutzers
 * @returns Promise mit dem Ergebnis der Hinzufügung
 */
export const addMemberToSpace = async (
	spaceId: string,
	email: string,
	role: 'editor' | 'viewer'
): Promise<{
	success: boolean;
	error: Error | null;
}> => {
	try {
		// Rufe die aktuelle Session ab, um die Benutzer-ID zu erhalten
		const { data: sessionData } = await supabase.auth.getSession();
		const user = sessionData?.session?.user;

		if (!user) {
			return { success: false, error: new Error('Benutzer nicht angemeldet') };
		}

		// Prüfe, ob der Benutzer Besitzer des Space ist
		const { data: memberData, error: memberError } = await supabase
			.from('space_members')
			.select('role')
			.eq('space_id', spaceId)
			.eq('user_id', user.id)
			.single();

		if (memberError) {
			console.error('Fehler beim Prüfen der Berechtigung:', memberError);
			return { success: false, error: memberError };
		}

		if (memberData.role !== 'owner') {
			return {
				success: false,
				error: new Error('Keine Berechtigung zum Hinzufügen von Mitgliedern'),
			};
		}

		// Suche den Benutzer anhand der E-Mail-Adresse
		const { data: userData, error: userError } = await supabase
			.from('users')
			.select('id')
			.eq('email', email)
			.single();

		if (userError) {
			console.error('Fehler beim Suchen des Benutzers:', userError);
			return {
				success: false,
				error: new Error('Benutzer mit dieser E-Mail-Adresse nicht gefunden'),
			};
		}

		// Prüfe, ob der Benutzer bereits Mitglied des Space ist
		const { data: existingMember, error: existingError } = await supabase
			.from('space_members')
			.select('id')
			.eq('space_id', spaceId)
			.eq('user_id', userData.id);

		if (existingError) {
			console.error('Fehler beim Prüfen der Mitgliedschaft:', existingError);
			return { success: false, error: existingError };
		}

		if (existingMember && existingMember.length > 0) {
			return {
				success: false,
				error: new Error('Benutzer ist bereits Mitglied dieses Space'),
			};
		}

		// Füge den Benutzer zum Space hinzu
		const { error: addError } = await supabase.from('space_members').insert([
			{
				space_id: spaceId,
				user_id: userData.id,
				role,
			},
		]);

		if (addError) {
			console.error('Fehler beim Hinzufügen des Mitglieds:', addError);
			return { success: false, error: addError };
		}

		return { success: true, error: null };
	} catch (error: any) {
		console.error('Unerwarteter Fehler beim Hinzufügen des Mitglieds:', error);
		return { success: false, error };
	}
};

/**
 * Ändert die Rolle eines Mitglieds in einem Space
 * @param spaceId ID des Space
 * @param userId ID des Benutzers
 * @param newRole Neue Rolle des Benutzers
 * @returns Promise mit dem Ergebnis der Änderung
 */
export const updateMemberRole = async (
	spaceId: string,
	userId: string,
	newRole: 'owner' | 'editor' | 'viewer'
): Promise<{
	success: boolean;
	error: Error | null;
}> => {
	try {
		// Rufe die aktuelle Session ab, um die Benutzer-ID zu erhalten
		const { data: sessionData } = await supabase.auth.getSession();
		const user = sessionData?.session?.user;

		if (!user) {
			return { success: false, error: new Error('Benutzer nicht angemeldet') };
		}

		// Prüfe, ob der Benutzer Besitzer des Space ist
		const { data: memberData, error: memberError } = await supabase
			.from('space_members')
			.select('role')
			.eq('space_id', spaceId)
			.eq('user_id', user.id)
			.single();

		if (memberError) {
			console.error('Fehler beim Prüfen der Berechtigung:', memberError);
			return { success: false, error: memberError };
		}

		if (memberData.role !== 'owner') {
			return {
				success: false,
				error: new Error('Keine Berechtigung zum Ändern von Rollen'),
			};
		}

		// Wenn die neue Rolle 'owner' ist, muss der aktuelle Besitzer herabgestuft werden
		if (newRole === 'owner') {
			// Aktualisiere die Rolle des aktuellen Besitzers zu 'editor'
			const { error: updateOwnerError } = await supabase
				.from('space_members')
				.update({ role: 'editor' })
				.eq('space_id', spaceId)
				.eq('user_id', user.id);

			if (updateOwnerError) {
				console.error('Fehler beim Aktualisieren des aktuellen Besitzers:', updateOwnerError);
				return { success: false, error: updateOwnerError };
			}
		}

		// Aktualisiere die Rolle des Mitglieds
		const { error: updateError } = await supabase
			.from('space_members')
			.update({ role: newRole })
			.eq('space_id', spaceId)
			.eq('user_id', userId);

		if (updateError) {
			console.error('Fehler beim Aktualisieren der Rolle:', updateError);
			return { success: false, error: updateError };
		}

		return { success: true, error: null };
	} catch (error: any) {
		console.error('Unerwarteter Fehler beim Aktualisieren der Rolle:', error);
		return { success: false, error };
	}
};

/**
 * Entfernt ein Mitglied aus einem Space
 * @param spaceId ID des Space
 * @param userId ID des Benutzers
 * @returns Promise mit dem Ergebnis der Entfernung
 */
export const removeMemberFromSpace = async (
	spaceId: string,
	userId: string
): Promise<{
	success: boolean;
	error: Error | null;
}> => {
	try {
		// Rufe die aktuelle Session ab, um die Benutzer-ID zu erhalten
		const { data: sessionData } = await supabase.auth.getSession();
		const user = sessionData?.session?.user;

		if (!user) {
			return { success: false, error: new Error('Benutzer nicht angemeldet') };
		}

		// Prüfe, ob der Benutzer Besitzer des Space ist
		const { data: memberData, error: memberError } = await supabase
			.from('space_members')
			.select('role')
			.eq('space_id', spaceId)
			.eq('user_id', user.id)
			.single();

		if (memberError) {
			console.error('Fehler beim Prüfen der Berechtigung:', memberError);
			return { success: false, error: memberError };
		}

		if (memberData.role !== 'owner') {
			return {
				success: false,
				error: new Error('Keine Berechtigung zum Entfernen von Mitgliedern'),
			};
		}

		// Prüfe, ob der zu entfernende Benutzer nicht der Besitzer ist
		const { data: targetMemberData, error: targetMemberError } = await supabase
			.from('space_members')
			.select('role')
			.eq('space_id', spaceId)
			.eq('user_id', userId)
			.single();

		if (targetMemberError) {
			console.error('Fehler beim Prüfen des Zielmitglieds:', targetMemberError);
			return { success: false, error: targetMemberError };
		}

		if (targetMemberData.role === 'owner') {
			return {
				success: false,
				error: new Error('Der Besitzer kann nicht entfernt werden'),
			};
		}

		// Entferne das Mitglied aus dem Space
		const { error: removeError } = await supabase
			.from('space_members')
			.delete()
			.eq('space_id', spaceId)
			.eq('user_id', userId);

		if (removeError) {
			console.error('Fehler beim Entfernen des Mitglieds:', removeError);
			return { success: false, error: removeError };
		}

		return { success: true, error: null };
	} catch (error: any) {
		console.error('Unerwarteter Fehler beim Entfernen des Mitglieds:', error);
		return { success: false, error };
	}
};
