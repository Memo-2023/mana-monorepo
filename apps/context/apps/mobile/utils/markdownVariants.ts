/**
 * Hilfsfunktionen für die Verarbeitung von Varianten in Markdown-Texten
 */

/**
 * Extrahiert Varianten aus einem Markdown-Text
 * Format: [Option1, Option2, Option3]
 */
export interface VariantOption {
	original: string;
	selected: string;
	allOptions: string[];
	position: {
		start: number;
		end: number;
	};
}

/**
 * Extrahiert Varianten aus einem Markdown-Text
 * @param text Der Markdown-Text
 * @returns Array von gefundenen Varianten
 */
export const extractVariantsFromMarkdown = (text: string): VariantOption[] => {
	const variants: VariantOption[] = [];

	// Suche nach Varianten in eckigen Klammern mit Kommas als Trennzeichen
	// Format: [Option1, Option2, Option3]
	const variantRegex = /\[(.*?)\]/g;
	let match;

	while ((match = variantRegex.exec(text)) !== null) {
		const fullMatch = match[0]; // z.B. "[Heilbronn, München, Hamburg]"
		const optionsString = match[1]; // z.B. "Heilbronn, München, Hamburg"
		const options = optionsString.split(',').map((option) => option.trim());

		if (options.length > 0) {
			variants.push({
				original: fullMatch,
				selected: options[0], // Die erste Option ist standardmäßig ausgewählt
				allOptions: options,
				position: {
					start: match.index,
					end: match.index + fullMatch.length,
				},
			});
		}
	}

	return variants;
};

/**
 * Ersetzt Varianten in einem Text mit den ausgewählten Optionen
 * @param text Der Originaltext mit Varianten
 * @param variants Die Varianten mit ausgewählten Optionen
 * @returns Der Text mit ersetzten Varianten
 */
export const replaceVariantsInText = (text: string, variants: VariantOption[]): string => {
	let updatedContent = text;

	// Sortiere die Varianten nach Position (von hinten nach vorne),
	// damit die Indizes nicht durcheinander kommen, wenn wir Text ersetzen
	const sortedVariants = [...variants].sort((a, b) => b.position.start - a.position.start);

	// Ersetze alle Varianten mit der ausgewählten Option
	sortedVariants.forEach(({ original, selected, position }) => {
		updatedContent =
			updatedContent.substring(0, position.start) +
			selected +
			updatedContent.substring(position.end);
	});

	return updatedContent;
};

/**
 * Berechnet die Gesamtzahl der möglichen Kombinationen von Varianten
 * @param variants Die Varianten
 * @returns Die Anzahl der möglichen Kombinationen
 */
export const calculateTotalCombinations = (variants: VariantOption[]): number => {
	return variants.reduce((total, variant) => total * variant.allOptions.length, 1);
};

/**
 * Generiert alle möglichen Kombinationen von Varianten
 * @param text Der Originaltext mit Varianten
 * @param variants Die Varianten
 * @returns Array von Texten mit allen möglichen Kombinationen
 */
export const generateAllCombinations = (text: string, variants: VariantOption[]): string[] => {
	if (variants.length === 0) {
		return [text];
	}

	// Rekursive Funktion zum Generieren aller Kombinationen
	const generateCombinations = (
		currentVariants: VariantOption[],
		currentIndex: number,
		currentSelections: string[]
	): string[] => {
		// Basisfall: Alle Varianten wurden verarbeitet
		if (currentIndex >= currentVariants.length) {
			// Erstelle eine Kopie der Varianten mit den aktuellen Auswahlen
			const variantsWithSelections = currentVariants.map((variant, idx) => ({
				...variant,
				selected: currentSelections[idx],
			}));

			// Ersetze die Varianten im Text
			return [replaceVariantsInText(text, variantsWithSelections)];
		}

		// Rekursiver Fall: Generiere Kombinationen für jede Option der aktuellen Variante
		const results: string[] = [];
		const currentVariant = currentVariants[currentIndex];

		for (const option of currentVariant.allOptions) {
			const newSelections = [...currentSelections];
			newSelections[currentIndex] = option;

			const combinations = generateCombinations(currentVariants, currentIndex + 1, newSelections);

			results.push(...combinations);
		}

		return results;
	};

	// Starte die rekursive Generierung mit leeren Auswahlen
	const initialSelections = variants.map(() => '');
	return generateCombinations(variants, 0, initialSelections);
};
