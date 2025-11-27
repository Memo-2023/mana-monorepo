import {
  authApi,
  getToken,
  getStoredUser,
  clearAuth,
  type User,
  type ApiError,
} from '../api/client';

/**
 * Service zur Verwaltung der Benutzerauthentifizierung mit Mana Core Auth
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
      await authApi.register(email, password, name || email.split('@')[0]);
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
      await authApi.login(email, password);
      return true;
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
      await authApi.logout();
      return true;
    } catch (error) {
      console.error('Fehler bei der Abmeldung:', error);
      clearAuth();
      return true; // Always clear local auth even if API fails
    }
  }

  /**
   * Prüft, ob ein Benutzer angemeldet ist
   * @returns Der angemeldete Benutzer oder null, wenn kein Benutzer angemeldet ist
   */
  static getCurrentUser(): User | null {
    try {
      const token = getToken();
      if (!token) return null;
      return getStoredUser();
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
      await authApi.resetPassword(email);
      return true;
    } catch (error) {
      console.error('Fehler beim Zurücksetzen des Passworts:', error);
      return false;
    }
  }

  /**
   * Aktualisiert automatisch das Auth-Token
   * @returns true, wenn das Token erfolgreich aktualisiert wurde, sonst false
   */
  static async refreshAuth(): Promise<boolean> {
    try {
      await authApi.refreshAuth();
      return true;
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
    return !!getToken();
  }

  /**
   * Gibt die User-ID des aktuell angemeldeten Benutzers zurück
   * @returns Die User-ID oder null
   */
  static getUserId(): string | null {
    const user = getStoredUser();
    return user?.userId || null;
  }

  /**
   * Gibt die E-Mail des aktuell angemeldeten Benutzers zurück
   * @returns Die E-Mail oder null
   */
  static getUserEmail(): string | null {
    const user = getStoredUser();
    return user?.email || null;
  }
}

// Default export für Kompatibilität
export default AuthService;
