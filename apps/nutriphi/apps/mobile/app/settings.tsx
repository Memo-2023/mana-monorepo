import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Switch, Linking } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { DataClearingService } from '../services/DataClearingService';
import { UserPreferencesService } from '../services/UserPreferencesService';
import LoadingOverlay from '../components/ui/LoadingOverlay';

export default function Settings() {
  const { theme, updateTheme } = useTheme();
  const [isClearing, setIsClearing] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);

  const themeOptions = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'system', label: 'System', icon: '📱' },
  ];

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefsService = UserPreferencesService.getInstance();
      const prefs = await prefsService.getPreferences();
      setLocationEnabled(prefs.locationEnabled);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setIsLoadingPrefs(false);
    }
  };

  const handleThemeSelect = (selectedTheme: 'light' | 'dark' | 'system') => {
    updateTheme(selectedTheme);
  };

  const handleLocationToggle = async (value: boolean) => {
    setLocationEnabled(value);
    try {
      const prefsService = UserPreferencesService.getInstance();
      await prefsService.setLocationEnabled(value);
    } catch (error) {
      console.error('Failed to update location preference:', error);
      // Revert on error
      setLocationEnabled(!value);
      Alert.alert('Fehler', 'Einstellung konnte nicht gespeichert werden.');
    }
  };

  const openAppSettings = () => {
    Linking.openSettings();
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      'Alle Daten löschen',
      'Diese Aktion kann NICHT rückgängig gemacht werden. Alle Mahlzeiten, Fotos und persönlichen Daten werden dauerhaft gelöscht.\n\nMöchten Sie wirklich fortfahren?',
      [
        {
          text: 'Abbrechen',
          style: 'cancel',
        },
        {
          text: 'Alles löschen',
          style: 'destructive',
          onPress: confirmDeleteAllData,
        },
      ]
    );
  };

  const confirmDeleteAllData = async () => {
    setIsClearing(true);

    try {
      const dataClearingService = DataClearingService.getInstance();
      const result = await dataClearingService.clearAllData();

      if (result.success) {
        Alert.alert('Erfolgreich', 'Alle Daten wurden gelöscht.', [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)'),
          },
        ]);
      } else {
        Alert.alert(
          'Teilweise erfolgreich',
          `Einige Daten konnten nicht gelöscht werden:\n\n${result.errors.join('\n')}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Fehler', `Beim Löschen der Daten ist ein Fehler aufgetreten: ${error}`, [
        { text: 'OK' },
      ]);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Settings',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <Text className="text-lg">←</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
        <ScrollView className="flex-1">
          {/* App Info Section */}
          <View className="mx-4 mt-4 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
            <Text className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              App Info
            </Text>

            <View className="space-y-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-600 dark:text-gray-300">App Name</Text>
                <Text className="font-medium text-gray-900 dark:text-white">NutriPhi</Text>
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="text-gray-600 dark:text-gray-300">Version</Text>
                <Text className="font-medium text-gray-900 dark:text-white">1.0.0</Text>
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="text-gray-600 dark:text-gray-300">Build</Text>
                <Text className="font-medium text-gray-900 dark:text-white">1</Text>
              </View>

              <View className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-600">
                <Text className="text-sm text-gray-600 dark:text-gray-300">
                  Track your nutrition with AI-powered meal analysis
                </Text>
              </View>
            </View>
          </View>

          {/* Theme Section */}
          <View className="mx-4 mt-4 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
            <Text className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              Appearance
            </Text>

            <Text className="mb-3 text-gray-600 dark:text-gray-300">Theme</Text>

            <View className="space-y-2">
              {themeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => handleThemeSelect(option.value as 'light' | 'dark' | 'system')}
                  className={`flex-row items-center justify-between rounded-lg border p-3 ${
                    theme === option.value
                      ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-900/30'
                      : 'border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700'
                  }`}>
                  <View className="flex-row items-center">
                    <Text className="mr-3 text-lg">{option.icon}</Text>
                    <Text
                      className={`font-medium ${
                        theme === option.value
                          ? 'text-indigo-700 dark:text-indigo-300'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                      {option.label}
                    </Text>
                  </View>

                  {theme === option.value && (
                    <Text className="text-lg text-indigo-500 dark:text-indigo-400">✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Privacy & Location Section */}
          <View className="mx-4 mt-4 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
            <Text className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              Privatsphäre & Standort
            </Text>

            {/* Location Toggle */}
            <View className="mb-4 flex-row items-center justify-between">
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Ionicons name="location-outline" size={20} color="#6b7280" />
                  <Text className="ml-2 font-medium text-gray-900 dark:text-white">
                    Standort speichern
                  </Text>
                </View>
                <Text className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Speichert den Ort deiner Mahlzeiten für personalisierte Einblicke
                </Text>
              </View>
              <Switch
                value={locationEnabled}
                onValueChange={handleLocationToggle}
                disabled={isLoadingPrefs}
                trackColor={{ false: '#d1d5db', true: '#818cf8' }}
                thumbColor={locationEnabled ? '#6366f1' : '#f3f4f6'}
                ios_backgroundColor="#d1d5db"
              />
            </View>

            {/* App Settings Link */}
            <TouchableOpacity
              onPress={openAppSettings}
              className="flex-row items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-600">
              <View className="flex-1">
                <Text className="font-medium text-gray-900 dark:text-white">
                  App-Berechtigungen
                </Text>
                <Text className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Verwalte Kamera- und Standortberechtigungen
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Data Management Section */}
          <View className="mx-4 mt-4 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
            <Text className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              Datenverwaltung
            </Text>

            <TouchableOpacity
              onPress={handleDeleteAllData}
              disabled={isClearing}
              className={`rounded-lg p-4 ${
                isClearing ? 'bg-gray-100 dark:bg-gray-700' : 'bg-red-50 dark:bg-red-900/30'
              }`}>
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text
                    className={`font-medium ${
                      isClearing
                        ? 'text-gray-400 dark:text-gray-500'
                        : 'text-red-700 dark:text-red-300'
                    }`}>
                    Alle Daten löschen
                  </Text>
                  <Text
                    className={`mt-1 text-sm ${
                      isClearing
                        ? 'text-gray-400 dark:text-gray-500'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                    Löscht alle Mahlzeiten, Fotos und Einstellungen
                  </Text>
                </View>

                {isClearing ? (
                  <Text className="ml-3 text-gray-400 dark:text-gray-500">⏳</Text>
                ) : (
                  <Text className="ml-3 text-red-500 dark:text-red-400">🗑️</Text>
                )}
              </View>
            </TouchableOpacity>

            <View className="mt-3 rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/30">
              <Text className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Diese Aktion kann nicht rückgängig gemacht werden
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View className="mx-4 mb-4 mt-8">
            <Text className="text-center text-sm text-gray-500 dark:text-gray-400">
              Made with ❤️ for better nutrition tracking
            </Text>
          </View>
        </ScrollView>

        <LoadingOverlay visible={isClearing} message="Alle Daten werden gelöscht..." />
      </SafeAreaView>
    </>
  );
}
