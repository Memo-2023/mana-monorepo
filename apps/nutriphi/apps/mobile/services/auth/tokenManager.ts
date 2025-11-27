import * as SecureStore from 'expo-secure-store';

const STORAGE_KEYS = {
  APP_TOKEN: 'nutriphi_app_token',
  REFRESH_TOKEN: 'nutriphi_refresh_token',
  USER_EMAIL: 'nutriphi_user_email',
};

/**
 * Token Manager for secure storage of authentication tokens
 * Uses Expo SecureStore for encrypted storage on device
 */
export const tokenManager = {
  /**
   * Get the app token (JWT)
   */
  async getAppToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.APP_TOKEN);
    } catch (error) {
      console.error('Error getting app token:', error);
      return null;
    }
  },

  /**
   * Set the app token
   */
  async setAppToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.APP_TOKEN, token);
    } catch (error) {
      console.error('Error setting app token:', error);
      throw error;
    }
  },

  /**
   * Get the refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  },

  /**
   * Set the refresh token
   */
  async setRefreshToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, token);
    } catch (error) {
      console.error('Error setting refresh token:', error);
      throw error;
    }
  },

  /**
   * Get the user email
   */
  async getUserEmail(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.USER_EMAIL);
    } catch (error) {
      console.error('Error getting user email:', error);
      return null;
    }
  },

  /**
   * Set the user email
   */
  async setUserEmail(email: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_EMAIL, email);
    } catch (error) {
      console.error('Error setting user email:', error);
      throw error;
    }
  },

  /**
   * Clear all tokens (logout)
   */
  async clearTokens(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(STORAGE_KEYS.APP_TOKEN),
        SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
        SecureStore.deleteItemAsync(STORAGE_KEYS.USER_EMAIL),
      ]);
    } catch (error) {
      console.error('Error clearing tokens:', error);
      throw error;
    }
  },

  /**
   * Get Authorization header for API requests
   */
  async getAuthHeader(): Promise<{ Authorization: string } | Record<string, never>> {
    const token = await this.getAppToken();
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  },

  /**
   * Check if user has tokens stored
   */
  async hasTokens(): Promise<boolean> {
    const token = await this.getAppToken();
    return !!token;
  },
};
