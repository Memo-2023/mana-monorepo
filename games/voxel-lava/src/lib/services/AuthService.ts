import { pb } from '../pocketbase';

/**
 * Service zur Verwaltung der Benutzerauthentifizierung mit PocketBase
 */
export class AuthService {
  /**
   * Registriert einen neuen Benutzer
   * @param email E-Mail-Adresse des Benutzers
   * @param password Passwort des Benutzers
   * @param name Name des Benutzers (optional)
   * @returns true, wenn die Registrierung erfolgreich war, sonst false
   */
  static async register(email: string, password: string, name?: string): Promise<boolean> {
    try {
      const data = {
        email,
        password,
        passwordConfirm: password,
        name: name || email.split('@')[0],
        emailVisibility: true
      };

      const record = await pb.collection('users').create(data);
      
      // Automatisch anmelden nach erfolgreicher Registrierung
      await pb.collection('users').authWithPassword(email, password);
      
      return true;
    } catch (error) {
      console.error('Fehler bei der Registrierung:', error);
      return false;
    }
  }

  /**
   * Meldet einen Benutzer an
   * @param email E-Mail-Adresse des Benutzers
   * @param password Passwort des Benutzers
   * @returns true, wenn die Anmeldung erfolgreich war, sonst false
   */
  static async login(email: string, password: string): Promise<boolean> {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password);
      return !!authData.token;
    } catch (error) {
      console.error('Fehler bei der Anmeldung:', error);
      return false;
    }
  }

  /**
   * Meldet den aktuellen Benutzer ab
   * @returns true, wenn die Abmeldung erfolgreich war, sonst false
   */
  static async logout(): Promise<boolean> {
    try {
      pb.authStore.clear();
      return true;
    } catch (error) {
      console.error('Fehler bei der Abmeldung:', error);
      return false;
    }
  }

  /**
   * Prüft, ob ein Benutzer angemeldet ist
   * @returns Der angemeldete Benutzer oder null, wenn kein Benutzer angemeldet ist
   */
  static getCurrentUser() {
    try {
      if (pb.authStore.isValid) {
        return pb.authStore.model;
      }
      return null;
    } catch (error) {
      console.error('Fehler beim Abrufen des aktuellen Benutzers:', error);
      return null;
    }
  }

  /**
   * Sendet eine E-Mail zum Zurücksetzen des Passworts
   * @param email E-Mail-Adresse des Benutzers
   * @returns true, wenn die E-Mail erfolgreich gesendet wurde, sonst false
   */
  static async resetPassword(email: string): Promise<boolean> {
    try {
      await pb.collection('users').requestPasswordReset(email);
      return true;
    } catch (error) {
      console.error('Fehler beim Zurücksetzen des Passworts:', error);
      return false;
    }
  }

  /**
   * Aktualisiert das Passwort des aktuellen Benutzers
   * @param newPassword Das neue Passwort
   * @returns true, wenn das Passwort erfolgreich aktualisiert wurde, sonst false
   */
  static async updatePassword(newPassword: string): Promise<boolean> {
    try {
      const user = pb.authStore.model;
      if (!user) {
        throw new Error('Kein Benutzer angemeldet');
      }

      await pb.collection('users').update(user.id, {
        password: newPassword,
        passwordConfirm: newPassword
      });
      
      return true;
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Passworts:', error);
      return false;
    }
  }

  /**
   * Aktualisiert automatisch das Auth-Token
   * @returns true, wenn das Token erfolgreich aktualisiert wurde, sonst false
   */
  static async refreshAuth(): Promise<boolean> {
    try {
      if (pb.authStore.isValid) {
        await pb.collection('users').authRefresh();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Auth-Tokens:', error);
      return false;
    }
  }

  /**
   * Überprüft, ob die aktuelle Sitzung gültig ist
   * @returns true, wenn die Sitzung gültig ist, sonst false
   */
  static isAuthenticated(): boolean {
    return pb.authStore.isValid;
  }

  /**
   * Gibt die User-ID des aktuell angemeldeten Benutzers zurück
   * @returns Die User-ID oder null
   */
  static getUserId(): string | null {
    const user = pb.authStore.model;
    return user?.id || null;
  }

  /**
   * Gibt die E-Mail des aktuell angemeldeten Benutzers zurück
   * @returns Die E-Mail oder null
   */
  static getUserEmail(): string | null {
    const user = pb.authStore.model;
    return user?.email || null;
  }
}

// Default export für Kompatibilität
export default AuthService;