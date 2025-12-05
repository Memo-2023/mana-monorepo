import { ViewStyle } from 'react-native';

/**
 * Fügt Debug-Borders zu einem Style-Objekt hinzu
 * @param baseStyle Das Basis-Style-Objekt
 * @param color Die Farbe des Debug-Rahmens (optional)
 * @param showBorder Flag, ob der Debug-Rahmen angezeigt werden soll
 * @returns Das Style-Objekt mit Debug-Rahmen (wenn aktiviert)
 */
export const addDebugBorder = (
	baseStyle: ViewStyle,
	color: string = '#ff0000',
	showBorder: boolean = false
): ViewStyle => {
	if (!showBorder) return baseStyle;

	return {
		...baseStyle,
		borderWidth: 1,
		borderColor: color,
	};
};

/**
 * Generiert zufällige Debug-Farben für verschiedene UI-Elemente
 */
export const debugColors = {
	container: '#ff0000', // Rot
	section: '#00ff00', // Grün
	item: '#0000ff', // Blau
	header: '#ff00ff', // Magenta
	content: '#ffff00', // Gelb
	footer: '#00ffff', // Cyan

	// Generiert eine zufällige Farbe für andere Elemente
	random: () => {
		const letters = '0123456789ABCDEF';
		let color = '#';
		for (let i = 0; i < 6; i++) {
			color += letters[Math.floor(Math.random() * 16)];
		}
		return color;
	},
};
