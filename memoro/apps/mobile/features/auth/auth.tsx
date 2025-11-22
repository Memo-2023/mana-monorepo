import { useState, useEffect, useRef } from 'react';
import {
  View,
  Keyboard,
  Pressable,
  Linking,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Text from '~/components/atoms/Text';
import Input from '~/components/atoms/Input';
import Button from '~/components/atoms/Button';
import { useAuth } from '~/features/auth';
import { authService } from '~/features/auth/services/authService';
import { NotificationChannel } from '~/features/notifications/types';
import useNotification from '~/features/notifications/useNotification';
import { useTheme } from '~/features/theme/ThemeProvider';
import GoogleSignInButton from './components/GoogleSignInButton';
import AppleSignInButton from './components/AppleSignInButton';
import MemoroLogo from '~/components/atoms/MemoroLogo';
import colors from '~/tailwind.config.js';
import { useResponsive } from '~/hooks/useResponsive';
import Icon from '~/components/atoms/Icon';
import { useLanguage } from '~/features/i18n/LanguageContext';
import LanguageSelector from '~/features/i18n/LanguageSelector';

export type AuthMode =
  | 'initial'
  | 'login'
  | 'register'
  | 'login-options'
  | 'register-options'
  | 'login-email'
  | 'register-email'
  | 'forgot-password'
  | 'password-reset-success';

export default function Auth({ initialMode = 'login' }: { initialMode?: AuthMode }) {
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isLanguageSelectorVisible, setIsLanguageSelectorVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState(''); // Store email for success message

  // Hooks
  const { t } = useTranslation();
  const {
    signIn,
    signUp,
    signInWithGoogle,
    loading,
    showPasswordResetModal,
    setShowPasswordResetModal,
    authModeOverride,
    setAuthModeOverride,
  } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();
  const { isDark, themeVariant } = useTheme();
  const insets = useSafeAreaInsets();
  const { isMobile, isTablet } = useResponsive();
  const { currentLanguage, languages } = useLanguage();

  // Helper functions to simplify complex theme color access
  const getThemeColor = (colorKey: string) => {
    const themeColors = isDark
      ? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]
      : (colors as any).theme?.extend?.colors?.[themeVariant];
    return themeColors?.[colorKey];
  };

  const getPageBackground = () => getThemeColor('pageBackground');
  const getContentBackground = () => getThemeColor('contentBackground');
  const getPrimaryColor = () => getThemeColor('primary');

  // Helper for keyboard visibility
  const isKeyboardVisible = keyboardHeight > 0;

  // Debounce timer ref
  const keyboardDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Keyboard height tracking with debouncing for Android
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      if (Platform.OS === 'android') {
        // Debounce keyboard show on Android
        if (keyboardDebounceTimer.current) {
          clearTimeout(keyboardDebounceTimer.current);
        }
        keyboardDebounceTimer.current = setTimeout(() => {
          setKeyboardHeight(e.endCoordinates.height);
        }, 100);
      } else {
        setKeyboardHeight(e.endCoordinates.height);
      }
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      if (Platform.OS === 'android') {
        // Debounce keyboard hide on Android
        if (keyboardDebounceTimer.current) {
          clearTimeout(keyboardDebounceTimer.current);
        }
        keyboardDebounceTimer.current = setTimeout(() => {
          setKeyboardHeight(0);
        }, 100);
      } else {
        setKeyboardHeight(0);
      }
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
      if (keyboardDebounceTimer.current) {
        clearTimeout(keyboardDebounceTimer.current);
      }
    };
  }, []);

  // Apply auth mode override when it changes
  useEffect(() => {
    if (authModeOverride) {
      if (__DEV__) {
        console.log('Applying auth mode override:', authModeOverride);
      }
      setMode(authModeOverride as AuthMode);
      setAuthModeOverride(null); // Clear the override after applying
    }
  }, [authModeOverride, setAuthModeOverride]);

  // Clear error when input changes
  const handleEmailChange = (text: string) => {
    setEmail(text);
    setError(null);
    setSuccessMessage(null);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setError(null);
    setSuccessMessage(null);
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    setError(null);
    setSuccessMessage(null);
  };

  // Reset all form fields
  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccessMessage(null);
  };

  // Switch between auth modes
  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    setSuccessMessage(null);
  };

  // Handle login
  async function handleLogin() {
    // Dismiss keyboard
    Keyboard.dismiss();

    // Clear any previous errors
    setError(null);

    // Validate inputs
    if (!email) {
      setError(t('auth.error_email_required', 'Bitte gib deine E-Mail-Adresse ein'));
      return;
    }

    if (!password) {
      setError(t('auth.error_password_required', 'Bitte gib dein Passwort ein'));
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('auth.error_invalid_email', 'Bitte gib eine gültige E-Mail-Adresse ein'));
      return;
    }

    // Attempt to sign in and get the result
    const result = await signIn(email, password);

    // If not successful, display the error message
    if (!result.success) {
      let errorMessage =
        result.error ||
        t(
          'auth.error_invalid_credentials',
          'Ungültige Anmeldedaten. Bitte überprüfe deine E-Mail und dein Passwort.'
        );

      // Handle specific error codes with translations
      if (result.error === 'EMAIL_NOT_VERIFIED') {
        errorMessage = t(
          'auth.error_email_not_verified',
          'Bitte bestätige deine E-Mail-Adresse, um dich anzumelden. Überprüfe deinen Posteingang.'
        );
      } else if (result.error === 'INVALID_CREDENTIALS') {
        errorMessage = t(
          'auth.error_invalid_credentials',
          'Ungültige Anmeldedaten. Bitte überprüfe deine E-Mail und dein Passwort.'
        );
      } else if (result.error === 'FIREBASE_USER_PASSWORD_RESET_REQUIRED') {
        errorMessage = t(
          'auth.error_firebase_password_reset_required',
          'Aufgrund eines Systemupdates musst du dein Passwort zurücksetzen. Bitte nutze die "Passwort vergessen" Funktion.'
        );

        // Don't set error for this case - modal will be shown from AuthContext
        return; // Early return to prevent setting error below
      }

      setError(errorMessage);

      // Show error notification (except for Firebase password reset which already shows modal)
      if (result.error !== 'FIREBASE_USER_PASSWORD_RESET_REQUIRED') {
        showNotification({
          title: t('auth.login_failed', 'Anmeldung fehlgeschlagen'),
          body: errorMessage,
          channelType: NotificationChannel.FUNCTIONAL,
        });
      }
    }
  }

  // Handle registration
  async function handleRegister() {
    // Dismiss keyboard
    Keyboard.dismiss();

    // Clear any previous errors
    setError(null);

    // Validate inputs
    if (!email) {
      setError(t('auth.error_email_required', 'Bitte gib deine E-Mail-Adresse ein'));
      return;
    }

    if (!password) {
      setError(t('auth.error_password_required', 'Bitte gib dein Passwort ein'));
      return;
    }

    if (!confirmPassword) {
      setError(t('auth.error_confirm_password', 'Bitte bestätige dein Passwort'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.error_passwords_not_match', 'Passwörter stimmen nicht überein'));
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('auth.error_invalid_email', 'Bitte gib eine gültige E-Mail-Adresse ein'));
      return;
    }

    // Check password strength
    if (password.length < 8) {
      setError(
        t('auth.error_password_too_short', 'Das Passwort muss mindestens 8 Zeichen lang sein')
      );
      return;
    }

    // Check for lowercase, uppercase, digits and symbols
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSymbol = /[^a-zA-Z0-9]/.test(password);

    if (!hasLowercase || !hasUppercase || !hasDigit || !hasSymbol) {
      setError(
        t(
          'auth.error_password_requirements',
          'Das Passwort muss mindestens einen Kleinbuchstaben, einen Großbuchstaben, eine Ziffer und ein Sonderzeichen enthalten'
        )
      );
      return;
    }

    // Attempt to sign up and get the result
    const result = await signUp(email, password);

    // If not successful, display the error message
    if (!result.success) {
      const errorMessage =
        result.error ||
        t(
          'auth.error_registration_failed',
          'Registrierung fehlgeschlagen. Bitte versuche es erneut.'
        );
      setError(errorMessage);

      // Show error notification
      showNotification({
        title: t('auth.registration_failed', 'Registrierung fehlgeschlagen'),
        body: errorMessage,
        channelType: NotificationChannel.FUNCTIONAL,
      });
    } else if (result.needsVerification) {
      // Set success message for inline display
      const confirmMessage = t(
        'auth.check_email_confirmation',
        'Registrierung erfolgreich! Bitte überprüfe deine E-Mail und klicke auf den Bestätigungslink, um dein Konto zu aktivieren.'
      );
      setSuccessMessage(confirmMessage);
      
      // Show success notification for email verification
      showNotification({
        title: t('auth.registration_success', 'Registrierung erfolgreich'),
        body: confirmMessage,
        channelType: NotificationChannel.FUNCTIONAL,
      });
      
      // Clear sensitive fields but keep email to show what was registered
      setPassword('');
      setConfirmPassword('');
      // Switch to login mode so user can sign in after confirming email
      switchMode('login-email');
    } else {
      // Registration completed successfully without verification
      showNotification({
        title: t('auth.registration_success', 'Registrierung erfolgreich'),
        body: t('auth.welcome_message', 'Willkommen bei Memoro!'),
        channelType: NotificationChannel.FUNCTIONAL,
      });
    }
  }

  // Handle password reset
  async function handleForgotPassword() {
    // Dismiss keyboard
    Keyboard.dismiss();

    // Clear any previous errors
    setError(null);

    // Validate inputs
    if (!email) {
      setError(t('auth.error_email_required', 'Bitte gib deine E-Mail-Adresse ein'));
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('auth.error_invalid_email', 'Bitte gib eine gültige E-Mail-Adresse ein'));
      return;
    }

    // Send password reset email
    const result = await authService.forgotPassword(email);

    if (result.success) {
      // Store email for success message and switch to success screen
      setResetEmail(email);
      resetForm();
      switchMode('password-reset-success');
    } else {
      // Show error with specific handling for rate limiting
      let errorMessage = result.error || t('auth.passwordResetError', 'Password reset failed');

      // Check if it's a rate limit error
      if (result.error?.includes('rate limit') || result.error?.includes('too many')) {
        errorMessage = t(
          'auth.reset_password_rate_limit',
          'Too many password reset attempts. Please wait a few minutes before trying again.'
        );
      }

      setError(errorMessage);

      showNotification({
        title: t('auth.passwordResetError', 'Password reset failed'),
        body: errorMessage,
        channelType: NotificationChannel.FUNCTIONAL,
      });
    }
  }

  // Get title based on current mode
  const getTitle = () => {
    switch (mode) {
      case 'initial':
        return t('auth.welcome', 'Willkommen bei Memoro');
      case 'login':
        return t('auth.welcome_back', 'Willkommen zurück');
      case 'register':
        return t('auth.create_account', 'Konto erstellen');
      case 'login-options':
        return t('auth.login', 'Anmelden');
      case 'register-options':
        return t('auth.create_account', 'Konto erstellen');
      case 'login-email':
        return t('auth.login_with_email', 'Mit E-Mail anmelden');
      case 'register-email':
        return t('auth.register_with_email', 'Mit E-Mail registrieren');
      case 'forgot-password':
        return t('auth.reset_password', 'Passwort zurücksetzen');
      case 'password-reset-success':
        return t('auth.reset_email_sent_title', 'E-Mail wurde versendet!');
      default:
        return 'Memoro';
    }
  };

  // Get action button text based on current mode
  const getActionButtonText = () => {
    switch (mode) {
      case 'login-email':
        return loading ? t('auth.logging_in', 'Anmelden...') : t('auth.login', 'Anmelden');
      case 'register-email':
        return loading
          ? t('auth.registering', 'Registrieren...')
          : t('auth.register', 'Registrieren');
      case 'forgot-password':
        return loading
          ? t('auth.sending', 'Senden...')
          : t('auth.reset_password', 'Passwort zurücksetzen');
      default:
        return '';
    }
  };

  // Get action button icon based on current mode
  const getActionButtonIcon = () => {
    switch (mode) {
      case 'login-email':
        return 'arrow-right';
      case 'register-email':
        return 'user-plus';
      case 'forgot-password':
        return 'key';
      default:
        return 'arrow-right';
    }
  };

  // Handle action button press based on current mode
  const handleActionButtonPress = () => {
    switch (mode) {
      case 'login-email':
        return handleLogin();
      case 'register-email':
        return handleRegister();
      case 'forgot-password':
        return handleForgotPassword();
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: getPageBackground(),
      }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : undefined}
      enabled={Platform.OS === 'ios'}>
      {/* Language selector button in top right */}
      <Pressable
        style={{
          position: 'absolute',
          top: insets.top + 16,
          right: 16,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 20,
          backgroundColor: getContentBackground(),
          zIndex: 100,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 4,
          elevation: 4,
        }}
        onPress={() => setIsLanguageSelectorVisible(true)}>
        <Text style={{ fontSize: 20, marginRight: 6 }}>
          {languages[currentLanguage]?.emoji || '🌐'}
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: isDark ? '#FFFFFF' : '#000000',
            textTransform: 'uppercase',
          }}>
          {currentLanguage}
        </Text>
      </Pressable>

      {/* Language Selector Modal */}
      <LanguageSelector
        isVisible={isLanguageSelectorVisible}
        onClose={() => setIsLanguageSelectorVisible(false)}
      />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'space-between',
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS === 'android'}
        bounces={Platform.OS === 'ios'}
        overScrollMode="never">
        {/* Logo */}
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 200,
          }}>
          <View
            style={{
              width: 150,
              height: 150,
              borderRadius: 75,
              borderWidth: 7,
              borderColor: getPrimaryColor(),
              backgroundColor: getContentBackground(),
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: isDark ? 0.4 : 0.15,
              shadowRadius: 12,
              elevation: 8,
              opacity: isKeyboardVisible ? 0.8 : 1,
              transform: [{ scale: isKeyboardVisible ? 0.9 : 1 }],
            }}>
            <MemoroLogo size={65} color={getPrimaryColor()} />
          </View>
        </View>

        {/* Button-Container */}
        <View
          style={{
            width: '100%',
            alignItems: 'center',
            paddingBottom: insets.bottom,
            zIndex: 10,
          }}>
          <View
            style={{
              width: '100%',
              maxWidth: 480,
            }}>
            <View
              className="mt-auto w-full rounded-t-3xl px-5 pb-0 pt-8"
              style={{
                backgroundColor: getPageBackground(),
              }}>
              <Text
                style={{
                  textAlign: 'center',
                  marginBottom: 16,
                  opacity: 0.6,
                  color: isDark ? '#FFFFFF' : '#000000',
                  fontSize: 24,
                  fontWeight: '600',
                  paddingLeft: 0,
                  paddingTop: 4,
                  zIndex: 100,
                }}>
                {getTitle()}
              </Text>

              {mode === 'initial' ? (
                // Initial mode with login and register buttons
                <View
                  style={{
                    marginBottom: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}>
                  <Button
                    onPress={() => switchMode('register-options')}
                    title={t('auth.create_account', 'Konto erstellen')}
                    variant="primary"
                    iconName="person-add-outline"
                    style={{ height: 56 }}
                  />

                  <Button
                    onPress={() => switchMode('login-options')}
                    title={t('auth.login', 'Anmelden')}
                    variant="secondary"
                    iconName="log-in-outline"
                    style={{ height: 56 }}
                  />
                </View>
              ) : mode === 'login-options' || mode === 'register-options' ? (
                // Login or Register options (Google, Apple, Email)
                <View
                  style={{
                    marginBottom: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}>
                  <Button
                    onPress={() =>
                      switchMode(mode === 'login-options' ? 'login-email' : 'register-email')
                    }
                    title={
                      mode === 'login-options'
                        ? t('auth.login_with_email', 'Mit E-Mail anmelden')
                        : t('auth.register_with_email', 'Mit E-Mail registrieren')
                    }
                    variant="primary"
                    iconName="mail-outline"
                    style={{ height: 56 }}
                  />

                  {/* Google Sign-In Button */}
                  <GoogleSignInButton
                    onSuccess={async () => {
                      const result = await signInWithGoogle();
                      if (!result.success && result.error) {
                        setError(result.error);
                      }
                    }}
                    onError={(error) => {
                      setError(error.message);
                      showNotification({
                        title: 'Google Anmeldung fehlgeschlagen',
                        body: error.message,
                        channelType: NotificationChannel.FUNCTIONAL,
                      });
                    }}
                  />

                  {/* Apple Sign-In Button */}
                  <AppleSignInButton
                    onSuccess={() => {
                      if (__DEV__) {
                        console.log('Apple Sign-In successful');
                      }
                    }}
                    onError={(error) => {
                      setError(error.message);
                      showNotification({
                        title: 'Apple Anmeldung fehlgeschlagen',
                        body: error.message,
                        channelType: NotificationChannel.FUNCTIONAL,
                      });
                    }}
                  />

                  <Button
                    onPress={() => {
                      resetForm();
                      switchMode('initial');
                    }}
                    title={t('common.back', 'Zurück')}
                    variant="text"
                    iconName="arrow-back-outline"
                    style={{ height: 40, marginBottom: 0, paddingBottom: 0 }}
                  />
                </View>
              ) : mode === 'password-reset-success' ? (
                // Password reset success message
                <View className="mb-2 pb-4">
                  <View
                    style={{
                      alignItems: 'center',
                      marginBottom: 32,
                    }}>
                    <View
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        backgroundColor: getPrimaryColor() + '20',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 24,
                      }}>
                      <Icon name="mail-open-outline" size={40} color={getPrimaryColor()} />
                    </View>

                    <Text
                      style={{
                        fontSize: 14,
                        color: isDark ? '#9CA3AF' : '#4B5563',
                        textAlign: 'left',
                        paddingHorizontal: 8,
                        lineHeight: 22,
                      }}>
                      {t(
                        'auth.reset_email_sent_description',
                        'Wir haben eine E-Mail mit Anweisungen zum Zurücksetzen deines Passworts an {email} gesendet. Bitte überprüfe deinen Posteingang und Spam-Ordner.'
                      ).replace('{email}', resetEmail)}
                    </Text>
                  </View>

                  <View style={{ gap: 12 }}>
                    <Button
                      onPress={() => {
                        setResetEmail('');
                        switchMode('login-email');
                      }}
                      title={t('auth.back_to_login', 'Zurück zum Login')}
                      variant="primary"
                      iconName="log-in-outline"
                      style={{ height: 56 }}
                    />

                    <Button
                      onPress={() => switchMode('forgot-password')}
                      title={t('auth.resend_email', 'E-Mail erneut senden')}
                      variant="secondary"
                      style={{ height: 48 }}
                    />
                  </View>
                </View>
              ) : (
                // Email Login, Register or Forgot Password forms
                <View className="mb-2 pb-4">
                  {error && (
                    <View className="mb-4 rounded-lg bg-red-500/20 p-3">
                      <Text variant="body" className="text-red-500">
                        {error}
                      </Text>
                    </View>
                  )}

                  <Input
                    placeholder={t('auth.email', 'E-Mail')}
                    value={email}
                    onChangeText={handleEmailChange}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    className={`mb-2 h-14 rounded-xl border px-4 text-lg ${isDark ? 'border-gray-700 bg-black/20 text-white' : 'border-gray-300 bg-gray-100/50 text-black'}`}
                  />

                  {mode !== 'forgot-password' && (
                    <Input
                      placeholder={t('auth.password', 'Passwort')}
                      value={password}
                      onChangeText={handlePasswordChange}
                      secureTextEntry
                      showPasswordToggle
                      className={`mb-2 h-14 rounded-xl border px-4 text-lg ${isDark ? 'border-gray-700 bg-black/20 text-white' : 'border-gray-300 bg-gray-100/50 text-black'}`}
                    />
                  )}

                  {mode === 'register-email' && (
                    <>
                      <Input
                        placeholder={t('auth.confirm_password', 'Passwort bestätigen')}
                        value={confirmPassword}
                        onChangeText={handleConfirmPasswordChange}
                        secureTextEntry
                        showPasswordToggle
                        className={`mb-2 h-14 rounded-xl border px-4 text-lg ${isDark ? 'border-gray-700 bg-black/20 text-white' : 'border-gray-300 bg-gray-100/50 text-black'}`}
                      />

                      <Text
                        style={{
                          fontSize: 12,
                          marginBottom: 16,
                          marginTop: 8,
                          color: isDark ? '#9CA3AF' : '#4B5563',
                        }}>
                        {t(
                          'auth.password_requirement',
                          'Passwort muss mindestens 8 Zeichen lang sein und mindestens einen Kleinbuchstaben, einen Großbuchstaben, eine Ziffer und ein Sonderzeichen enthalten.'
                        )}
                      </Text>
                    </>
                  )}

                  {mode === 'login-email' && (
                    <Button
                      onPress={() => switchMode('forgot-password')}
                      title={t('auth.forgotPassword', 'Passwort vergessen?')}
                      variant="secondary"
                      style={{ height: 40, marginBottom: 16 }}
                    />
                  )}

                  <View className="mb-0 gap-4">
                    <Button
                      onPress={handleActionButtonPress}
                      title={getActionButtonText()}
                      variant={mode === 'forgot-password' ? 'secondary' : 'primary'}
                      iconName={
                        mode === 'login-email'
                          ? 'log-in-outline'
                          : mode === 'register-email'
                            ? 'person-add-outline'
                            : 'key-outline'
                      }
                      loading={loading}
                      disabled={loading}
                      style={{ height: 56 }}
                    />

                    <Button
                      onPress={() => {
                        resetForm();
                        if (mode === 'forgot-password') {
                          switchMode('login-options');
                        } else {
                          switchMode(mode === 'login-email' ? 'login-options' : 'register-options');
                        }
                      }}
                      title={t('common.back', 'Zurück')}
                      variant="text"
                      iconName="arrow-back-outline"
                      style={{ height: 40, marginBottom: 0, paddingBottom: 0 }}
                    />
                  </View>
                </View>
              )}

              <View
                style={{
                  marginTop: 0,
                  marginBottom: 10,
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Text
                    style={{
                      fontSize: 12,
                      textAlign: 'center',
                      color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                      fontWeight: '300',
                      lineHeight: 20,
                    }}>
                    {t('auth.terms_agreement_prefix', 'Mit der Nutzung stimmst du unseren ')}
                  </Text>
                  <TouchableOpacity
                    onPress={() => Linking.openURL('https://www.memoro.ai/de/privacy/')}>
                    <Text
                      style={{
                        textDecorationLine: 'underline',
                        fontWeight: '500',
                        fontSize: 12,
                        color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                      }}>
                      {t('auth.terms', 'AGB')}
                    </Text>
                  </TouchableOpacity>
                  <Text
                    style={{
                      fontSize: 12,
                      color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                      fontWeight: '300',
                    }}>
                    {' '}
                    {t('auth.terms_agreement_conjunction', 'und der')}
                    {' '}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      Linking.openURL('https://www.memoro.ai/de/privacy/')
                    }>
                    <Text
                      style={{
                        textDecorationLine: 'underline',
                        fontWeight: '500',
                        fontSize: 12,
                        color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                      }}>
                      {t('auth.privacy_policy', 'Datenschutzerklärung')}
                    </Text>
                  </TouchableOpacity>
                  <Text
                    style={{
                      fontSize: 12,
                      color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                      fontWeight: '300',
                    }}>
                    {' '}
                    {t('auth.terms_agreement_suffix', 'zu.')}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
