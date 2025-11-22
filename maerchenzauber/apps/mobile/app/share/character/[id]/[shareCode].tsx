import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * Deep link handler for character sharing with share code
 * Route: maerchenzauber://share/character/{id}/{shareCode}
 *
 * IMPORTANT: Uses immediate Redirect to completely bypass react-native-screens
 * snapshot creation which causes crashes on iOS during deeplink navigation
 */
export default function ShareCharacterWithCodeDeeplink() {
  const { id, shareCode } = useLocalSearchParams<{
    id: string;
    shareCode: string;
  }>();

  console.log(
    '[ShareDeeplink] Deeplink opened with ID:',
    id,
    'ShareCode:',
    shareCode,
  );

  // Immediate redirect - no loading screen, no snapshots, no crashes
  if (!id) {
    console.error('[ShareDeeplink] No ID provided, redirecting to home');
    return <Redirect href="/(tabs)/(story)" />;
  }

  // Redirect to preview with share code
  const previewUrl = shareCode
    ? `/character/preview/${id}?shareCode=${shareCode}`
    : `/character/preview/${id}`;

  console.log('[ShareDeeplink] Redirecting to preview:', previewUrl);
  return <Redirect href={previewUrl} />;
}
