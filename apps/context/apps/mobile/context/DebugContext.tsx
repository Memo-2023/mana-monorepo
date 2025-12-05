import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type DebugContextType = {
	showDebugBorders: boolean;
	toggleDebugBorders: () => void;
};

const DebugContext = createContext<DebugContextType | undefined>(undefined);

export const DebugProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [showDebugBorders, setShowDebugBorders] = useState(false);

	// Lade den Debug-Status beim ersten Rendern
	useEffect(() => {
		const loadDebugSettings = async () => {
			try {
				const savedValue = await AsyncStorage.getItem('showDebugBorders');
				if (savedValue !== null) {
					setShowDebugBorders(JSON.parse(savedValue));
				}
			} catch (error) {
				console.error('Fehler beim Laden der Debug-Einstellungen:', error);
			}
		};

		loadDebugSettings();
	}, []);

	// Speichere den Debug-Status bei Änderungen
	const toggleDebugBorders = async () => {
		try {
			const newValue = !showDebugBorders;
			setShowDebugBorders(newValue);
			await AsyncStorage.setItem('showDebugBorders', JSON.stringify(newValue));
		} catch (error) {
			console.error('Fehler beim Speichern der Debug-Einstellungen:', error);
		}
	};

	return (
		<DebugContext.Provider value={{ showDebugBorders, toggleDebugBorders }}>
			{children}
		</DebugContext.Provider>
	);
};

export const useDebug = () => {
	const context = useContext(DebugContext);
	if (context === undefined) {
		throw new Error('useDebug must be used within a DebugProvider');
	}
	return context;
};
