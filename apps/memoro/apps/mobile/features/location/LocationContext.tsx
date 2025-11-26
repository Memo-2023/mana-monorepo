import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LocationContextType {
  saveLocation: boolean;
  setSaveLocation: (value: boolean) => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [saveLocation, setSaveLocationState] = useState(false);

  // Lade die gespeicherte Einstellung beim Start
  useEffect(() => {
    const loadSavedSetting = async () => {
      try {
        const savedValue = await AsyncStorage.getItem('saveLocation');
        if (savedValue !== null) {
          setSaveLocationState(savedValue === 'true');
        }
      } catch (error) {
         
        console.debug('Fehler beim Laden der Standorteinstellung:', error);
      }
    };

    loadSavedSetting();
  }, []);

  // Funktion zum Aktualisieren der Einstellung
  const setSaveLocation = async (value: boolean) => {
    try {
      await AsyncStorage.setItem('saveLocation', value.toString());
      setSaveLocationState(value);
    } catch (error) {
       
      console.debug('Fehler beim Speichern der Standorteinstellung:', error);
    }
  };

  return (
    <LocationContext.Provider value={{ saveLocation, setSaveLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation muss innerhalb eines LocationProviders verwendet werden');
  }
  return context;
};
