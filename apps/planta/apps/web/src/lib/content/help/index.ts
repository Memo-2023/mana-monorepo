/**
 * Help content for Planta app
 */

import type { HelpContent } from '@manacore/shared-help-types';
import { getPrivacyFAQs } from '@manacore/shared-help-types';

export function getPlantaHelpContent(locale: string): HelpContent {
	const isDE = locale === 'de';

	return {
		faq: [
			{
				id: 'faq-identify',
				question: isDE ? 'Wie identifiziere ich eine Pflanze?' : 'How do I identify a plant?',
				answer: isDE
					? '<p>Die KI-Pflanzenerkennung macht es einfach:</p><ol><li>Tippe auf den <strong>Kamera-Button</strong></li><li>Mache ein Foto der Pflanze (Blätter, Blüten oder die ganze Pflanze)</li><li>Die KI analysiert das Bild und zeigt dir die Ergebnisse</li></ol><p>Für beste Ergebnisse fotografiere die Pflanze bei gutem Licht und aus verschiedenen Winkeln.</p>'
					: '<p>AI plant identification makes it easy:</p><ol><li>Tap the <strong>camera button</strong></li><li>Take a photo of the plant (leaves, flowers, or the whole plant)</li><li>The AI analyzes the image and shows you the results</li></ol><p>For best results, photograph the plant in good lighting and from different angles.</p>',
				category: 'features',
				order: 1,
				language: isDE ? 'de' : 'en',
				tags: ['identify', 'camera', 'ai', 'recognition'],
			},
			{
				id: 'faq-care',
				question: isDE
					? 'Wie funktionieren die Pflegeempfehlungen?'
					: 'How do care recommendations work?',
				answer: isDE
					? '<p>Nach der Identifizierung erhältst du individuelle Pflegeempfehlungen:</p><ul><li><strong>Licht</strong> — Optimale Lichtverhältnisse für deine Pflanze</li><li><strong>Wasser</strong> — Gießhäufigkeit und -menge</li><li><strong>Temperatur</strong> — Idealer Temperaturbereich</li><li><strong>Boden</strong> — Empfohlene Erdmischung</li></ul><p>Die Empfehlungen passen sich an die Jahreszeit und deinen Standort an.</p>'
					: '<p>After identification, you receive personalized care recommendations:</p><ul><li><strong>Light</strong> — Optimal light conditions for your plant</li><li><strong>Water</strong> — Watering frequency and amount</li><li><strong>Temperature</strong> — Ideal temperature range</li><li><strong>Soil</strong> — Recommended soil mix</li></ul><p>Recommendations adapt to the season and your location.</p>',
				category: 'features',
				order: 2,
				language: isDE ? 'de' : 'en',
				tags: ['care', 'recommendations', 'light', 'water'],
			},
			{
				id: 'faq-watering',
				question: isDE ? 'Wie funktioniert der Gießplan?' : 'How does the watering schedule work?',
				answer: isDE
					? '<p>Der Gießplan erinnert dich automatisch daran, deine Pflanzen zu gießen:</p><ul><li>Jede Pflanze erhält einen individuellen Gießrhythmus basierend auf ihrer Art</li><li>Du bekommst <strong>Push-Benachrichtigungen</strong>, wenn eine Pflanze Wasser braucht</li><li>Nach dem Gießen markierst du die Pflanze als gegossen</li><li>Der Plan passt sich automatisch an die Jahreszeit an</li></ul>'
					: '<p>The watering schedule automatically reminds you to water your plants:</p><ul><li>Each plant gets an individual watering rhythm based on its species</li><li>You receive <strong>push notifications</strong> when a plant needs water</li><li>After watering, mark the plant as watered</li><li>The schedule automatically adapts to the season</li></ul>',
				category: 'features',
				order: 3,
				language: isDE ? 'de' : 'en',
				tags: ['watering', 'schedule', 'notifications', 'reminders'],
			},
			{
				id: 'faq-health',
				question: isDE
					? 'Wie überwache ich die Pflanzengesundheit?'
					: 'How do I monitor plant health?',
				answer: isDE
					? '<p>Planta hilft dir, Probleme frühzeitig zu erkennen:</p><ul><li>Mache regelmäßig Fotos deiner Pflanzen — die KI erkennt Veränderungen</li><li>Erhalte Warnungen bei Anzeichen von <strong>Krankheiten</strong>, <strong>Schädlingen</strong> oder <strong>Nährstoffmangel</strong></li><li>Sieh dir den Gesundheitsverlauf jeder Pflanze in der Timeline an</li><li>Bekomme Behandlungsvorschläge bei Problemen</li></ul>'
					: '<p>Planta helps you detect problems early:</p><ul><li>Take regular photos of your plants — the AI detects changes</li><li>Receive warnings for signs of <strong>diseases</strong>, <strong>pests</strong>, or <strong>nutrient deficiency</strong></li><li>View the health history of each plant in the timeline</li><li>Get treatment suggestions for issues</li></ul>',
				category: 'features',
				order: 4,
				language: isDE ? 'de' : 'en',
				tags: ['health', 'diseases', 'pests', 'monitoring'],
			},
			...getPrivacyFAQs(locale, { dataTypeDE: 'Pflanzendaten', dataTypeEN: 'plant data' }),
		],
		features: [
			{
				id: 'feature-identification',
				title: isDE ? 'KI-Pflanzenerkennung' : 'AI Plant Identification',
				description: isDE
					? 'Identifiziere jede Pflanze sofort mit einem Foto — powered by KI.'
					: 'Identify any plant instantly with a photo — powered by AI.',
				icon: '📸',
				category: 'core',
				highlights: isDE
					? ['Sofortige Erkennung', 'Tausende Pflanzenarten', 'Hohe Genauigkeit']
					: ['Instant recognition', 'Thousands of species', 'High accuracy'],
				content: '',
				order: 1,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-care',
				title: isDE ? 'Pflegeempfehlungen' : 'Care Recommendations',
				description: isDE
					? 'Individuelle Pflegetipps für jede Pflanze, angepasst an Jahreszeit und Standort.'
					: 'Personalized care tips for every plant, adapted to season and location.',
				icon: '🌱',
				category: 'core',
				highlights: isDE
					? ['Saisonale Anpassung', 'Standortbasiert', 'Expertenbasiert']
					: ['Seasonal adaptation', 'Location-based', 'Expert-backed'],
				content: '',
				order: 2,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-watering',
				title: isDE ? 'Gießplan' : 'Watering Schedule',
				description: isDE
					? 'Automatische Gießerinnerungen mit Push-Benachrichtigungen für jede Pflanze.'
					: 'Automatic watering reminders with push notifications for every plant.',
				icon: '💧',
				category: 'core',
				highlights: isDE
					? ['Push-Benachrichtigungen', 'Individueller Rhythmus', 'Saisonale Anpassung']
					: ['Push notifications', 'Individual rhythm', 'Seasonal adaptation'],
				content: '',
				order: 3,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-health',
				title: isDE ? 'Gesundheits-Tracking' : 'Health Tracking',
				description: isDE
					? 'Überwache die Gesundheit deiner Pflanzen mit KI-gestützter Problemerkennung.'
					: 'Monitor your plant health with AI-powered problem detection.',
				icon: '🏥',
				category: 'advanced',
				highlights: isDE
					? ['Krankheitserkennung', 'Schädlingswarnung', 'Behandlungsvorschläge']
					: ['Disease detection', 'Pest warnings', 'Treatment suggestions'],
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
				? '<p>Unser Support-Team hilft dir bei allen Fragen rund um Planta.</p>'
				: '<p>Our support team is here to help you with any questions about Planta.</p>',
			language: isDE ? 'de' : 'en',
			order: 1,
			supportEmail: 'support@mana.how',
			documentationUrl: 'https://mana.how/docs',
			responseTime: isDE ? 'Normalerweise innerhalb von 24 Stunden' : 'Usually within 24 hours',
		},
	};
}
