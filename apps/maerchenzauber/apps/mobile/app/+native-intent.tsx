import { Redirect } from 'expo-router';
import * as Linking from 'expo-linking';

/**
 * Deep Link Fallback Handler for Expo Router
 *
 * IMPORTANT: This file only handles deeplinks that DON'T match file-based routes.
 * For deeplinks that match file routes (like share/character/[id].tsx),
 * Expo Router will route to those files automatically.
 *
 * This handler is only used as a fallback for unmatched deeplink patterns.
 *
 * Known deeplinks handled by file routes:
 * - maerchenzauber://share/character/{id} → app/share/character/[id].tsx
 *
 * Add future deeplink handling here only if they don't match file routes.
 */
export default function NativeIntent() {
  const url = Linking.useURL();

  if (!url) {
    return <Redirect href="/(tabs)/(story)" />;
  }

  const { hostname, path, queryParams } = Linking.parse(url);

  console.log('[DeepLink Fallback] Received unmatched URL:', url);
  console.log('[DeepLink Fallback] Hostname:', hostname);
  console.log('[DeepLink Fallback] Path:', path);
  console.log('[DeepLink Fallback] Query Params:', queryParams);

  // Add custom deeplink handling here for patterns that don't match file routes
  // Example:
  // if (hostname === 'special-action') {
  //   return <Redirect href="/some-screen" />;
  // }

  // Default fallback - redirect to home
  console.log('[DeepLink Fallback] No custom handler, redirecting to home');
  return <Redirect href="/(tabs)/(story)" />;
}
