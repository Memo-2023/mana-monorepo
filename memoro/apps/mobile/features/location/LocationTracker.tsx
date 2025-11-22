import React, { useEffect } from 'react';
import { useLocation } from './LocationContext';
import { 
  requestLocationPermissions, 
  getCurrentLocation, 
  saveLocationData 
} from './locationService';

/**
 * Komponente zum Erfassen des Standorts basierend auf Benutzereinstellungen
 */
const LocationTracker: React.FC = () => {
  const { saveLocation } = useLocation();

  useEffect(() => {
    // Nur Standort erfassen, wenn die Einstellung aktiviert ist
    if (saveLocation) {
      const captureLocation = async () => {
        const hasPermission = await requestLocationPermissions();
        
        if (hasPermission) {
          const locationData = await getCurrentLocation();
          
          if (locationData) {
            await saveLocationData(locationData);
             
            console.debug('Standort erfasst und gespeichert:', locationData);
          }
        }
      };
      
      // Beim Start erfassen
      captureLocation();
      
      // Regelmäßige Erfassung einrichten (alle 30 Minuten)
      const intervalId = setInterval(captureLocation, 30 * 60 * 1000);
      
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [saveLocation]);

  // Diese Komponente rendert nichts
  return null;
};

export default LocationTracker;
