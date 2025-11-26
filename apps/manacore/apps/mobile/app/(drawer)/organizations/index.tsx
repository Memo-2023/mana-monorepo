import React, { useState, useRef } from 'react';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { ScrollView, Text, View, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useCallback } from 'react';

import { Container } from '~/components/Container';
import CreateOrganization from '../../../components/CreateOrganization';
import OrganizationList from '../../../components/OrganizationList';
import { useTheme } from '../../../utils/themeContext';

export default function Organizations() {
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const organizationListRef = useRef<any>(null);
  
  // Diese Funktion wird jedes Mal aufgerufen, wenn die Seite fokussiert wird
  useFocusEffect(
    useCallback(() => {
      console.log('Organizations-Seite fokussiert, aktualisiere Liste');
      // Wenn die Liste existiert, aktualisiere sie
      if (organizationListRef.current) {
        organizationListRef.current.refreshOrganizations();
      }
    }, [])
  );
  
  const handleOrgCreated = (orgId: string, orgName: string) => {
    console.log('Organisation erstellt, navigiere zur Detailseite:', orgId, orgName);
    
    // Zuerst zurück zur Organisationsliste wechseln
    setShowCreateOrg(false);
    
    // Dann zur Detailseite der neuen Organisation navigieren
    // Verzögerung für stabilere Navigation
    setTimeout(() => {
      router.push({
        pathname: '/organizations/[id]',
        params: { id: orgId, name: orgName }
      });
    }, 300);
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Organisationen',
          headerLargeTitle: true,
        }} 
      />
      <Container>
        <ScrollView className="flex-1">
          {!showCreateOrg ? (
            <>
              <View className="flex-row justify-between items-center mx-2.5 my-2.5">
                <Text className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Meine Organisationen</Text>
                <TouchableOpacity 
                  className={`${isDarkMode ? 'bg-blue-700' : 'bg-blue-600'} flex-row items-center py-2 px-4 rounded-lg shadow`}
                  onPress={() => setShowCreateOrg(true)}
                >
                  <FontAwesome5 name="plus" size={14} color="white" className="mr-2" />
                  <Text className="text-white font-semibold text-sm">Neue Organisation</Text>
                </TouchableOpacity>
              </View>
              <OrganizationList hideTitle={true} ref={organizationListRef} />
            </>
          ) : (
            <>
              <View className="flex-row justify-end mx-2.5 my-2.5">
                <TouchableOpacity 
                  className={`flex-row items-center py-2 px-4 rounded-lg border ${isDarkMode ? 'border-blue-500' : 'border-blue-600'}`}
                  onPress={() => setShowCreateOrg(false)}
                >
                  <FontAwesome5 name="arrow-left" size={16} color={isDarkMode ? '#93C5FD' : '#0055FF'} className="mr-2" />
                  <Text className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'} font-semibold text-sm`}>Zurück zu meinen Organisationen</Text>
                </TouchableOpacity>
              </View>
              <CreateOrganization onOrgCreated={handleOrgCreated} />
            </>
          )}
        </ScrollView>
      </Container>
    </>
  );
}
