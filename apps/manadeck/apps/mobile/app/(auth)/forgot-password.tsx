import React, { useState } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/Text';
import { Icon } from '~/components/ui/Icon';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { useThemeColors } from '~/utils/themeUtils';
import { spacing } from '~/utils/spacing';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const colors = useThemeColors();

  const { resetPassword, isLoading, clearError } = useAuthStore();

  const validateForm = () => {
    const newErrors: { email?: string } = {};

    if (!email) {
      newErrors.email = 'E-Mail ist erforderlich';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Ungültige E-Mail-Adresse';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;

    try {
      clearError();
      await resetPassword(email);
      setIsSubmitted(true);
    } catch (err: any) {
      Alert.alert('Zurücksetzen fehlgeschlagen', err.message || 'Ein Fehler ist aufgetreten');
    }
  };

  if (isSubmitted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
          <Card padding="lg" variant="elevated" style={{ alignItems: 'center' }}>
            <View style={{ marginBottom: spacing.lg, height: 80, width: 80, alignItems: 'center', justifyContent: 'center', borderRadius: 40, backgroundColor: '#10b98120' }}>
              <Icon name="checkmark-circle" size={48} color="#10b981" library="Ionicons" />
            </View>

            <Text style={{ marginBottom: 8, textAlign: 'center', fontSize: 24, fontWeight: 'bold', color: colors.foreground }}>
              E-Mail gesendet!
            </Text>

            <Text style={{ marginBottom: spacing.xl, textAlign: 'center', color: colors.mutedForeground }}>
              Wir haben dir eine E-Mail mit Anweisungen zum Zurücksetzen deines Passworts an {email}{' '}
              gesendet.
            </Text>

            <Button onPress={() => router.replace('/(auth)/login')} fullWidth size="lg">
              Zurück zur Anmeldung
            </Button>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 32 }}>
            <Pressable onPress={() => router.back()} style={{ marginBottom: spacing.xl, flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="arrow-back" size={24} color={colors.foreground} library="Ionicons" />
              <Text style={{ marginLeft: 8, color: colors.foreground }}>Zurück</Text>
            </Pressable>

            <View style={{ flex: 1, justifyContent: 'center' }}>
              <View style={{ marginBottom: spacing.xxl }}>
                <Text style={{ marginBottom: spacing.sm, textAlign: 'center', fontSize: 32, fontWeight: 'bold', color: colors.foreground }}>
                  Passwort vergessen?
                </Text>
                <Text style={{ textAlign: 'center', color: colors.mutedForeground }}>
                  Kein Problem! Gib deine E-Mail-Adresse ein und wir senden dir Anweisungen zum
                  Zurücksetzen.
                </Text>
              </View>

              <Card padding="lg" variant="elevated">
                <Input
                  label="E-Mail-Adresse"
                  type="email"
                  placeholder="deine@email.de"
                  value={email}
                  onChangeText={setEmail}
                  error={errors.email}
                  leftIcon="mail-outline"
                  autoComplete="email"
                />

                <Button onPress={handleResetPassword} loading={isLoading} fullWidth size="lg">
                  Zurücksetzen-Link senden
                </Button>

                <View style={{ marginTop: spacing.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: colors.mutedForeground }}>Erinnerst du dich wieder? </Text>
                  <Link href="/(auth)/login" asChild>
                    <Pressable>
                      <Text style={{ fontWeight: '600', color: colors.primary }}>Anmelden</Text>
                    </Pressable>
                  </Link>
                </View>
              </Card>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
