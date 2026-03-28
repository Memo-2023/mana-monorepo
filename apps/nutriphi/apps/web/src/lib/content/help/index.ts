/**
 * Help content for NutriPhi app
 */

import type { HelpContent } from '@manacore/help';

export function getNutriPhiHelpContent(locale: string): HelpContent {
	const isDE = locale === 'de';

	return {
		faq: [
			{
				id: 'faq-log-meals',
				question: isDE ? 'Wie erfasse ich meine Mahlzeiten?' : 'How do I log my meals?',
				answer: isDE
					? '<p>Du kannst Mahlzeiten auf zwei Arten erfassen:</p><ul><li><strong>Foto-Analyse</strong>: Mache ein Foto deiner Mahlzeit — die KI erkennt automatisch die Lebensmittel und schätzt Nährwerte</li><li><strong>Manuelle Eingabe</strong>: Suche nach Lebensmitteln in der Datenbank und gib Portionsgrößen ein</li></ul><p>Nach der Erfassung kannst du die erkannten Lebensmittel und Mengen anpassen, bevor du speicherst.</p>'
					: '<p>You can log meals in two ways:</p><ul><li><strong>Photo analysis</strong>: Take a photo of your meal — the AI automatically recognizes the food items and estimates nutritional values</li><li><strong>Manual entry</strong>: Search for food items in the database and enter portion sizes</li></ul><p>After logging, you can adjust the recognized food items and quantities before saving.</p>',
				category: 'features',
				order: 1,
				language: isDE ? 'de' : 'en',
				tags: isDE
					? ['mahlzeit', 'erfassen', 'foto', 'eingabe']
					: ['meal', 'log', 'photo', 'entry'],
			},
			{
				id: 'faq-nutrients',
				question: isDE ? 'Welche Nährwerte werden erfasst?' : 'What nutrients are tracked?',
				answer: isDE
					? '<p>NutriPhi erfasst umfassende <strong>Makro- und Mikronährstoffe</strong>:</p><ul><li><strong>Makronährstoffe</strong>: Kalorien, Protein, Kohlenhydrate, Fett, Ballaststoffe</li><li><strong>Mikronährstoffe</strong>: Vitamine (A, B, C, D, E, K), Mineralstoffe (Eisen, Kalzium, Zink, Magnesium)</li><li><strong>Weitere</strong>: Zucker, gesättigte Fettsäuren, Natrium, Cholesterin</li></ul><p>Dein Tagesbericht zeigt dir, wie nah du an deinen persönlichen Zielen bist.</p>'
					: '<p>NutriPhi tracks comprehensive <strong>macro and micronutrients</strong>:</p><ul><li><strong>Macronutrients</strong>: Calories, protein, carbohydrates, fat, fiber</li><li><strong>Micronutrients</strong>: Vitamins (A, B, C, D, E, K), minerals (iron, calcium, zinc, magnesium)</li><li><strong>Other</strong>: Sugar, saturated fat, sodium, cholesterol</li></ul><p>Your daily report shows how close you are to your personal goals.</p>',
				category: 'features',
				order: 2,
				language: isDE ? 'de' : 'en',
				tags: isDE
					? ['nährwerte', 'makros', 'mikros', 'kalorien']
					: ['nutrients', 'macros', 'micros', 'calories'],
			},
			{
				id: 'faq-ai-analysis',
				question: isDE ? 'Wie funktioniert die KI-Analyse?' : 'How does the AI analysis work?',
				answer: isDE
					? '<p>Die <strong>KI-gestützte Foto-Analyse</strong> funktioniert in drei Schritten:</p><ol><li><strong>Erkennung</strong>: Die KI identifiziert alle sichtbaren Lebensmittel auf dem Foto</li><li><strong>Portionsschätzung</strong>: Anhand der Bildgröße und bekannter Referenzobjekte wird die Menge geschätzt</li><li><strong>Nährwertberechnung</strong>: Die Nährwerte werden aus unserer Datenbank abgerufen und berechnet</li></ol><p>Die Genauigkeit liegt bei ca. <strong>85-90%</strong>. Du kannst die Ergebnisse immer manuell korrigieren.</p>'
					: '<p>The <strong>AI-powered photo analysis</strong> works in three steps:</p><ol><li><strong>Recognition</strong>: The AI identifies all visible food items in the photo</li><li><strong>Portion estimation</strong>: Based on image size and known reference objects, quantities are estimated</li><li><strong>Nutrition calculation</strong>: Nutritional values are retrieved from our database and calculated</li></ol><p>Accuracy is approximately <strong>85-90%</strong>. You can always manually correct the results.</p>',
				category: 'technical',
				order: 3,
				language: isDE ? 'de' : 'en',
				tags: isDE
					? ['ki', 'analyse', 'foto', 'erkennung']
					: ['ai', 'analysis', 'photo', 'recognition'],
			},
			{
				id: 'faq-favorites',
				question: isDE ? 'Wie nutze ich Favoriten-Mahlzeiten?' : 'How do I use favorite meals?',
				answer: isDE
					? '<p><strong>Favoriten</strong> beschleunigen die tägliche Erfassung:</p><ul><li>Speichere häufig gegessene Mahlzeiten als Favoriten</li><li>Füge eine Favoriten-Mahlzeit mit einem Klick zu deinem Tageslog hinzu</li><li>Passe die Portionsgröße beim Hinzufügen an</li><li>Erstelle Favoriten aus vergangenen Mahlzeiten in deiner Historie</li></ul>'
					: '<p><strong>Favorites</strong> speed up daily logging:</p><ul><li>Save frequently eaten meals as favorites</li><li>Add a favorite meal to your daily log with one click</li><li>Adjust the portion size when adding</li><li>Create favorites from past meals in your history</li></ul>',
				category: 'features',
				order: 4,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['favoriten', 'mahlzeiten', 'schnell'] : ['favorites', 'meals', 'quick'],
			},
			{
				id: 'faq-privacy',
				question: isDE ? 'Wie werden meine Daten geschützt?' : 'How is my data protected?',
				answer: isDE
					? '<p>Deine Daten sind sicher:</p><ul><li><strong>Verschlüsselung</strong>: Alle Daten werden bei der Übertragung (TLS) verschlüsselt</li><li><strong>DSGVO-konform</strong>: Wir halten uns an die EU-Datenschutzverordnung</li><li><strong>Foto-Datenschutz</strong>: Mahlzeitenfotos werden nach der Analyse nur auf deinem Wunsch gespeichert</li><li><strong>Gesundheitsdaten</strong>: Deine Ernährungsdaten werden nie an Dritte verkauft</li><li><strong>Datenexport</strong>: Du kannst jederzeit alle Daten exportieren</li></ul>'
					: '<p>Your data is secure:</p><ul><li><strong>Encryption</strong>: All data is encrypted in transit (TLS)</li><li><strong>GDPR compliant</strong>: We follow EU data protection regulations</li><li><strong>Photo privacy</strong>: Meal photos are only stored after analysis upon your request</li><li><strong>Health data</strong>: Your nutrition data is never sold to third parties</li><li><strong>Data export</strong>: You can export all data at any time</li></ul>',
				category: 'privacy',
				order: 5,
				language: isDE ? 'de' : 'en',
				featured: true,
				tags: isDE ? ['datenschutz', 'dsgvo', 'sicherheit'] : ['privacy', 'gdpr', 'security'],
			},
		],
		features: [
			{
				id: 'feature-photo-analysis',
				title: isDE ? 'Foto-Analyse' : 'Photo Analysis',
				description: isDE
					? 'Erfasse Mahlzeiten per Foto mit KI-gestützter Erkennung'
					: 'Log meals by photo with AI-powered recognition',
				icon: '📸',
				category: 'core',
				highlights: isDE
					? ['KI-Erkennung', 'Portionsschätzung', 'Sofort-Analyse', 'Manuelle Korrektur']
					: ['AI recognition', 'Portion estimation', 'Instant analysis', 'Manual correction'],
				content: '',
				order: 1,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-macro-micro',
				title: isDE ? 'Makro- & Mikro-Tracking' : 'Macro & Micro Tracking',
				description: isDE
					? 'Verfolge Kalorien, Makros, Vitamine und Mineralstoffe'
					: 'Track calories, macros, vitamins, and minerals',
				icon: '📊',
				category: 'core',
				highlights: isDE
					? ['Kalorien & Makros', 'Vitamine & Mineralstoffe', 'Tägliche Ziele', 'Trendanalyse']
					: ['Calories & macros', 'Vitamins & minerals', 'Daily goals', 'Trend analysis'],
				content: '',
				order: 2,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-ai-coaching',
				title: isDE ? 'KI-Coaching' : 'AI Coaching',
				description: isDE
					? 'Erhalte personalisierte Ernährungstipps und Empfehlungen'
					: 'Receive personalized nutrition tips and recommendations',
				icon: '🤖',
				category: 'advanced',
				highlights: isDE
					? ['Personalisierte Tipps', 'Nährstofflücken', 'Mahlzeitenvorschläge', 'Wochenbericht']
					: ['Personalized tips', 'Nutrient gaps', 'Meal suggestions', 'Weekly report'],
				content: '',
				order: 3,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-favorites',
				title: isDE ? 'Favoriten-Mahlzeiten' : 'Favorite Meals',
				description: isDE
					? 'Speichere häufige Mahlzeiten für schnelle Erfassung'
					: 'Save frequent meals for quick logging',
				icon: '⭐',
				category: 'core',
				highlights: isDE
					? [
							'Ein-Klick-Erfassung',
							'Anpassbare Portionen',
							'Aus Historie erstellen',
							'Schnellzugriff',
						]
					: ['One-click logging', 'Adjustable portions', 'Create from history', 'Quick access'],
				content: '',
				order: 4,
				language: isDE ? 'de' : 'en',
			},
		],
		shortcuts: [],
		gettingStarted: [],
		changelog: [],
		contact: {
			id: 'contact-support',
			title: isDE ? 'Support kontaktieren' : 'Contact Support',
			content: isDE
				? '<p>Unser Support-Team hilft dir bei allen Fragen rund um NutriPhi.</p>'
				: '<p>Our support team is here to help you with any questions about NutriPhi.</p>',
			language: isDE ? 'de' : 'en',
			order: 1,
			supportEmail: 'support@mana.how',
			documentationUrl: 'https://mana.how/docs',
			responseTime: isDE ? 'Normalerweise innerhalb von 24 Stunden' : 'Usually within 24 hours',
		},
	};
}
