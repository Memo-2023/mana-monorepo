import { View, TextInput, StyleSheet, Alert, ActivityIndicator, Pressable, ImageBackground, Platform, Dimensions, Image, Linking, Animated } from 'react-native';
import Button from '../components/atoms/Button';
import Text from '../components/atoms/Text';
import Modal from '../components/atoms/Modal';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Pattern, Rect, Circle } from 'react-native-svg';
import { theme } from '../src/theme/theme';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { usePostHog } from '../src/hooks/usePostHogWeb';
import { GoogleSignInButton } from '../components/molecules/GoogleSignInButton';
import { AppleSignInButton } from '../components/molecules/AppleSignInButton';
import ManaIcon from '../components/icons/ManaIcon';
import { Feather } from '@expo/vector-icons';
import { ParentalGate } from '../src/components/ParentalGate';
import { useParentalGate } from '../src/hooks/useParentalGate';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 380;
const isMediumDevice = width >= 380 && width < 768;

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): string | null => {
  if (password.length < 8) return 'Das Passwort muss mindestens 8 Zeichen lang sein';
  if (!/[A-Z]/.test(password)) return 'Das Passwort muss mindestens einen Großbuchstaben enthalten';
  if (!/[a-z]/.test(password)) return 'Das Passwort muss mindestens einen Kleinbuchstaben enthalten';
  if (!/[0-9]/.test(password)) return 'Das Passwort muss mindestens eine Zahl enthalten';
  return null;
};

type AuthMode = 'initial' | 'login-options' | 'register-options' | 'login-email' | 'register-email' | 'forgot-password' | 'password-reset-success';

interface ConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  email: string;
}

const ConfirmationModal = ({ visible, onClose, email }: ConfirmationModalProps) => {
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Bestätige die E-Mail"
      useBlur={false}
      maxWidth={500}
      buttons={[
        {
          title: 'Verstanden',
          onPress: onClose,
          variant: 'primary',
        },
      ]}
    >
      <View style={styles.divider} />
      <Text variant="body" color="#fff" style={styles.modalText}>
        Wir haben eine Bestätigungs-E-Mail an <Text variant="body" color="#FFCB00" style={styles.modalEmailText}>{email}</Text> gesendet.
      </Text>
      <Text variant="body" color="#fff" style={styles.modalText}>
        Bitte öffne diese E-Mail und klicke auf den Bestätigungslink, um dein Konto zu aktivieren.
      </Text>
      <Text variant="caption" color="rgba(255, 255, 255, 0.7)" style={styles.modalSubText}>
        Prüfe auch deinen Spam-Ordner, falls du die E-Mail nicht findest.
      </Text>
      <View style={styles.divider} />
    </Modal>
  );
};

interface AppModalProps {
  visible: boolean;
  onClose: () => void;
}

const ManaModal = ({ visible, onClose }: AppModalProps) => {
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title=""
      useBlur={true}
      maxWidth={360}
    >
      <View style={styles.modalLogoContainer}>
        <ManaIcon size={48} color="#0099FF" />
      </View>
      <Text variant="header" color="#fff" style={styles.modalTitle}>
        Mana Login
      </Text>
      <View style={styles.divider} />
      <Text variant="body" color="#fff" style={styles.modalTextLeft}>
        Ein Mana-Konto für alle deine Lieblings-Apps. Einmal anmelden und überall nutzen.
      </Text>
      <Text variant="body" color="#fff" style={styles.modalTextLeft}>
        Sichere, zentrale Authentifizierung für alle Mana-Apps wie Memoro und Märchenzauber.
      </Text>
      <View style={styles.divider} />

      <View style={styles.modalButtonsContainer}>
        <Pressable
          style={[styles.button, styles.signUpButton]}
          onPress={() => Linking.openURL('https://mana-core.com')}
        >
          <Feather name="external-link" size={20} color="#fff" />
          <Text variant="body" color="#fff" style={styles.buttonText}>Website besuchen</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.backButton, styles.backButtonSpacing]}
          onPress={onClose}
        >
          <Feather name="arrow-left" size={20} color="#fff" />
          <Text variant="body" color="#fff" style={styles.buttonText}>Zurück</Text>
        </Pressable>
      </View>
    </Modal>
  );
};

