import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '~/contexts/AuthContext';
import { useTheme } from '~/contexts/ThemeContext';
import { Button } from '~/components/Button';
import { Text } from '~/components/Text';
import { Container } from '~/components/Container';

export default function LoginScreen() {
  const { theme } = useTheme();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    console.log('signInWithEmail called', { email, password: '***' });

    if (!email || !password) {
      if (Platform.OS === 'web') {
        alert('Bitte E-Mail und Passwort eingeben');
      } else {
        Alert.alert('Fehler', 'Bitte E-Mail und Passwort eingeben');
      }
      return;
    }

    setLoading(true);
    const { error } = await signIn(email.trim(), password);

    if (error) {
      console.error('Login error:', error);
      const errorMessage = error.message || 'Anmeldung fehlgeschlagen';
      if (Platform.OS === 'web') {
        alert(`Login fehlgeschlagen: ${errorMessage}`);
      } else {
        Alert.alert('Login fehlgeschlagen', errorMessage);
      }
    } else {
      console.log('Login successful, redirecting...');
      router.replace('/(tabs)/generate');
    }
    setLoading(false);
  }

  // Simple test render for web
  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <Text variant="h2" color="inverse">Login Screen - Web Version</Text>
        <Text variant="body" color="inverse" style={{ marginTop: 20 }}>If you see this, React Native Web is working!</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Container>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
        <View className="flex-1 justify-center">
          <View className="mb-8">
            <Text variant="h1" color="primary" align="center" className="mb-2">Willkommen zurück</Text>
            <Text variant="body" color="secondary" align="center">Melde dich an, um fortzufahren</Text>
          </View>

          <View className="space-y-4">
            <View>
              <Text variant="label" color="secondary" className="mb-1">E-Mail</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.input, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: theme.colors.text.primary }}
                onChangeText={setEmail}
                value={email}
                placeholder="deine@email.de"
                placeholderTextColor={theme.colors.text.tertiary}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            <View>
              <Text variant="label" color="secondary" className="mb-1">Passwort</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.input, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: theme.colors.text.primary }}
                onChangeText={setPassword}
                value={password}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={theme.colors.text.tertiary}
                autoCapitalize="none"
                autoComplete="password"
              />
            </View>

            <Button
              title={loading ? "Anmelden..." : "Anmelden"}
              onPress={signInWithEmail}
              disabled={loading}
              className="mt-4"
            />

            <View className="flex-row justify-center mt-6">
              <Text variant="body" color="secondary">Noch kein Konto? </Text>
              <Link href="/(auth)/register" asChild>
                <Text variant="body" weight="semibold" style={{ color: theme.colors.primary.default }}>Registrieren</Text>
              </Link>
            </View>

            <View className="flex-row justify-center mt-2">
              <Link href="/(auth)/reset-password" asChild>
                <Text variant="body" style={{ color: theme.colors.primary.default }}>Passwort vergessen?</Text>
              </Link>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Container>
    </SafeAreaView>
  );
}
