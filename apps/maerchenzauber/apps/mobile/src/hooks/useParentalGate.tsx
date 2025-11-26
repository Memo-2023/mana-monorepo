import { useState } from 'react';
import { Linking } from 'react-native';

/**
 * Hook to manage parental gate flow
 *
 * Usage:
 * const { ParentalGateComponent, requestParentalPermission } = useParentalGate();
 *
 * // In your component:
 * <ParentalGateComponent />
 *
 * // When you need parental permission:
 * const handleAction = async () => {
 *   const granted = await requestParentalPermission({
 *     title: 'Custom Title',
 *     message: 'Custom Message'
 *   });
 *
 *   if (granted) {
 *     // Proceed with action
 *   }
 * };
 */
export const useParentalGate = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [config, setConfig] = useState<{
    title?: string;
    message?: string;
    onSuccess?: () => void;
  }>({});

  /**
   * Request parental permission
   * Returns a promise that resolves to true if permission granted, false if cancelled
   */
  const requestParentalPermission = (options?: {
    title?: string;
    message?: string;
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfig({
        title: options?.title,
        message: options?.message,
        onSuccess: () => {
          setIsVisible(false);
          resolve(true);
        },
      });
      setIsVisible(true);

      // Store cancel handler
      const cancelHandler = () => {
        setIsVisible(false);
        resolve(false);
      };

      // Update config with cancel handler
      setConfig((prev) => ({
        ...prev,
        onSuccess: () => {
          setIsVisible(false);
          resolve(true);
        },
      }));
    });
  };

  /**
   * Open external link with parental gate
   */
  const openExternalLinkWithGate = async (
    url: string,
    options?: { title?: string; message?: string }
  ) => {
    const granted = await requestParentalPermission({
      title: options?.title || 'Externe Seite öffnen',
      message:
        options?.message ||
        'Um diese externe Seite zu öffnen, löse bitte diese Rechenaufgabe:',
    });

    if (granted) {
      await Linking.openURL(url);
    }
  };

  /**
   * Open email with parental gate
   */
  const openEmailWithGate = async (
    email: string,
    subject?: string,
    body?: string,
    options?: { title?: string; message?: string }
  ) => {
    const granted = await requestParentalPermission({
      title: options?.title || 'E-Mail senden',
      message:
        options?.message ||
        'Um eine E-Mail zu senden, löse bitte diese Rechenaufgabe:',
    });

    if (granted) {
      let emailUrl = `mailto:${email}`;
      const params: string[] = [];

      if (subject) {
        params.push(`subject=${encodeURIComponent(subject)}`);
      }
      if (body) {
        params.push(`body=${encodeURIComponent(body)}`);
      }

      if (params.length > 0) {
        emailUrl += `?${params.join('&')}`;
      }

      await Linking.openURL(emailUrl);
    }
  };

  return {
    isVisible,
    config,
    setIsVisible,
    requestParentalPermission,
    openExternalLinkWithGate,
    openEmailWithGate,
  };
};