const MemoroModal = ({ visible, onClose }: AppModalProps) => {
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title=""
      useBlur={true}
      maxWidth={360}
    >
      <View style={styles.modalLogoContainer}>
        <Image source={require('../assets/images/Memoro-App-Icon.png')} style={styles.modalAppIcon} />
      </View>
      <Text variant="header" color="#fff" style={styles.modalTitle}>
        Memoro
      </Text>
      <View style={styles.divider} />
      <Text variant="body" color="#fff" style={styles.modalTextLeft}>
        Zeichne Gespräche auf und lass sie automatisch mitschreiben und zusammenfassen.
      </Text>
      <Text variant="body" color="#fff" style={styles.modalTextLeft}>
        Perfekt für Dokumentation, Notizen und das automatische Ausfüllen von Formularen mit KI.
      </Text>
      <View style={styles.divider} />

      <View style={styles.modalButtonsContainer}>
        <Pressable
          style={[styles.button, styles.signUpButton]}
          onPress={() => Linking.openURL('https://apps.apple.com/app/memoro')}
        >
          <Feather name="download" size={20} color="#fff" />
          <Text variant="body" color="#fff" style={styles.buttonText}>Download</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.loginButton]}
          onPress={() => Linking.openURL('https://memoro.ai')}
        >
          <Feather name="external-link" size={20} color="#fff" />
          <Text variant="body" color="#fff" style={styles.buttonText}>Website</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.backButton, styles.backButtonSpacing]}
          onPress={onClose}
        >
          <Feather name="arrow-left" size={20} color="#fff" />
          <Text variant="body" color="#fff" style={styles.buttonText}>Zurück</Text>
        </Pressable>
      </View>
    </Modal>
  );
};

const MaerchenzauberModal = ({ visible, onClose }: AppModalProps) => {
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title=""
      useBlur={true}
      maxWidth={360}
    >
      <View style={styles.modalLogoContainer}>
        <Image source={require('../assets/images/icon.png')} style={styles.modalAppIcon} />
      </View>
      <Text variant="header" color="#fff" style={styles.modalTitle}>
        Märchenzauber
      </Text>
      <View style={styles.divider} />
      <Text variant="body" color="#fff" style={styles.modalTextLeft}>
        Erschaffe magische, personalisierte Geschichten für Kinder mit KI.
      </Text>
      <Text variant="body" color="#fff" style={styles.modalTextLeft}>
        Erstelle individuelle Charaktere und lass sie in wundervollen, illustrierten Abenteuern lebendig werden.
      </Text>
      <View style={styles.divider} />

      <View style={styles.modalButtonsContainer}>
        <Pressable
          style={[styles.button, styles.signUpButton]}
          onPress={() => Linking.openURL('https://apps.apple.com/app/marchenzauber')}
        >
          <Feather name="download" size={20} color="#fff" />
          <Text variant="body" color="#fff" style={styles.buttonText}>Download</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.loginButton]}
          onPress={() => Linking.openURL('https://maerchenzauber.ai')}
        >
          <Feather name="external-link" size={20} color="#fff" />
          <Text variant="body" color="#fff" style={styles.buttonText}>Website</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.backButton, styles.backButtonSpacing]}
          onPress={onClose}
        >
          <Feather name="arrow-left" size={20} color="#fff" />
          <Text variant="body" color="#fff" style={styles.buttonText}>Zurück</Text>
        </Pressable>
      </View>
    </Modal>
  );
};

