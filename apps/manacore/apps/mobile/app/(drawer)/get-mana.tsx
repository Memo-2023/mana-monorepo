import React, { useState } from 'react';
import { Stack } from 'expo-router';
import { ScrollView, Text, View, TouchableOpacity, Image, Alert } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

import { Container } from '~/components/Container';
import { useTheme } from '../../utils/themeContext';
import { supabase } from '../../utils/supabase';

// Definiere die Mana-Pakete
const manaPacks = [
  {
    id: 'basic',
    name: 'Basis Paket',
    amount: 100,
    price: '9,99 €',
    description: '100 Mana-Punkte',
    popular: false,
    color: '#4F46E5', // Indigo
  },
  {
    id: 'standard',
    name: 'Standard Paket',
    amount: 500,
    price: '39,99 €',
    description: '500 Mana-Punkte',
    popular: true,
    color: '#0055FF', // Blau
  },
  {
    id: 'premium',
    name: 'Premium Paket',
    amount: 1500,
    price: '99,99 €',
    description: '1500 Mana-Punkte',
    popular: false,
    color: '#7C3AED', // Violett
  },
  {
    id: 'enterprise',
    name: 'Enterprise Paket',
    amount: 5000,
    price: '299,99 €',
    description: '5000 Mana-Punkte',
    popular: false,
    color: '#10B981', // Grün
  },
];

export default function GetMana() {
  const { isDarkMode } = useTheme();
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const handlePurchase = async (packId: string) => {
    // Setze den Loading-Status für dieses Paket
    setLoading(prev => ({ ...prev, [packId]: true }));
    
    try {
      // Hier würde die tatsächliche Kauflogik implementiert werden
      // z.B. Integration mit einem Zahlungsanbieter
      
      // Simuliere einen API-Aufruf
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Erfolgsbenachrichtigung
      Alert.alert(
        'Kauf erfolgreich',
        `Du hast erfolgreich das ${manaPacks.find(p => p.id === packId)?.name} erworben!`,
        [{ text: 'OK' }]
      );
      
      // Setze den ausgewählten Pack zurück
      setSelectedPack(null);
    } catch (error) {
      console.error('Fehler beim Kauf:', error);
      Alert.alert(
        'Fehler',
        'Beim Kauf ist ein Fehler aufgetreten. Bitte versuche es später erneut.',
        [{ text: 'OK' }]
      );
    } finally {
      // Setze den Loading-Status zurück
      setLoading(prev => ({ ...prev, [packId]: false }));
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Mana erhalten',
          headerLargeTitle: true,
        }} 
      />
      <Container>
        <ScrollView className="flex-1">
          <View className="mx-2.5 my-4">
            <Text className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              Mana-Pakete
            </Text>
            <Text className={`text-base mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Wähle ein Paket, das zu deinen Bedürfnissen passt
            </Text>
            
            {manaPacks.map((pack) => (
              <TouchableOpacity
                key={pack.id}
                className={`mb-4 rounded-xl overflow-hidden shadow-md ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                } ${selectedPack === pack.id ? 'border-2 border-blue-500' : ''}`}
                onPress={() => setSelectedPack(pack.id)}
                activeOpacity={0.7}
              >
                {/* Beliebtheits-Badge */}
                {pack.popular && (
                  <View className="absolute top-0 right-0 bg-orange-500 py-1 px-3 rounded-bl-lg z-10">
                    <Text className="text-white text-xs font-bold">Beliebt</Text>
                  </View>
                )}
                
                {/* Header */}
                <View 
                  className="p-4 w-full"
                  style={{ backgroundColor: pack.color }}
                >
                  <Text className="text-white text-xl font-bold">{pack.name}</Text>
                  <Text className="text-white text-sm opacity-80">{pack.description}</Text>
                </View>
                
                {/* Preis und Menge */}
                <View className="p-4">
                  <View className="flex-row justify-between items-center mb-4">
                    <View>
                      <Text className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        {pack.price}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <FontAwesome5 name="fire" size={20} color="#F59E0B" />
                      <Text className={`ml-2 text-xl font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {pack.amount} Mana
                      </Text>
                    </View>
                  </View>
                  
                  {/* Beschreibung */}
                  <View className="mb-4">
                    <View className="flex-row items-center mb-2">
                      <FontAwesome5 name="check-circle" size={16} color={isDarkMode ? '#93C5FD' : '#0055FF'} />
                      <Text className={`ml-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {pack.description}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Kaufen-Button */}
                  <TouchableOpacity
                    className={`py-3 rounded-lg ${
                      selectedPack === pack.id
                        ? 'bg-blue-600'
                        : isDarkMode
                        ? 'bg-gray-700'
                        : 'bg-gray-200'
                    }`}
                    onPress={() => handlePurchase(pack.id)}
                    disabled={loading[pack.id]}
                  >
                    <Text
                      className={`text-center font-semibold ${
                        selectedPack === pack.id
                          ? 'text-white'
                          : isDarkMode
                          ? 'text-gray-300'
                          : 'text-gray-700'
                      }`}
                    >
                      {loading[pack.id] ? 'Wird verarbeitet...' : 'Jetzt kaufen'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
            
            {/* Informationsbereich */}
            <View className={`mt-4 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <Text className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                Über Mana
              </Text>
              <Text className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Mana ist die Währung in unserer App, mit der du Aktionen durchführen und Funktionen freischalten kannst.
              </Text>
            </View>
          </View>
        </ScrollView>
      </Container>
    </>
  );
}
