import { usePostHog as usePostHogNative } from 'posthog-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';

export function usePostHog() {
  const client = usePostHogNative();
  const { user } = useAuth();

  // Identify user when they log in
  useEffect(() => {
    if (user?.uid) {
      client?.identify(user.uid, {
        email: user.email,
        name: user.displayName,
      });
    }
  }, [user?.uid]);

  return client;
}