// Dev credentials - only used in development mode
const DEV_CREDENTIALS = {
  email: 'till.schneider@memoro.ai',
  password: 'Aa-12345678'
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [mode, setMode] = useState<AuthMode>('initial');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [tapCount, setTapCount] = useState(0);
  const [showManaModal, setShowManaModal] = useState(false);
  const [showMemoroModal, setShowMemoroModal] = useState(false);
  const [showMaerchenzauberModal, setShowMaerchenzauberModal] = useState(false);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animation values
  const manaLoginOpacity = useRef(new Animated.Value(0)).current;
  const manaLoginTranslateY = useRef(new Animated.Value(-30)).current;
  const infoTextOpacity = useRef(new Animated.Value(0)).current;
  const infoTextTranslateY = useRef(new Animated.Value(-30)).current;
  const appPillsOpacity = useRef(new Animated.Value(0)).current;
  const appPillsTranslateY = useRef(new Animated.Value(-30)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(100)).current;

  const router = useRouter();
  const posthog = usePostHog();
  const { signIn, signUp } = useAuth();
  const { isVisible: isParentalGateVisible, config: parentalGateConfig, setIsVisible: setParentalGateVisible, openExternalLinkWithGate } = useParentalGate();

  // Cleanup tap timer on unmount
  useEffect(() => {
    return () => {
      if (tapTimer.current) {
        clearTimeout(tapTimer.current);
      }
    };
  }, []);

  // Initial animations
  useEffect(() => {
    // 1. Mana Login pill appears first
    Animated.parallel([
      Animated.timing(manaLoginOpacity, {
        toValue: 1,
        duration: 300,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.timing(manaLoginTranslateY, {
        toValue: 0,
        duration: 300,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Info text appears second
    Animated.parallel([
      Animated.timing(infoTextOpacity, {
        toValue: 1,
        duration: 300,
        delay: 250,
        useNativeDriver: true,
      }),
      Animated.timing(infoTextTranslateY, {
        toValue: 0,
        duration: 300,
        delay: 250,
        useNativeDriver: true,
      }),
    ]).start();

    // 3. App pills appear third
    Animated.parallel([
      Animated.timing(appPillsOpacity, {
        toValue: 1,
        duration: 300,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.timing(appPillsTranslateY, {
        toValue: 0,
        duration: 300,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // 4. Card slides up from bottom and fades in
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 400,
        delay: 550,
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: 0,
        duration: 400,
        delay: 550,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleResetPassword = async () => {
    setEmailError(null);
    posthog?.capture('password_reset_requested', {
      email_provided: Boolean(email)
    });

    if (!email) {
      setEmailError('Bitte gib deine E-Mail-Adresse ein');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Bitte gib eine gültige E-Mail-Adresse ein');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement password reset via mana-core-middleware
      // For now, just show success message
      setResetEmail(email);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setMode('password-reset-success');

      posthog?.capture('password_reset_sent', {
        email_domain: email.split('@')[1]
      });
    } catch (error) {
      console.error('LoginScreen: Password reset error:', error);
      Alert.alert('Fehler', 'Ein unbekannter Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setEmailError(null);
    setPasswordError(null);

    posthog?.capture('auth_attempt', {
      method: 'email',
      type: 'login',
      email_domain: email ? email.split('@')[1] : null
    });

    if (!email || !password) {
      posthog?.capture('auth_error', {
        method: 'email',
        type: 'login',
        error: 'missing_credentials',
        email_domain: email ? email.split('@')[1] : null
      });
      Alert.alert('Fehler', 'Bitte gib deine E-Mail und dein Passwort ein');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Bitte gib eine gültige E-Mail-Adresse ein');
      return;
    }

    setIsLoading(true);
    try {
      console.log('LoginScreen: Attempting login with email:', email);
      
      // Use the new auth context
      await signIn(email, password);
      
      console.log('LoginScreen: Login successful');
      posthog?.capture('auth_success', {
        method: 'email',
        type: 'login',
        email_domain: email.split('@')[1]
      });
      
      // Delay navigation to ensure Root Layout is ready
      console.log('LoginScreen: Waiting for navigation...');
      setTimeout(() => {
        try {
          console.log('LoginScreen: Navigating to home page');
          router.replace('/');
        } catch (navError) {
          console.error('LoginScreen: Navigation failed, will retry:', navError);
          // If navigation fails, retry after a longer delay
          setTimeout(() => {
            try {
              router.replace('/');
            } catch (retryError) {
              console.error('LoginScreen: Navigation retry failed:', retryError);
              // As a last resort, just try to push instead of replace
              router.push('/');
            }
          }, 500);
        }
      }, 100);
    } catch (error) {
      console.error('LoginScreen: Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      posthog?.capture('auth_error', {
        method: 'email',
        type: 'login',
        error: errorMessage,
        email_domain: email.split('@')[1]
      });
      
      // Handle different error scenarios
      if (error instanceof Error) {
        Alert.alert('Anmeldefehler', 'Fehler bei der Anmeldung. Bitte überprüfe deine E-Mail und dein Passwort.');
      } else {
        Alert.alert('Anmeldefehler', 'Ein unbekannter Fehler ist aufgetreten. Bitte versuche es später erneut.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevLogin = async () => {
    if (!__DEV__) return;

    console.log('[DevLogin] Triple-tap detected, auto-logging in...');
    setEmail(DEV_CREDENTIALS.email);
    setPassword(DEV_CREDENTIALS.password);
    setMode('login-email');

    setIsLoading(true);
    try {
      await signIn(DEV_CREDENTIALS.email, DEV_CREDENTIALS.password);
      console.log('[DevLogin] Login successful');

      setTimeout(() => {
        router.replace('/');
      }, 100);
    } catch (error) {
      console.error('[DevLogin] Login failed:', error);
      Alert.alert('Dev Login Fehler', 'Auto-Login fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTitlePress = () => {
    if (!__DEV__) return;

    const newCount = tapCount + 1;
    setTapCount(newCount);

    console.log(`[DevLogin] Tap ${newCount}/3`);

    if (tapTimer.current) {
      clearTimeout(tapTimer.current);
    }

    if (newCount >= 3) {
      console.log('[DevLogin] Triple-tap complete!');
      setTapCount(0);
      handleDevLogin();
      return;
    }

    tapTimer.current = setTimeout(() => {
      console.log('[DevLogin] Tap timeout, resetting counter');
      setTapCount(0);
    }, 800);
  };

  const handleSignUp = async () => {
    setEmailError(null);
    setPasswordError(null);

    posthog?.capture('auth_attempt', {
      method: 'email',
      type: 'register',
      email_domain: email ? email.split('@')[1] : null
    });

    if (!email || !password) {
      posthog?.capture('auth_error', {
        method: 'email',
        type: 'register',
        error: 'missing_credentials',
        email_domain: email ? email.split('@')[1] : null
      });
      Alert.alert('Fehler', 'Bitte gib deine E-Mail und dein Passwort ein');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Bitte gib eine gültige E-Mail-Adresse ein');
      return;
    }

    const passwordValidationError = validatePassword(password);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      return;
    }

    if (!confirmPassword) {
      setPasswordError('Bitte bestätige dein Passwort');
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('Passwörter stimmen nicht überein');
      return;
    }

    setIsLoading(true);
    try {
      console.log('LoginScreen: Attempting signup with email:', email);
      
      // Use the register method from AuthContext
      const result = await signUp(email, password);
      
      console.log('LoginScreen: Signup successful, needsVerification:', result.needsVerification);
      
      if (result.needsVerification) {
        // Show confirmation modal for email verification
        setShowConfirmationModal(true);
        posthog?.capture('auth_success', {
          method: 'email',
          type: 'register',
          email_domain: email.split('@')[1],
          requires_verification: true
        });
        // Clear sensitive fields but keep email
        setPassword('');
        setConfirmPassword('');
        // Switch to login mode so user can sign in after confirming email
        setMode('login-email');
      } else {
        // If no verification needed, auto-login
        posthog?.capture('auth_success', {
          method: 'email',
          type: 'register',
          email_domain: email.split('@')[1],
          requires_verification: false
        });
        
        // Navigate to home after successful registration
        setTimeout(() => {
          try {
            console.log('LoginScreen: Navigating to home page after signup');
            router.replace('/');
          } catch (navError) {
            console.error('LoginScreen: Navigation failed:', navError);
            router.push('/');
          }
        }, 100);
      }
    } catch (error) {
      console.error('LoginScreen: Signup error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten';
      
      posthog?.capture('auth_error', {
        method: 'email',
        type: 'register',
        error: errorMessage,
        email_domain: email.split('@')[1]
      });
      
      Alert.alert('Registrierungsfehler', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions
  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setEmailError(null);
    setPasswordError(null);
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setEmailError(null);
    setPasswordError(null);
  };

  const getTitle = () => {
    switch (mode) {
      case 'initial':
        return 'Märchenzauber';
      case 'login-options':
        return 'Anmelden';
      case 'register-options':
        return 'Konto erstellen';
      case 'login-email':
        return 'Mit E-Mail anmelden';
      case 'register-email':
        return 'Mit E-Mail registrieren';
      case 'forgot-password':
        return 'Passwort zurücksetzen';
      case 'password-reset-success':
        return 'E-Mail wurde versendet!';
      default:
        return 'Märchenzauber';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'initial':
        return 'Erstelle ein Konto oder melde dich an.';
      case 'login-options':
        return 'Wähle deine Anmeldemethode';
      case 'register-options':
        return 'Wähle deine Registrierungsmethode';
      case 'login-email':
        return 'Gib deine Anmeldedaten ein';
      case 'register-email':
        return 'Erstelle ein neues Konto';
      case 'forgot-password':
        return 'Gib deine E-Mail-Adresse ein';
      case 'password-reset-success':
        return '';
      default:
        return '';
    }
  };

  return (
    <>
      <ConfirmationModal
        visible={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        email={email}
      />
      <ManaModal
        visible={showManaModal}
        onClose={() => setShowManaModal(false)}
      />
      <MemoroModal
        visible={showMemoroModal}
        onClose={() => setShowMemoroModal(false)}
      />
      <MaerchenzauberModal
        visible={showMaerchenzauberModal}
        onClose={() => setShowMaerchenzauberModal(false)}
      />
      <ImageBackground
        source={require('../assets/images/marchenzauber-dadgirl.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        extraScrollHeight={100}
        enableOnAndroid
      >
        {/* Mana Info Banner */}
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0)']}
          style={styles.manaInfoBanner}
        >
          {/* 1. Mana Login pill */}
          <Animated.View
            style={{
              opacity: manaLoginOpacity,
              transform: [{ translateY: manaLoginTranslateY }],
            }}
          >
            <Pressable onPress={() => setShowManaModal(true)}>
              <BlurView intensity={50} tint="dark" style={styles.manaLoginHeader}>
                <ManaIcon size={16} color="#0099FF" />
                <Text variant="header" color="#fff" style={styles.manaLoginTitle}>
                  Mana Login
                </Text>
              </BlurView>
            </Pressable>
          </Animated.View>

          {/* 2. Info text */}
          <Animated.View
            style={{
              opacity: infoTextOpacity,
              transform: [{ translateY: infoTextTranslateY }],
            }}
          >
            <Text variant="caption" color="rgba(255, 255, 255, 0.9)" style={styles.manaInfoTitle}>
              Ein Mana-Konto für alle Apps
            </Text>
          </Animated.View>

          {/* 3. App pills */}
          <Animated.View
            style={{
              opacity: appPillsOpacity,
              transform: [{ translateY: appPillsTranslateY }],
            }}
          >
            <View style={styles.appsRow}>
              <Pressable onPress={() => setShowMemoroModal(true)}>
                <BlurView intensity={50} tint="dark" style={styles.appContainer}>
                  <Image source={require('../assets/images/Memoro-App-Icon.png')} style={styles.appIconSmall} />
                  <Text variant="caption" color="#fff" style={styles.appName}>
                    Memoro
                  </Text>
                </BlurView>
              </Pressable>
              <Pressable onPress={() => setShowMaerchenzauberModal(true)}>
                <BlurView intensity={50} tint="dark" style={styles.appContainer}>
                  <Image source={require('../assets/images/icon.png')} style={styles.appIconSmall} />
                  <Text variant="caption" color="#fff" style={styles.appName}>
                    Märchenzauber
                  </Text>
                </BlurView>
              </Pressable>
            </View>
          </Animated.View>
        </LinearGradient>

        <Animated.View
          style={[
            styles.contentContainerWrapper,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardTranslateY }],
            },
          ]}
        >
          <BlurView intensity={60} tint="dark" style={styles.contentContainer}>
            {/* Background Pattern */}
            <Svg
              style={styles.backgroundPattern}
              width="100%"
              height="100%"
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid slice"
            >
              <Defs>
                <Pattern
                  id="dots"
                  x="0"
                  y="0"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <Circle cx="2" cy="2" r="1" fill="rgba(255, 255, 255, 0.1)" />
                </Pattern>
              </Defs>
              <Rect width="100" height="100" fill="url(#dots)" />
            </Svg>
            <Pressable onPress={handleTitlePress} style={styles.titleContainer}>
            <Image
              source={require('../assets/images/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text
              style={styles.title}
              numberOfLines={1}
              ellipsizeMode="tail"
              {...(Platform.OS === 'android' ? { includeFontPadding: false } : {})}
            >
              {getTitle()}
            </Text>
          </Pressable>

          <View style={styles.buttonContainer}>
            {mode === 'initial' && (
              <>
                <Pressable
                  style={[styles.button, styles.signUpButton]}
                  onPress={() => switchMode('register-options')}
                >
                  <Feather name="user-plus" size={20} color="#fff" />
                  <Text variant="body" color="#fff" style={styles.buttonText}>Neues Konto erstellen</Text>
                </Pressable>

                <Pressable
                  style={[styles.button, styles.loginButton]}
                  onPress={() => switchMode('login-options')}
                >
                  <Feather name="log-in" size={20} color="#fff" />
                  <Text variant="body" color="#fff" style={styles.buttonText}>Anmelden</Text>
                </Pressable>
              </>
            )}

            {(mode === 'login-options' || mode === 'register-options') && (
              <>
                <Pressable
                  style={[styles.button, styles.signUpButton]}
                  onPress={() => switchMode(mode === 'login-options' ? 'login-email' : 'register-email')}
                >
                  <Feather name="mail" size={20} color="#fff" />
                  <Text variant="body" color="#fff" style={styles.buttonText}>
                    {mode === 'login-options' ? 'Mit E-Mail anmelden' : 'Mit E-Mail registrieren'}
                  </Text>
                </Pressable>

                <GoogleSignInButton />
                <AppleSignInButton />

                <Pressable
                  style={[styles.button, styles.backButton, styles.backButtonSpacing]}
                  onPress={() => {
                    resetForm();
                    switchMode('initial');
                  }}
                >
                  <Feather name="arrow-left" size={20} color="#fff" />
                  <Text variant="body" color="#fff" style={styles.buttonText}>Zurück</Text>
                </Pressable>
              </>
            )}

            {mode === 'password-reset-success' && (
              <>
                <View style={styles.successContainer}>
                  <Text variant="body" color="#fff" style={styles.successText}>
                    Wir haben eine E-Mail mit Anweisungen zum Zurücksetzen deines Passworts an{' '}
                    <Text variant="body" color="#FFCB00" style={styles.emailHighlight}>{resetEmail}</Text>
                    {' '}gesendet.
                  </Text>
                  <Text variant="caption" color="rgba(255, 255, 255, 0.7)" style={styles.successSubText}>
                    Bitte überprüfe deinen Posteingang und Spam-Ordner.
                  </Text>
                </View>

                <Pressable
                  style={[styles.button, styles.signUpButton]}
                  onPress={() => {
                    setResetEmail('');
                    switchMode('login-email');
                  }}
                >
                  <Feather name="log-in" size={20} color="#fff" />
                  <Text variant="body" color="#fff" style={styles.buttonText}>Zurück zum Login</Text>
                </Pressable>

                <Pressable
                  style={[styles.button, styles.backButton, styles.backButtonSpacing]}
                  onPress={() => switchMode('forgot-password')}
                >
                  <Feather name="mail" size={20} color="#fff" />
                  <Text variant="body" color="#fff" style={styles.buttonText}>E-Mail erneut senden</Text>
                </Pressable>
              </>
            )}

            {(mode === 'login-email' || mode === 'register-email' || mode === 'forgot-password') && (
              <>
                {(emailError || passwordError) && (
                  <View style={styles.errorContainer}>
                    <Text variant="body" color="#ff4444" style={styles.errorText}>
                      {emailError || passwordError}
                    </Text>
                  </View>
                )}

                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, (emailError || passwordError) ? styles.inputError : null]}
                    placeholder="E-Mail Adresse eingeben..."
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setEmailError(null);
                      setPasswordError(null);
                    }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  />

                  {mode !== 'forgot-password' && (
                    <View style={styles.passwordContainer}>
                      <TextInput
                        style={[styles.input, styles.passwordInput, (emailError || passwordError) ? styles.inputError : null]}
                        placeholder="Passwort eingeben..."
                        value={password}
                        onChangeText={(text) => {
                          setPassword(text);
                          setEmailError(null);
                          setPasswordError(null);
                        }}
                        secureTextEntry={!showPassword}
                        placeholderTextColor="rgba(255, 255, 255, 0.6)"
                      />
                      <Pressable
                        style={styles.eyeButton}
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color="rgba(255, 255, 255, 0.7)" />
                      </Pressable>
                    </View>
                  )}

                  {mode === 'register-email' && (
                    <>
                      <View style={styles.passwordContainer}>
                        <TextInput
                          style={[styles.input, styles.passwordInput, (emailError || passwordError) ? styles.inputError : null]}
                          placeholder="Passwort bestätigen..."
                          value={confirmPassword}
                          onChangeText={(text) => {
                            setConfirmPassword(text);
                            setEmailError(null);
                            setPasswordError(null);
                          }}
                          secureTextEntry={!showPassword}
                          placeholderTextColor="rgba(255, 255, 255, 0.6)"
                        />
                        <Pressable
                          style={styles.eyeButton}
                          onPress={() => setShowPassword(!showPassword)}
                        >
                          <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color="rgba(255, 255, 255, 0.7)" />
                        </Pressable>
                      </View>
                      <Text variant="caption" color="#fff" style={styles.passwordRequirements}>
                        Passwort muss mindestens 8 Zeichen lang sein und einen Großbuchstaben, Kleinbuchstaben und eine Zahl enthalten.
                      </Text>
                    </>
                  )}
                </View>

                {mode === 'login-email' && (
                  <Pressable
                    style={[styles.button, styles.forgotPasswordButton]}
                    onPress={() => switchMode('forgot-password')}
                  >
                    <Feather name="help-circle" size={20} color="#fff" />
                    <Text variant="body" color="#fff" style={styles.buttonText}>Passwort vergessen?</Text>
                  </Pressable>
                )}

                <Pressable
                  style={[
                    styles.button,
                    (mode === 'register-email' || (mode === 'login-email' && email && password))
                      ? styles.signUpButton
                      : styles.loginButton
                  ]}
                  onPress={
                    mode === 'register-email'
                      ? handleSignUp
                      : mode === 'forgot-password'
                        ? handleResetPassword
                        : handleLogin
                  }
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Feather
                        name={mode === 'register-email' ? 'user-plus' : mode === 'forgot-password' ? 'key' : 'log-in'}
                        size={20}
                        color="#fff"
                      />
                      <Text variant="body" color="#fff" style={styles.buttonText}>
                        {mode === 'register-email'
                          ? 'Registrieren'
                          : mode === 'forgot-password'
                            ? 'Passwort zurücksetzen'
                            : 'Anmelden'}
                      </Text>
                    </>
                  )}
                </Pressable>

                <Pressable
                  style={[styles.button, styles.backButton, styles.backButtonSpacing]}
                  onPress={() => {
                    resetForm();
                    if (mode === 'forgot-password') {
                      switchMode('login-options');
                    } else {
                      switchMode(mode === 'login-email' ? 'login-options' : 'register-options');
                    }
                  }}
                >
                  <Feather name="arrow-left" size={20} color="#fff" />
                  <Text variant="body" color="#fff" style={styles.buttonText}>Zurück</Text>
                </Pressable>
              </>
            )}
          </View>

          <View style={styles.legalContainer}>
            <Text variant="caption" color="#fff" style={styles.legalText}>
              Mit der Anmeldung stimmst du unseren{' '}
            </Text>
            <Pressable onPress={() => openExternalLinkWithGate('https://märchen-zauber.de/terms')}>
              <Text variant="caption" color="#fff" style={styles.legalLink}>AGB</Text>
            </Pressable>
            <Text variant="caption" color="#fff" style={styles.legalText}>
              {' '}und der{' '}
            </Text>
            <Pressable onPress={() => openExternalLinkWithGate('https://märchen-zauber.de/privacy')}>
              <Text variant="caption" color="#fff" style={styles.legalLink}>Datenschutzerklärung</Text>
            </Pressable>
            <Text variant="caption" color="#fff" style={styles.legalText}>
              {' '}zu.
            </Text>
          </View>

          <ParentalGate
            visible={isParentalGateVisible}
            onSuccess={() => {
              setParentalGateVisible(false);
              parentalGateConfig.onSuccess?.();
            }}
            onCancel={() => setParentalGateVisible(false)}
            title={parentalGateConfig.title}
            message={parentalGateConfig.message}
          />
          </BlurView>
          <View style={styles.contentBorder} pointerEvents="none" />
        </Animated.View>
      </KeyboardAwareScrollView>
    </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    color: '#fff',
    fontSize: 15,
    marginBottom: isSmallDevice ? 16 : 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalTextLeft: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 12,
    textAlign: 'left',
    lineHeight: 24,
  },
  modalSubText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 24,
    textAlign: 'center',
  },
  emailText: {
    fontWeight: 'bold',
    color: theme.colors.yellow.dark,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    width: '100%',
    marginVertical: 16,
  },
  modalEmailText: {
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
    color: theme.colors.yellow.dark,
  },
  modalLogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
    marginBottom: 0,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalAppIcon: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  modalButtonsContainer: {
    gap: 15,
    width: '100%',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  manaInfoBanner: {
    // Use alignSelf: 'stretch' instead of width: '100%' to prevent CoreGraphics crashes
    // during navigation when parent layout isn't fully resolved. Also add explicit height.
    alignSelf: 'stretch',
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    paddingBottom: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
    // Add explicit minimum dimensions for CoreGraphics gradient rendering
    minHeight: 100,
    minWidth: 200,
  },
  manaLoginHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  manaLoginTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  manaInfoTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  appsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  appContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  appIconSmall: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 8,
  },
  contentContainerWrapper: {
    marginTop: 'auto',
    position: 'relative',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  contentContainer: {
    width: '100%',
    padding: Platform.OS === 'ios' ? 16 : 20,
    paddingBottom: Platform.OS === 'ios' ? 16 : 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    position: 'relative',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5,
  },
  contentBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  titleContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: isSmallDevice ? 4 : isMediumDevice ? 6 : 8,
    marginBottom: isSmallDevice ? 26 : isMediumDevice ? 30 : 36,
    gap: 8,
  },
  logo: {
    width: isSmallDevice ? 48 : isMediumDevice ? 56 : 64,
    height: isSmallDevice ? 48 : isMediumDevice ? 56 : 64,
  },
  title: {
    fontSize: isSmallDevice ? 26 : isMediumDevice ? 28 : 32,
    textAlign: 'center',
    color: '#fff',
    letterSpacing: 0.5,
    ...(Platform.OS === 'android'
      ? { fontFamily: 'Grandstander_700Bold' }
      : { fontFamily: 'Grandstander_700Bold', fontWeight: '700' as const }
    ),
  },
  subtitleText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#fff',
    marginBottom: 40,
    opacity: 0.9,
  },
  inputContainer: {
    marginBottom: 0,
  },
  errorContainer: {
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.6)',
  },
  successContainer: {
    backgroundColor: 'rgba(255, 203, 0, 0.1)',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  successText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
    textAlign: 'center',
  },
  successSubText: {
    fontSize: 12,
    textAlign: 'center',
  },
  emailHighlight: {
    fontWeight: '600',
  },
  passwordRequirements: {
    fontSize: 14,
    marginTop: 8,
    marginBottom: 8,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  input: {
    height: 50,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    marginBottom: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: theme.colors.text.secondary,
    color: '#fff',
    fontSize: 16,
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 15,
    top: 12,
    padding: 5,
  },
  inputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 15,
  },
  button: {
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  loginButton: {
    backgroundColor: theme.colors.text.secondary,
  },
  signUpButton: {
    backgroundColor: theme.colors.yellow.dark,
  },
  backButton: {
    backgroundColor: theme.colors.gray.dark,
  },
  backButtonSpacing: {
    marginTop: 15,
  },
  forgotPasswordButton: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginTop: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  legalContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  legalText: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
    lineHeight: 18,
  },
  legalLink: {
    fontSize: 12,
    textDecorationLine: 'underline',
    color: '#fff',
    opacity: 0.8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    color: '#fff',
    paddingHorizontal: 16,
    opacity: 0.7,
  },
});
