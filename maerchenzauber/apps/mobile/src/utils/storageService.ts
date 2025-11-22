import { storage } from './storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const storageService = {
  /**
   * Get an authenticated URL for a private image in the user-uploads bucket
   * @param path The path to the image in the bucket
   * @returns An authenticated URL that can be used to access the image
   */
  async getAuthenticatedImageUrl(path: string): Promise<string> {
    try {
      // Extract just the path from full URL if needed
      let cleanPath = path;
      if (path.includes('/storage/v1/object/')) {
        // Extract path after /public/ or /authenticated/
        const matches = path.match(/\/storage\/v1\/object\/(?:public|authenticated)\/[^/]+\/(.+)/);
        if (matches && matches[1]) {
          cleanPath = matches[1];
        }
      }

      // Get the auth token from secure storage (using the correct key)
      const token = await storage.getItem('appToken');
      if (!token) {
        console.error('No auth token available for authenticated URL');
        return path; // Return original URL as fallback
      }

      // Return the authenticated URL with the token as a header
      // The Image component will need to pass this token in headers
      return `${SUPABASE_URL}/storage/v1/object/authenticated/user-uploads/${cleanPath}`;
    } catch (error) {
      console.error('Error getting authenticated URL:', error);
      return path; // Return original URL as fallback
    }
  },

  /**
   * Get headers for authenticated image requests
   */
  async getAuthHeaders(): Promise<HeadersInit> {
    const token = await storage.getItem('appToken');
    if (!token) {
      return {};
    }
    
    return {
      'Authorization': `Bearer ${token}`,
      'apikey': SUPABASE_ANON_KEY || '',
    };
  },

  /**
   * Process an image URL to get the appropriate URL for display
   * @param url The original image URL
   * @returns A URL that can be used to display the image
   */
  async getDisplayUrl(url: string): Promise<string> {
    if (!url) return '';
    
    // If it's already a signed URL or an authenticated URL, return it
    if (url.includes('/sign/') || url.includes('?token=') || url.includes('/authenticated/')) {
      return url;
    }

    // If it's a user-uploads bucket URL (public or authenticated), convert to authenticated
    if (url.includes('/user-uploads/')) {
      return this.getAuthenticatedImageUrl(url);
    }

    // For other URLs, return as-is
    return url;
  }
};