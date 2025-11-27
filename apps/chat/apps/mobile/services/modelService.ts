/**
 * ModelService - Dienst zum Abrufen von KI-Modellen
 */
import { availableModels } from '../config/azure';

// Typendefinition für ein KI-Modell
export interface Model {
	id: string;
	name: string;
	description: string;
	parameters?: {
		temperature?: number;
		max_tokens?: number;
		provider?: string;
		deployment?: string;
		endpoint?: string;
		api_version?: string;
	};
}

/**
 * Ruft alle verfügbaren KI-Modelle ab
 * @returns Eine Liste von verfügbaren Modellen
 */
export async function getModels(): Promise<Model[]> {
	try {
		// In einer echten Anwendung würde hier eine API-Anfrage erfolgen
		// Für jetzt verwenden wir die Fallback-Modelle aus der Konfiguration
		return availableModels;
	} catch (error) {
		console.error('Fehler beim Abrufen der Modelle:', error);
		return availableModels; // Fallback auf lokale Modelle
	}
}

/**
 * Ruft ein bestimmtes Modell anhand seiner ID ab
 * @param id Die ID des gesuchten Modells
 * @returns Das Modell oder undefined, wenn nicht gefunden
 */
export async function getModelById(id: string): Promise<Model | undefined> {
	try {
		const models = await getModels();
		return models.find((model) => model.id === id);
	} catch (error) {
		console.error('Fehler beim Abrufen des Modells:', error);
		// Fallback: Suche in lokalen Modellen
		return availableModels.find((model) => model.id === id);
	}
}

/**
 * Gibt das Standard-Modell zurück
 * @returns Das Standard-Modell
 */
export async function getDefaultModel(): Promise<Model> {
	try {
		const models = await getModels();
		return models[0]; // Das erste Modell in der Liste als Standard
	} catch (error) {
		console.error('Fehler beim Abrufen des Standard-Modells:', error);
		return availableModels[0]; // Fallback auf lokales Standard-Modell
	}
}
