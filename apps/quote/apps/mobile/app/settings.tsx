import { Stack, useRouter } from 'expo-router';
import { View, ScrollView, Switch, Pressable, TextInput, TouchableOpacity, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState, useEffect } from 'react';
import { useSettingsStore, useIsDarkMode, ThemeType } from '~/store/settingsStore';
import { useQuotesStore } from '~/store/quotesStore';
import { useTranslation } from 'react-i18next';
import Text from '~/components/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { themeDisplayNames, themeDescriptions } from '~/themes/definitions';
import usePremiumStore from '~/store/premiumStore';
import RevenueCat from '~/services/RevenueCat';
import { CloudSyncButton } from '~/components/CloudSyncButton';
import { useOnboardingStore } from '~/store/onboardingStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '~/hooks/useTheme';

export default function Settings() {
  const { t } = useTranslation();
  const router = useRouter();
  const isDarkMode = useIsDarkMode();
  const { colors } = useTheme();
  const changeQuoteLanguage = useQuotesStore(state => state.changeLanguage);
  const { 
    themeMode, 
    setThemeMode,
    themeType,
    setThemeType, 
    enableHaptics,
    setHaptics,
    dailyQuoteNotification,
    setDailyNotification,
    language,
    setLanguage,
    userName,
    setUserName
  } = useSettingsStore();
  
  const { 
    isPremium, 
    premiumType, 
    checkPremiumStatus,
    getRemainingFavorites,
    getRemainingSearches,
    getRemainingCollections 
  } = usePremiumStore();
  
  const [notifications, setNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  
  useEffect(() => {
    checkPremiumStatus();
  }, []);

  const toggleSwitch = (setter: (value: boolean) => void, value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setter(!value);
  };

  const handleResetAllData = async () => {
    Alert.alert(
      t('settings.resetAllData', { defaultValue: 'Alle Daten zurücksetzen' }),
      t('settings.resetAllDataConfirm', { defaultValue: 'Möchtest du wirklich ALLE Daten löschen? Dies umfasst Favoriten, Playlists, Einstellungen und alle anderen App-Daten. Diese Aktion kann nicht rückgängig gemacht werden!' }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel'
        },
        {
          text: t('settings.reset', { defaultValue: 'Zurücksetzen' }),
          style: 'destructive',
          onPress: async () => {
            try {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

              // Clear AsyncStorage completely
              await AsyncStorage.clear();

              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

              // Reload the app by navigating to index
              // This will cause all stores to re-initialize with empty data
              if (Platform.OS === 'web') {
                window.location.reload();
              } else {
                router.replace('/(tabs)/');
              }
            } catch (error) {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert(
                t('common.error', { defaultValue: 'Fehler' }),
                t('settings.resetError', { defaultValue: 'Daten konnten nicht zurückgesetzt werden.' })
              );
            }
          }
        }
      ]
    );
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: t('headers.settings'),
          headerShown: true,
          headerTransparent: true,
          headerBlurEffect: isDarkMode ? 'dark' : 'light',
          headerStyle: {
            backgroundColor: 'transparent',
          },
          headerTintColor: isDarkMode ? '#ffffff' : '#000000',
          headerShadowVisible: false,
          headerBackTitle: t('common.back'),
        }} 
      />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120, paddingTop: 116 }}
        >
        {/* Settings Options */}
        <View className="px-6">
              {/* Premium Status Section */}
              <View className="mb-8">
                <Text variant="label" color="secondary" className="mb-4">
                  {t('settings.subscription')}
                </Text>
                
                <TouchableOpacity
                  onPress={() => {
                    if (!isPremium) {
                      router.push('/paywall');
                    }
                  }}
                  activeOpacity={isPremium ? 1 : 0.7}
                >
                  <View className={`${isDarkMode ? 'bg-white/10' : 'bg-black/10'} rounded-2xl p-4 ${isPremium ? 'border-2' : ''}`}
                    style={isPremium ? { borderColor: '#8B5CF6' } : {}}>
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center">
                        <View className={`w-10 h-10 rounded-full ${isPremium ? 'bg-purple-500/20' : isDarkMode ? 'bg-white/10' : 'bg-black/10'} items-center justify-center mr-3`}>
                          <Ionicons 
                            name={isPremium ? "star" : "star-outline"} 
                            size={20} 
                            color={isPremium ? "#8B5CF6" : isDarkMode ? "#fff" : "#000"} 
                          />
                        </View>
                        <View>
                          <Text variant="bodyLarge" weight="bold" color="primary">
                            {isPremium ? 'Zitare Premium' : 'Zitare Free'}
                          </Text>
                          {isPremium && (
                            <Text variant="caption" color="secondary">
                              {premiumType === 'lifetime' ? 'Lifetime' : 
                               premiumType === 'yearly' ? 'Jahresabo' : 'Monatsabo'}
                            </Text>
                          )}
                        </View>
                      </View>
                      {!isPremium && (
                        <View className={`${isDarkMode ? 'bg-white/20' : 'bg-black/20'} px-3 py-1 rounded-full`}>
                          <Text variant="caption" weight="semibold" color="primary">
                            Upgrade
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    {isPremium ? (
                      <View>
                        <Text variant="bodySmall" color="secondary" className="mb-2">
                          Du genießt alle Premium-Features ohne Limits! 
                        </Text>
                        <View className="flex-row flex-wrap">
                          <View className="flex-row items-center mr-4 mb-1">
                            <Ionicons name="checkmark-circle" size={16} color="#8B5CF6" />
                            <Text variant="caption" color="secondary" className="ml-1">
                              Unlimited Favoriten
                            </Text>
                          </View>
                          <View className="flex-row items-center mr-4 mb-1">
                            <Ionicons name="checkmark-circle" size={16} color="#8B5CF6" />
                            <Text variant="caption" color="secondary" className="ml-1">
                              Unlimited Suche
                            </Text>
                          </View>
                          <View className="flex-row items-center mb-1">
                            <Ionicons name="checkmark-circle" size={16} color="#8B5CF6" />
                            <Text variant="caption" color="secondary" className="ml-1">
                              Unlimited Sammlungen
                            </Text>
                          </View>
                        </View>
                      </View>
                    ) : (
                      <View>
                        <Text variant="bodySmall" color="secondary" className="mb-3">
                          Deine aktuellen Limits:
                        </Text>
                        <View className="space-y-2">
                          <View className="flex-row items-center justify-between mb-2">
                            <View className="flex-row items-center">
                              <Ionicons name="heart-outline" size={16} color={isDarkMode ? "#fff" : "#000"} />
                              <Text variant="caption" color="secondary" className="ml-2">
                                Favoriten heute
                              </Text>
                            </View>
                            <Text variant="caption" weight="semibold" color="primary">
                              {getRemainingFavorites() === -1 ? '∞' : `${getRemainingFavorites()} / 3`}
                            </Text>
                          </View>
                          <View className="flex-row items-center justify-between mb-2">
                            <View className="flex-row items-center">
                              <Ionicons name="search-outline" size={16} color={isDarkMode ? "#fff" : "#000"} />
                              <Text variant="caption" color="secondary" className="ml-2">
                                Suchen heute
                              </Text>
                            </View>
                            <Text variant="caption" weight="semibold" color="primary">
                              {getRemainingSearches() === -1 ? '∞' : `${getRemainingSearches()} / 3`}
                            </Text>
                          </View>
                          <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center">
                              <Ionicons name="folder-outline" size={16} color={isDarkMode ? "#fff" : "#000"} />
                              <Text variant="caption" color="secondary" className="ml-2">
                                Sammlung diese Woche
                              </Text>
                            </View>
                            <Text variant="caption" weight="semibold" color="primary">
                              {getRemainingCollections() === -1 ? '∞' : `${getRemainingCollections()} / 1`}
                            </Text>
                          </View>
                        </View>
                        <View className={`mt-3 pt-3 border-t ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
                          <Text variant="caption" weight="semibold" style={{ color: '#8B5CF6' }} className="text-center">
                            Tippe für unbegrenzte Features →
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
              
              {/* User Section */}
              <View className="mb-8">
                <Text variant="label" color="secondary" className="mb-4">
                  {t('settings.personal')}
                </Text>
                
                <View className={`${isDarkMode ? 'bg-white/10' : 'bg-black/10'} rounded-2xl p-4`}>
                  <Text variant="bodyLarge" weight="semibold" color="primary" className="mb-2">
                    {t('settings.yourName')}
                  </Text>
                  <TextInput
                    value={userName}
                    onChangeText={setUserName}
                    placeholder={t('settings.yourNamePlaceholder')}
                    placeholderTextColor={isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
                    className={`${isDarkMode ? 'bg-white/10 text-white' : 'bg-black/10 text-black'} rounded-xl px-4 py-2.5`}
                    style={{ fontSize: 16 }}
                  />
                  <Text variant="caption" color="secondary" className="mt-2">
                    {t('settingsDesc.defaultAuthor')}
                  </Text>
                </View>
              </View>

              {/* Theme Section */}
              <View className="mb-8">
                <Text variant="label" color="secondary" className="mb-4">
                  {t('settings.appearance')}
                </Text>
                
                {/* Dark Mode Toggle */}
                <View className={`${isDarkMode ? 'bg-white/10' : 'bg-black/10'} rounded-2xl p-4 mb-4`}>
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1 mr-4">
                      <Text variant="bodyLarge" weight="semibold" color="primary">{t('settings.darkMode')}</Text>
                      <Text variant="bodySmall" color="secondary" className="mt-1">{t('settings.darkModeDesc')}</Text>
                    </View>
                    <Switch
                      trackColor={{ false: '#3e3e3e', true: '#4c4c4c' }}
                      thumbColor={isDarkMode ? '#ffffff' : '#f4f3f4'}
                      ios_backgroundColor="#3e3e3e"
                      onValueChange={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setThemeMode(isDarkMode ? 'light' : 'dark');
                      }}
                      value={isDarkMode}
                    />
                  </View>
                </View>

                {/* Theme Selection */}
                <View className={`${isDarkMode ? 'bg-white/10' : 'bg-black/10'} rounded-2xl overflow-hidden`}>
                  <View className="p-4 pb-2">
                    <Text variant="bodyLarge" weight="semibold" color="primary">
                      {t('settings.colorScheme')}
                    </Text>
                  </View>
                  <View className="px-3 pb-3 gap-2.5">
                    {(['default', 'colorful', 'nature'] as ThemeType[]).map((theme) => (
                      <Pressable
                        key={theme}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setThemeType(theme);
                        }}
                      >
                        <View className="relative rounded-2xl overflow-hidden"
                        style={{
                          borderWidth: themeType === theme ? 2 : 1,
                          borderColor: themeType === theme
                            ? (theme === 'default' ? '#64748b' : theme === 'colorful' ? '#e11d48' : '#16a34a')
                            : isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                          height: 68
                        }}>
                          <LinearGradient
                            colors={
                              theme === 'default' 
                                ? isDarkMode ? ['#1e293b', '#334155'] : ['#94a3b8', '#cbd5e1']
                                : theme === 'colorful'
                                ? isDarkMode ? ['#be185d', '#e11d48'] : ['#fb7185', '#fbbf24']
                                : isDarkMode ? ['#16a34a', '#22c55e'] : ['#86efac', '#34d399']
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.3 }}
                          />
                          <View className="absolute inset-0 flex-row items-center px-4">
                            {/* Theme Preview Circles */}
                            <View className="flex-row mr-2.5">
                              <View
                                className="w-6 h-6 rounded-full"
                                style={{
                                  backgroundColor: theme === 'default'
                                    ? '#64748b'
                                    : theme === 'colorful'
                                    ? '#e11d48'
                                    : '#16a34a',
                                  marginRight: -5
                                }}
                              />
                              <View
                                className="w-6 h-6 rounded-full border"
                                style={{
                                  backgroundColor: theme === 'default'
                                    ? '#94a3b8'
                                    : theme === 'colorful'
                                    ? '#f59e0b'
                                    : '#22c55e',
                                  borderColor: isDarkMode ? '#000' : '#fff'
                                }}
                              />
                            </View>
                            {/* Theme Name and Description */}
                            <View className="flex-1 mr-1.5">
                              <Text
                                variant="body"
                                weight={themeType === theme ? "bold" : "semibold"}
                                color="primary"
                                numberOfLines={1}
                              >
                                {themeDisplayNames[theme]}
                              </Text>
                              <Text
                                variant="caption"
                                color="secondary"
                                numberOfLines={1}
                                style={{ fontSize: 10 }}
                              >
                                {themeDescriptions[theme]}
                              </Text>
                            </View>
                            {/* Selection Indicator */}
                            {themeType === theme && (
                              <View>
                                <Ionicons 
                                  name="checkmark-circle" 
                                  size={22} 
                                  color={theme === 'default' ? '#64748b' : theme === 'colorful' ? '#e11d48' : '#16a34a'}
                                />
                              </View>
                            )}
                          </View>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>


              {/* Language Section */}
              <View className="mb-8">
                <Text variant="label" color="secondary" className="mb-4">
                  {t('settings.language')}
                </Text>
                
                <View className={`${isDarkMode ? 'bg-white/10' : 'bg-black/10'} rounded-2xl p-4`}>
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1 mr-4">
                      <Text variant="bodyLarge" weight="semibold" color="primary">
                        {t('settings.language')}
                      </Text>
                      <Text variant="bodySmall" color="secondary" className="mt-1">
                        {t('settings.languageDesc')}
                      </Text>
                    </View>
                    <View className="flex-row">
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setLanguage('de');
                          changeQuoteLanguage('de');
                        }}
                        className={`${language === 'de' ? (isDarkMode ? 'bg-white/20' : 'bg-black/20') : (isDarkMode ? 'bg-white/10' : 'bg-black/10')} px-3 py-1.5 rounded-l-full`}
                      >
                        <Text className={`${isDarkMode ? 'text-white' : 'text-black'} text-sm font-medium`}>
                          DE
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setLanguage('en');
                          changeQuoteLanguage('en');
                        }}
                        className={`${language === 'en' ? (isDarkMode ? 'bg-white/20' : 'bg-black/20') : (isDarkMode ? 'bg-white/10' : 'bg-black/10')} px-3 py-1.5 rounded-r-full`}
                      >
                        <Text className={`${isDarkMode ? 'text-white' : 'text-black'} text-sm font-medium`}>
                          EN
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>

              {/* About Section */}
              <View className="mb-8">
                <Text variant="label" color="secondary" className="mb-4">
                  {t('settings.about')}
                </Text>
                
                <View className={`${isDarkMode ? 'bg-white/10' : 'bg-black/10'} rounded-2xl p-4`}>
                  <Pressable 
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    className="flex-row justify-between items-center mb-4"
                  >
                    <Text variant="bodyLarge" color="primary">{t('settings.version')}</Text>
                    <Text variant="body" color="secondary">1.0.0</Text>
                  </Pressable>

                  <Pressable 
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    className="flex-row justify-between items-center mb-4"
                  >
                    <Text variant="bodyLarge" color="primary">{t('settings.rateUs')}</Text>
                    <Ionicons name="star-outline" size={20} color={isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'} />
                  </Pressable>

                  <Pressable 
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    className="flex-row justify-between items-center mb-4"
                  >
                    <Text variant="bodyLarge" color="primary">{t('settings.sendFeedback')}</Text>
                    <Ionicons name="mail-outline" size={20} color={isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'} />
                  </Pressable>

                  <Pressable 
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    className="flex-row justify-between items-center"
                  >
                    <Text variant="bodyLarge" color="primary">{t('settings.privacy')}</Text>
                    <Ionicons name="shield-checkmark-outline" size={20} color={isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'} />
                  </Pressable>
                </View>
              </View>

              {/* Cloud Sync Section */}
              <View className="mb-8">
                <Text variant="label" color="secondary" className="mb-4">
                  {Platform.OS === 'ios' ? 'iCloud' : 'Cloud'} Backup
                </Text>
                
                <CloudSyncButton />
              </View>

              {/* Danger Zone */}
              <View className="mb-8">
                <Text variant="label" color="secondary" className="mb-4">
                  {t('settings.data')}
                </Text>
                
                <View className={`${isDarkMode ? 'bg-white/10' : 'bg-black/10'} rounded-2xl`}>
                  <Pressable
                    onPress={handleResetAllData}
                    className="flex-row justify-between items-center p-4 border-b border-white/5"
                  >
                    <View className="flex-1">
                      <Text variant="bodyLarge" color="danger">
                        {t('settings.resetAllData', { defaultValue: 'Alle Daten zurücksetzen' })}
                      </Text>
                      <Text variant="caption" color="secondary" className="mt-1">
                        {t('settings.resetAllDataDesc', { defaultValue: 'Löscht Favoriten, Playlists und Einstellungen' })}
                      </Text>
                    </View>
                    <Ionicons name="trash-outline" size={20} color="#f87171" />
                  </Pressable>
                  
                  {/* Reset Onboarding for Testing */}
                  <Pressable 
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      const { resetOnboarding } = useOnboardingStore.getState();
                      resetOnboarding();
                      router.replace('/onboarding');
                    }}
                    className="flex-row justify-between items-center p-4"
                  >
                    <View className="flex-1">
                      <Text variant="bodyLarge" color="primary">Onboarding zurücksetzen</Text>
                      <Text variant="caption" color="secondary">Zeigt die Einführung erneut an</Text>
                    </View>
                    <Ionicons name="refresh-outline" size={20} color={isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'} />
                  </Pressable>
                </View>
              </View>
        </View>
        </ScrollView>
      </View>
    </>
  );
}