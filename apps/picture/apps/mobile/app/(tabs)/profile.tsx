import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  TextInput,
  View,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '~/components/Button';
import { Text } from '~/components/Text';
import { PageHeader } from '~/components/PageHeader';
import { useAuth } from '~/contexts/AuthContext';
import { supabase } from '~/utils/supabase';
import { useModelSelection } from '~/store/modelStore';
import { ThemePicker } from '~/components/ThemePicker';
import { useTheme } from '~/contexts/ThemeContext';
import { useViewStore } from '~/store/viewStore';
import { ViewToggle } from '~/components/ViewToggle';
import { GenerationSettings } from '~/components/settings/GenerationSettings';
import { getArchivedCount } from '~/services/archiveService';

type Profile = {
  username: string;
  email: string;
  avatar_url: string | null;
};

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [updating, setUpdating] = useState(false);
  const [username, setUsername] = useState('');
  const [archivedCount, setArchivedCount] = useState(0);
  const { resetLoadingState, isLoading: modelsLoading } = useModelSelection();
  const { galleryViewMode, setGalleryViewMode, exploreViewMode, setExploreViewMode } = useViewStore();

  useEffect(() => {
    console.log('👤 ProfileScreen - User state:', {
      hasUser: !!user,
      userId: user?.id,
      email: user?.email,
    });

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) {
      console.log('❌ fetchProfile: No user');
      return;
    }

    console.log('🔍 Fetching profile for user:', user.id);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, email, avatar_url')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('❌ Profile fetch error:', error);
        throw error;
      }

      console.log('✅ Profile fetched:', data);
      setProfile(data);
      setUsername(data.username || '');
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
    }
  };

  const updateProfile = async () => {
    if (!user) return;
    
    setUpdating(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: username.trim() })
        .eq('id', user.id);

      if (error) throw error;

      Alert.alert('Erfolg', 'Profil wurde aktualisiert');
      fetchProfile();
    } catch (error: any) {
      Alert.alert('Fehler', error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Abmelden',
      'Bist du sicher, dass du dich abmelden möchtest?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Abmelden',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚪 Starting sign out process...');
              await signOut();
              console.log('✅ Sign out completed - root layout will handle navigation');
              // Don't manually navigate - let the root layout handle it automatically
            } catch (error) {
              console.error('❌ Sign out error:', error);
              Alert.alert('Fehler', 'Abmeldung fehlgeschlagen');
            }
          }
        }
      ]
    );
  };

  const getImageStats = async () => {
    if (!user) return { total: 0, favorites: 0 };

    const { data: images } = await supabase
      .from('images')
      .select('id, is_favorite, archived_at')
      .eq('user_id', user.id)
      .is('archived_at', null); // Only count non-archived images

    return {
      total: images?.length || 0,
      favorites: images?.filter(img => img.is_favorite).length || 0
    };
  };

  const [stats, setStats] = useState({ total: 0, favorites: 0 });

  useEffect(() => {
    if (user) {
      getImageStats().then(setStats);
      getArchivedCount(user.id).then(setArchivedCount);
    }
  }, [user]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 80 }}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 12, paddingBottom: 28 }}>
          <Text variant="title" weight="bold">Profil</Text>
        </View>

        <View style={{ paddingHorizontal: 4 }}>
          {/* Profile Card */}
          <View style={{ backgroundColor: theme.colors.surface, borderRadius: 16, padding: 20, marginBottom: 16, ...theme.shadows.md }}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={{
                width: 80,
                height: 80,
                backgroundColor: theme.colors.primary.default,
                borderRadius: 40,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12
              }}>
                <Text style={{ fontSize: 36 }}>👤</Text>
              </View>
              <Text variant="h3" weight="bold" align="center">{profile?.username || 'Benutzer'}</Text>
              <Text variant="body" color="secondary" align="center">{profile?.email}</Text>
            </View>

            {/* Stats */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
              <View style={{ alignItems: 'center' }}>
                <Text variant="h2" weight="bold" style={{ color: theme.colors.primary.default }}>{stats.total}</Text>
                <Text variant="bodySmall" color="secondary">Bilder</Text>
              </View>
              <View style={{ width: 1, backgroundColor: theme.colors.border }} />
              <View style={{ alignItems: 'center' }}>
                <Text variant="h2" weight="bold" style={{ color: theme.colors.primary.default }}>{stats.favorites}</Text>
                <Text variant="bodySmall" color="secondary">Favoriten</Text>
              </View>
            </View>
          </View>

          {/* Archive Link */}
          <Pressable
            onPress={() => router.push('/archive')}
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              ...theme.shadows.sm,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  backgroundColor: theme.colors.input,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="archive-outline" size={24} color={theme.colors.text.primary} />
              </View>
              <View>
                <Text variant="body" weight="semibold">Archiv</Text>
                <Text variant="bodySmall" color="secondary">
                  {archivedCount === 0
                    ? 'Keine archivierten Bilder'
                    : archivedCount === 1
                      ? '1 archiviertes Bild'
                      : `${archivedCount} archivierte Bilder`}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {archivedCount > 0 && (
                <View
                  style={{
                    backgroundColor: theme.colors.primary.default,
                    borderRadius: 12,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}
                >
                  <Text variant="bodySmall" weight="semibold" style={{ color: '#fff' }}>
                    {archivedCount}
                  </Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
            </View>
          </Pressable>

          {/* Username Settings */}
          <View style={{ marginBottom: 16 }}>
            <Text variant="label" color="secondary" style={{ marginBottom: 8, marginLeft: 4 }}>Benutzername</Text>
            <View style={{ backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, ...theme.shadows.sm }}>
              <TextInput
                style={{
                  backgroundColor: theme.colors.input,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 16,
                  color: theme.colors.text.primary,
                  marginBottom: 12
                }}
                value={username}
                onChangeText={setUsername}
                placeholder="Dein Benutzername"
                placeholderTextColor={theme.colors.text.tertiary}
                autoCapitalize="none"
              />
              <Button
                title="Profil aktualisieren"
                onPress={updateProfile}
                loading={updating}
                disabled={!username.trim() || username === profile?.username}
                fullWidth
              />
            </View>
          </View>

          {/* Theme Settings */}
          <View style={{ marginBottom: 16 }}>
            <Text variant="label" color="secondary" style={{ marginBottom: 8, marginLeft: 4 }}>Design</Text>
            <ThemePicker />
          </View>

          {/* Generation Defaults */}
          <View style={{ marginBottom: 16 }}>
            <Text variant="label" color="secondary" style={{ marginBottom: 8, marginLeft: 4 }}>Generierungs-Einstellungen</Text>
            <GenerationSettings />
          </View>

          {/* Gallery View Settings */}
          <View style={{ marginBottom: 16 }}>
            <Text variant="label" color="secondary" style={{ marginBottom: 8, marginLeft: 4 }}>Galerie Ansicht</Text>
            <View style={{ backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, ...theme.shadows.sm }}>
              <Text variant="body" color="secondary" style={{ marginBottom: 12 }}>
                Standard-Ansicht für deine Galerie
              </Text>
              <ViewToggle
                mode={galleryViewMode}
                onModeChange={setGalleryViewMode}
                bottom={0}
                left={0}
                style={{ position: 'relative' }}
              />
            </View>
          </View>

          {/* Explore View Settings */}
          <View style={{ marginBottom: 16 }}>
            <Text variant="label" color="secondary" style={{ marginBottom: 8, marginLeft: 4 }}>Entdecken Ansicht</Text>
            <View style={{ backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, ...theme.shadows.sm }}>
              <Text variant="body" color="secondary" style={{ marginBottom: 12 }}>
                Standard-Ansicht für öffentliche Bilder
              </Text>
              <ViewToggle
                mode={exploreViewMode}
                onModeChange={setExploreViewMode}
                bottom={0}
                left={0}
                style={{ position: 'relative' }}
              />
            </View>
          </View>

          {/* Pinch Gesture Info */}
          <View style={{ marginBottom: 16 }}>
            <View style={{ backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, ...theme.shadows.sm }}>
              <View style={{ backgroundColor: theme.colors.input, borderRadius: 12, padding: 12 }}>
                <Text variant="bodySmall" color="secondary" style={{ marginBottom: 8 }}>
                  💡 <Text weight="semibold">Pinch-to-Zoom Geste:</Text>
                </Text>
                <Text variant="bodySmall" color="tertiary" style={{ marginBottom: 4 }}>
                  • <Text weight="semibold">Finger auseinander</Text> (Pinch-Out): Größere Bilder
                </Text>
                <Text variant="bodySmall" color="tertiary" style={{ marginBottom: 4 }}>
                  • <Text weight="semibold">Finger zusammen</Text> (Pinch-In): Kleinere Bilder
                </Text>
                <Text variant="bodySmall" color="tertiary" style={{ marginTop: 8 }}>
                  Verwende die Pinch-Geste in Galerie & Entdecken, um zwischen den Ansichten zu wechseln - genau wie in der iOS Fotos App!
                </Text>
              </View>
            </View>
          </View>

          {/* Debug Panel */}
          {modelsLoading && (
            <View style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', borderWidth: 1, borderColor: '#ca8a04', borderRadius: 16, padding: 16, marginBottom: 16 }}>
              <Text variant="body" weight="semibold" style={{ color: '#facc15', marginBottom: 8 }}>⚠️ Debug: Models Loading</Text>
              <Text variant="bodySmall" style={{ color: '#fde047', marginBottom: 12 }}>
                Models sind noch am Laden. Falls es hängt:
              </Text>
              <Button
                title="Loading State zurücksetzen"
                onPress={() => {
                  resetLoadingState();
                  Alert.alert('Reset', 'Loading State wurde zurückgesetzt');
                }}
                variant="secondary"
              />
            </View>
          )}

          {/* Danger Zone */}
          <View style={{ marginTop: 32, marginBottom: 16 }}>
            <Text variant="label" color="secondary" style={{ marginBottom: 8, marginLeft: 4 }}>Konto</Text>
            <View style={{ backgroundColor: theme.colors.surface, borderRadius: 16, overflow: 'hidden', ...theme.shadows.sm }}>
              <Pressable
                onPress={handleSignOut}
                style={{
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      backgroundColor: theme.colors.error + '20',
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="log-out-outline" size={24} color={theme.colors.error} />
                  </View>
                  <View>
                    <Text variant="body" weight="semibold" style={{ color: theme.colors.error }}>Abmelden</Text>
                    <Text variant="bodySmall" color="secondary">Von diesem Gerät abmelden</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
              </Pressable>
            </View>
          </View>

          {/* Credits */}
          <View style={{ marginTop: 16, marginBottom: 32, alignItems: 'center' }}>
            <Text variant="bodySmall" color="tertiary" align="center">
              Entwickelt mit ❤️ von Memoro GmbH
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}