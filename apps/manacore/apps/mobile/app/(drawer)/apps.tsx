import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { ScrollView, Text, View, Image, TouchableOpacity, ActivityIndicator, Alert, Platform, Linking } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

import { Container } from '~/components/Container';
import { useTheme } from '../../utils/themeContext';
import { supabase } from '../../utils/supabase';

// Interface für die Satellite-Daten
interface Satellite {
  id: string;
  name: string;
  description: string;
  brand_logo: string;
  created_at: string;
  link_web?: string;
  link_ios?: string;
  link_android?: string;
}

export default function Apps() {
  const { isDarkMode } = useTheme();
  const [satellites, setSatellites] = useState<Satellite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSatellites();
  }, []);

  const fetchSatellites = async () => {
    try {
      setLoading(true);
      
      // Hole die Satellites-Daten aus der Supabase-Datenbank
      const { data, error } = await supabase
        .from('satellites')
        .select('*')
        .order('name');
        
      if (error) {
        throw error;
      }
      
      if (data) {
        console.log('Satellites geladen:', data.length);
        setSatellites(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Satellites:', error);
      Alert.alert(
        'Fehler',
        'Beim Laden der Apps ist ein Fehler aufgetreten. Bitte versuche es später erneut.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAppClick = (satellite: Satellite) => {
    // Öffne die App-Details in einem Alert
    console.log('App angeklickt:', satellite.name);
    Alert.alert(
      satellite.name,
      satellite.description,
      [{ text: 'OK' }]
    );
  };
  
  const openAppLink = async (satellite: Satellite) => {
    try {
      let linkToOpen: string | undefined;
      
      // Wähle den entsprechenden Link basierend auf der Plattform
      if (Platform.OS === 'ios') {
        linkToOpen = satellite.link_ios;
      } else if (Platform.OS === 'android') {
        linkToOpen = satellite.link_android;
      } else {
        // Für Web oder wenn die plattformspezifischen Links nicht verfügbar sind
        linkToOpen = satellite.link_web;
      }
      
      // Fallback: Wenn kein plattformspezifischer Link vorhanden ist, versuche den Web-Link
      if (!linkToOpen) {
        linkToOpen = satellite.link_web;
      }
      
      // Wenn kein Link verfügbar ist, zeige eine Meldung an
      if (!linkToOpen) {
        Alert.alert(
          'Bald verfügbar',
          `${satellite.name} wird bald verfügbar sein.`,
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Prüfe, ob der Link geöffnet werden kann
      const canOpen = await Linking.canOpenURL(linkToOpen);
      
      if (canOpen) {
        // Öffne den Link
        await Linking.openURL(linkToOpen);
      } else {
        Alert.alert(
          'Fehler',
          `Der Link für ${satellite.name} kann nicht geöffnet werden.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Fehler beim Öffnen des Links:', error);
      Alert.alert(
        'Fehler',
        'Beim Öffnen des Links ist ein Fehler aufgetreten.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Apps',
          headerLargeTitle: true,
        }} 
      />
      <Container>
        <ScrollView className="flex-1">
          <View className="mx-2.5 my-4">
            <Text className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              Verfügbare Apps
            </Text>
            <Text className={`text-base mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Entdecke Apps, die mit Manacore verbunden werden können
            </Text>
            
            {loading ? (
              <View className={`flex-1 justify-center items-center p-10 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow`}>
                <ActivityIndicator size="large" color={isDarkMode ? '#93C5FD' : '#0055FF'} />
                <Text className={`mt-4 text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Lade Apps...
                </Text>
              </View>
            ) : satellites.length === 0 ? (
              <View className={`p-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow items-center`}>
                <FontAwesome5 name="rocket" size={50} color={isDarkMode ? '#4B5563' : '#9CA3AF'} />
                <Text className={`mt-4 text-lg font-medium text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Keine Apps verfügbar
                </Text>
                <Text className={`mt-2 text-sm text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Derzeit sind keine Apps verfügbar. Schaue später noch einmal vorbei.
                </Text>
              </View>
            ) : (
              <View className="flex-row flex-wrap justify-between">
                {satellites.map((satellite) => (
                  <TouchableOpacity
                    key={satellite.id}
                    className={`w-[48%] mb-4 rounded-xl overflow-hidden shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
                    onPress={() => handleAppClick(satellite)}
                    activeOpacity={0.7}
                  >
                    <View className="p-4 items-center">
                      {satellite.brand_logo ? (
                        <Image
                          source={{ uri: satellite.brand_logo }}
                          className="w-16 h-16 rounded-lg mb-3"
                          resizeMode="contain"
                          // Fallback für den Fall, dass das Bild nicht geladen werden kann
                          onError={() => console.log('Fehler beim Laden des Logos:', satellite.brand_logo)}
                        />
                      ) : (
                        <View className="w-16 h-16 rounded-lg mb-3 bg-gray-200 items-center justify-center">
                          <FontAwesome5 name="rocket" size={24} color={isDarkMode ? '#4B5563' : '#9CA3AF'} />
                        </View>
                      )}
                      
                      <Text className={`text-base font-bold text-center mb-1 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                        {satellite.name}
                      </Text>
                      
                      <Text 
                        className={`text-xs text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {satellite.description}
                      </Text>
                    </View>
                    
                    <TouchableOpacity
                      className={`py-2 w-full ${isDarkMode ? 'bg-blue-700' : 'bg-blue-600'}`}
                      onPress={() => openAppLink(satellite)}
                      disabled={!satellite.link_web && !satellite.link_ios && !satellite.link_android}
                    >
                      <Text className="text-white text-center font-medium text-sm">
                        {satellite.link_web || satellite.link_ios || satellite.link_android ? 'Öffnen' : 'Bald verfügbar'}
                      </Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            <View className={`mt-4 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <Text className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                Über Apps
              </Text>
              <Text className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Apps sind Erweiterungen, die mit Manacore verbunden werden können, um zusätzliche Funktionen zu nutzen.
                Jede App bietet spezifische Funktionen, die deine Manacore-Erfahrung verbessern.
              </Text>
            </View>
          </View>
        </ScrollView>
      </Container>
    </>
  );
}
