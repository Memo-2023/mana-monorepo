import React, { useEffect, useState } from 'react';
import { View, ScrollView, Pressable, Alert, Platform, ActivityIndicator } from 'react-native';
import { Text } from '~/components/ui/Text';
import { useAuthStore } from '~/store/authStore';
import { useDeckStore } from '~/store/deckStore';
import { Card } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { Switch } from '~/components/ui/Switch';
import { ThemeSwitcher } from '~/components/ui/ThemeSwitcher';
import { Icon } from '~/components/ui/Icon';
import { SettingsSection } from '~/components/ui/SettingsSection';
import { SettingsItem } from '~/components/ui/SettingsItem';
import { router } from 'expo-router';
import { useThemeColors } from '~/utils/themeUtils';
import { useCredits } from '~/hooks/useCredits';
import { PageHeader } from '~/components/ui/PageHeader';
import { spacing } from '~/utils/spacing';

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const { decks, fetchDecks } = useDeckStore();
  const { credits, loading: creditsLoading, error: creditsError, refetch } = useCredits();
  const colors = useThemeColors(); // This triggers theme reactivity

  // Settings state
  const [notifications, setNotifications] = useState({
    pushNotifications: true,
    emailNotifications: false,
    studyReminders: true,
    weeklyProgress: true,
  });

  const [privacy, setPrivacy] = useState({
    profilePublic: false,
    shareProgress: true,
    allowAnalytics: true,
  });

  const [study, setStudy] = useState({
    autoPlay: false,
    soundEffects: true,
    vibration: true,
    darkModeForStudy: false,
  });

  useEffect(() => {
    fetchDecks();
  }, []);

  const handleSignOut = async () => {
    // Use native confirm for web compatibility
    if (Platform.OS === 'web') {
      if (window.confirm('Möchtest du dich wirklich abmelden?')) {
        try {
          await signOut();
          router.replace('/(auth)/login');
        } catch (error) {
          console.error('Sign out error:', error);
          window.alert('Abmeldung fehlgeschlagen');
        }
      }
    } else {
      Alert.alert('Abmelden', 'Möchtest du dich wirklich abmelden?', [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Abmelden',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Fehler', 'Abmeldung fehlgeschlagen');
            }
          },
        },
      ]);
    }
  };


  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: spacing.tabBar.clearance,
        }}>
        <PageHeader title="Profil" />
        <View style={{ paddingHorizontal: spacing.container.horizontal, paddingTop: spacing.container.top }}>
          {/* User Profile Section */}
          <Card padding="lg" variant="elevated" style={{ marginBottom: spacing.section }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{
                marginBottom: spacing.content.small,
                height: 80,
                width: 80,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 40,
                backgroundColor: colors.primary
              }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>
                  {user?.email?.[0].toUpperCase() || 'U'}
                </Text>
              </View>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground }}>
                {user?.email?.split('@')[0] || 'Benutzer'}
              </Text>
              <Text style={{ marginTop: spacing.xs, fontSize: 14, color: colors.mutedForeground }}>{user?.email}</Text>
            </View>
          </Card>

          {/* Mana Balance Section */}
          <Card padding="lg" variant="elevated" style={{ marginBottom: spacing.section }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: spacing.content.small
              }}>
                <Icon
                  name="flash"
                  library="Ionicons"
                  size={24}
                  color={colors.primary}
                  style={{ marginRight: spacing.xs }}
                />
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
                  Mana Balance
                </Text>
              </View>

              {creditsLoading ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.content.small }} />
              ) : creditsError ? (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, color: colors.destructive, marginBottom: spacing.content.small }}>
                    Fehler beim Laden
                  </Text>
                  <Pressable
                    onPress={refetch}
                    style={{
                      paddingHorizontal: spacing.lg,
                      paddingVertical: spacing.sm,
                      backgroundColor: colors.primary,
                      borderRadius: 8
                    }}
                  >
                    <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                      Erneut versuchen
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <Text style={{
                    fontSize: 32,
                    fontWeight: 'bold',
                    color: colors.primary,
                    marginVertical: spacing.content.small
                  }}>
                    {credits ?? 0}
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.mutedForeground }}>
                    Credits verfügbar
                  </Text>
                </>
              )}
            </View>
          </Card>

          {/* Benachrichtigungen */}
          <SettingsSection title="Benachrichtigungen">
            <SettingsItem
              title="Push-Benachrichtigungen"
              description="Erhalte Benachrichtigungen auf deinem Gerät"
              rightElement={
                <Switch
                  value={notifications.pushNotifications}
                  onValueChange={(value) =>
                    setNotifications((prev) => ({ ...prev, pushNotifications: value }))
                  }
                />
              }
            />
            <SettingsItem
              title="E-Mail Benachrichtigungen"
              description="Erhalte Updates per E-Mail"
              rightElement={
                <Switch
                  value={notifications.emailNotifications}
                  onValueChange={(value) =>
                    setNotifications((prev) => ({ ...prev, emailNotifications: value }))
                  }
                />
              }
            />
            <SettingsItem
              title="Lern-Erinnerungen"
              description="Tägliche Erinnerungen zum Lernen"
              rightElement={
                <Switch
                  value={notifications.studyReminders}
                  onValueChange={(value) =>
                    setNotifications((prev) => ({ ...prev, studyReminders: value }))
                  }
                />
              }
            />
            <SettingsItem
              title="Wochen-Fortschritt"
              description="Wöchentliche Zusammenfassung deines Fortschritts"
              rightElement={
                <Switch
                  value={notifications.weeklyProgress}
                  onValueChange={(value) =>
                    setNotifications((prev) => ({ ...prev, weeklyProgress: value }))
                  }
                />
              }
              isLast
            />
          </SettingsSection>

          {/* Lern-Einstellungen */}
          <SettingsSection title="Lern-Einstellungen">
            <SettingsItem
              title="Auto-Play Audio"
              description="Automatische Audiowiedergabe bei Audio-Karten"
              rightElement={
                <Switch
                  value={study.autoPlay}
                  onValueChange={(value) => setStudy((prev) => ({ ...prev, autoPlay: value }))}
                />
              }
            />
            <SettingsItem
              title="Sound-Effekte"
              description="Akustisches Feedback beim Lernen"
              rightElement={
                <Switch
                  value={study.soundEffects}
                  onValueChange={(value) => setStudy((prev) => ({ ...prev, soundEffects: value }))}
                />
              }
            />
            <SettingsItem
              title="Vibration"
              description="Haptisches Feedback aktivieren"
              rightElement={
                <Switch
                  value={study.vibration}
                  onValueChange={(value) => setStudy((prev) => ({ ...prev, vibration: value }))}
                />
              }
              isLast
            />
          </SettingsSection>

          {/* Design & Darstellung */}
          <SettingsSection title="Design & Darstellung" noPadding>
            <ThemeSwitcher />
          </SettingsSection>

          {/* Datenschutz */}
          <SettingsSection title="Datenschutz & Sicherheit">
            <SettingsItem
              title="Öffentliches Profil"
              description="Dein Profil für andere sichtbar machen"
              rightElement={
                <Switch
                  value={privacy.profilePublic}
                  onValueChange={(value) =>
                    setPrivacy((prev) => ({ ...prev, profilePublic: value }))
                  }
                />
              }
            />
            <SettingsItem
              title="Fortschritt teilen"
              description="Erlaube anderen, deinen Lernfortschritt zu sehen"
              rightElement={
                <Switch
                  value={privacy.shareProgress}
                  onValueChange={(value) =>
                    setPrivacy((prev) => ({ ...prev, shareProgress: value }))
                  }
                />
              }
            />
            <SettingsItem
              title="Analyse-Daten"
              description="Hilf uns, die App zu verbessern"
              rightElement={
                <Switch
                  value={privacy.allowAnalytics}
                  onValueChange={(value) =>
                    setPrivacy((prev) => ({ ...prev, allowAnalytics: value }))
                  }
                />
              }
              isLast
            />
          </SettingsSection>

          {/* Weitere Optionen */}
          <SettingsSection title="Weitere Optionen">
            <SettingsItem title="Profil bearbeiten" onPress={() => {}} />
            <SettingsItem
              title="Export/Import"
              description="Deine Daten sichern oder übertragen"
              onPress={() => {}}
            />
            <SettingsItem title="Hilfe & Support" onPress={() => {}} />
            <SettingsItem
              title="Über die App"
              onPress={() => {}}
              isLast
            />
          </SettingsSection>

          {/* Abmelden */}
          <View style={{ marginTop: spacing.lg }}>
            <Button
              onPress={handleSignOut}
              variant="danger"
              fullWidth
              leftIcon={<Icon name="log-out-outline" size={20} color="white" library="Ionicons" />}>
              Abmelden
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
