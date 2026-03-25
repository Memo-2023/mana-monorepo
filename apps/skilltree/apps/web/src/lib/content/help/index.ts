/**
 * Help content for SkillTree app
 */

import type { HelpContent } from '@manacore/shared-help-types';

export function getSkillTreeHelpContent(locale: string): HelpContent {
	const isDE = locale === 'de';

	return {
		faq: [
			{
				id: 'faq-xp',
				question: isDE ? 'Wie funktioniert das XP-System?' : 'How does the XP system work?',
				answer: isDE
					? '<p>SkillTree verwendet ein RPG-ähnliches Erfahrungspunkte-System:</p><ul><li>Du sammelst <strong>XP</strong> (Erfahrungspunkte) für jede protokollierte Aktivität</li><li>Die XP-Menge hängt von Dauer und Intensität der Aktivität ab</li><li>Wenn du genug XP gesammelt hast, steigst du ein <strong>Level</strong> auf</li><li>Höhere Level erfordern mehr XP — genau wie in einem RPG</li></ul><p>Dein Gesamtlevel zeigt deinen Fortschritt über alle Skill-Bereiche hinweg.</p>'
					: '<p>SkillTree uses an RPG-style experience points system:</p><ul><li>You earn <strong>XP</strong> (experience points) for every logged activity</li><li>The amount of XP depends on the duration and intensity of the activity</li><li>When you collect enough XP, you <strong>level up</strong></li><li>Higher levels require more XP — just like in an RPG</li></ul><p>Your total level shows your progress across all skill branches.</p>',
				category: 'features',
				order: 1,
				language: isDE ? 'de' : 'en',
				tags: ['xp', 'experience', 'level', 'rpg', 'points'],
			},
			{
				id: 'faq-branches',
				question: isDE ? 'Was sind Skill-Bereiche?' : 'What are skill branches?',
				answer: isDE
					? '<p>Skill-Bereiche sind die 6 Hauptkategorien deiner persönlichen Entwicklung:</p><ul><li><strong>Wissen</strong> — Lernen, Lesen, Kurse</li><li><strong>Fitness</strong> — Sport, Bewegung, Gesundheit</li><li><strong>Kreativität</strong> — Kunst, Musik, Schreiben</li><li><strong>Sozial</strong> — Kommunikation, Networking, Teamarbeit</li><li><strong>Technik</strong> — Programmieren, Tools, Technologie</li><li><strong>Achtsamkeit</strong> — Meditation, Reflexion, Wohlbefinden</li></ul><p>Jeder Bereich hat seinen eigenen Fortschrittsbaum und Level.</p>'
					: '<p>Skill branches are the 6 main categories of your personal development:</p><ul><li><strong>Knowledge</strong> — Learning, reading, courses</li><li><strong>Fitness</strong> — Sports, exercise, health</li><li><strong>Creativity</strong> — Art, music, writing</li><li><strong>Social</strong> — Communication, networking, teamwork</li><li><strong>Tech</strong> — Programming, tools, technology</li><li><strong>Mindfulness</strong> — Meditation, reflection, well-being</li></ul><p>Each branch has its own progress tree and level.</p>',
				category: 'features',
				order: 2,
				language: isDE ? 'de' : 'en',
				tags: ['branches', 'categories', 'skills', 'types'],
			},
			{
				id: 'faq-logging',
				question: isDE ? 'Wie protokolliere ich Aktivitäten?' : 'How do I log activities?',
				answer: isDE
					? '<p>Aktivitäten protokollieren ist schnell und einfach:</p><ol><li>Tippe auf <strong>Aktivität loggen</strong></li><li>Wähle den Skill-Bereich aus</li><li>Beschreibe kurz, was du gemacht hast</li><li>Gib die Dauer an</li><li>Die XP werden automatisch berechnet und gutgeschrieben</li></ol><p>Du kannst auch vergangene Aktivitäten nachträglich eintragen.</p>'
					: '<p>Logging activities is quick and easy:</p><ol><li>Tap <strong>Log Activity</strong></li><li>Select the skill branch</li><li>Briefly describe what you did</li><li>Enter the duration</li><li>XP is automatically calculated and credited</li></ol><p>You can also log past activities retroactively.</p>',
				category: 'features',
				order: 3,
				language: isDE ? 'de' : 'en',
				tags: ['logging', 'activities', 'tracking', 'record'],
			},
			{
				id: 'faq-achievements',
				question: isDE ? 'Wie funktionieren Erfolge?' : 'How do achievements work?',
				answer: isDE
					? '<p>Erfolge sind besondere Meilensteine, die du freischalten kannst:</p><ul><li><strong>Streak-Erfolge</strong> — Protokolliere Aktivitäten an aufeinanderfolgenden Tagen</li><li><strong>Level-Erfolge</strong> — Erreiche bestimmte Level in Skill-Bereichen</li><li><strong>Vielseitigkeit</strong> — Sei in mehreren Bereichen aktiv</li><li><strong>Spezial-Erfolge</strong> — Besondere Herausforderungen und Meilensteine</li></ul><p>Freigeschaltete Erfolge werden in deinem Profil angezeigt.</p>'
					: '<p>Achievements are special milestones you can unlock:</p><ul><li><strong>Streak achievements</strong> — Log activities on consecutive days</li><li><strong>Level achievements</strong> — Reach certain levels in skill branches</li><li><strong>Versatility</strong> — Be active across multiple branches</li><li><strong>Special achievements</strong> — Unique challenges and milestones</li></ul><p>Unlocked achievements are displayed on your profile.</p>',
				category: 'features',
				order: 4,
				language: isDE ? 'de' : 'en',
				tags: ['achievements', 'milestones', 'badges', 'streaks'],
			},
			{
				id: 'faq-privacy',
				question: isDE ? 'Wie werden meine Daten geschützt?' : 'How is my data protected?',
				answer: isDE
					? '<p>SkillTree ist <strong>offline-first</strong> und speichert deine Daten lokal:</p><ul><li>Alle Daten werden in <strong>IndexedDB</strong> direkt auf deinem Gerät gespeichert</li><li>Es werden keine Daten an Server gesendet</li><li>Die App funktioniert vollständig ohne Internetverbindung</li><li>Deine Fortschritte, Aktivitäten und Erfolge verlassen nie dein Gerät</li></ul><p>Du hast die volle Kontrolle über deine Daten — sie gehören dir allein.</p>'
					: '<p>SkillTree is <strong>offline-first</strong> and stores your data locally:</p><ul><li>All data is stored in <strong>IndexedDB</strong> directly on your device</li><li>No data is sent to servers</li><li>The app works completely without an internet connection</li><li>Your progress, activities, and achievements never leave your device</li></ul><p>You have full control over your data — it belongs to you alone.</p>',
				category: 'privacy',
				order: 5,
				language: isDE ? 'de' : 'en',
				tags: ['privacy', 'offline', 'indexeddb', 'local', 'data'],
			},
		],
		features: [
			{
				id: 'feature-branches',
				title: isDE ? 'Skill-Bereiche (6 Typen)' : 'Skill Branches (6 Types)',
				description: isDE
					? 'Verfolge deinen Fortschritt in 6 Lebensbereichen: Wissen, Fitness, Kreativität, Sozial, Technik und Achtsamkeit.'
					: 'Track your progress across 6 life areas: Knowledge, Fitness, Creativity, Social, Tech, and Mindfulness.',
				icon: '🌳',
				category: 'core',
				highlights: isDE
					? ['6 Lebensbereiche', 'Individueller Fortschritt', 'Visueller Skill-Baum']
					: ['6 life areas', 'Individual progress', 'Visual skill tree'],
				content: '',
				order: 1,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-xp',
				title: isDE ? 'XP-Levelsystem' : 'XP Leveling',
				description: isDE
					? 'Sammle Erfahrungspunkte und steige Level auf — gamifizierte persönliche Entwicklung im RPG-Stil.'
					: 'Earn experience points and level up — gamified personal development in RPG style.',
				icon: '⭐',
				category: 'core',
				highlights: isDE
					? ['RPG-Levelsystem', 'Automatische XP-Berechnung', 'Gesamtlevel']
					: ['RPG level system', 'Automatic XP calculation', 'Total level'],
				content: '',
				order: 2,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-logging',
				title: isDE ? 'Aktivitäten-Protokoll' : 'Activity Logging',
				description: isDE
					? 'Protokolliere Aktivitäten schnell und einfach, um XP zu sammeln und deinen Fortschritt zu verfolgen.'
					: 'Log activities quickly and easily to earn XP and track your progress.',
				icon: '📝',
				category: 'core',
				highlights: isDE
					? ['Schnelle Eingabe', 'Rückwirkende Einträge', 'Automatische XP']
					: ['Quick entry', 'Retroactive logging', 'Automatic XP'],
				content: '',
				order: 3,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-achievements',
				title: isDE ? 'Erfolge' : 'Achievements',
				description: isDE
					? 'Schalte Erfolge frei für Streaks, Level-Meilensteine und besondere Herausforderungen.'
					: 'Unlock achievements for streaks, level milestones, and special challenges.',
				icon: '🏆',
				category: 'advanced',
				highlights: isDE
					? ['Streak-Belohnungen', 'Level-Meilensteine', 'Spezial-Herausforderungen']
					: ['Streak rewards', 'Level milestones', 'Special challenges'],
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
				? '<p>Unser Support-Team hilft dir bei allen Fragen rund um SkillTree.</p>'
				: '<p>Our support team is here to help you with any questions about SkillTree.</p>',
			language: isDE ? 'de' : 'en',
			order: 1,
			supportEmail: 'support@mana.how',
			documentationUrl: 'https://mana.how/docs',
			responseTime: isDE ? 'Normalerweise innerhalb von 24 Stunden' : 'Usually within 24 hours',
		},
	};
}
