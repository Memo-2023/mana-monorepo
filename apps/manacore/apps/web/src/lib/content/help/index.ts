/**
 * Help content for ManaCore app
 */

import type { HelpContent } from '@manacore/shared-help-types';
import { getPrivacyFAQs } from '@manacore/shared-help-types';

export function getManaCoreHelpContent(locale: string): HelpContent {
	const isDE = locale === 'de';

	return {
		faq: [
			{
				id: 'faq-what-is-manacore',
				question: isDE ? 'Was ist ManaCore?' : 'What is ManaCore?',
				answer: isDE
					? '<p><strong>ManaCore</strong> ist die zentrale Plattform des Mana-Ökosystems:</p><ul><li>Verwalte dein <strong>Konto</strong> und Profil an einem zentralen Ort</li><li>Greife auf alle Mana-Apps zu — Chat, Picture, Zitare, Clock und mehr</li><li>Nutze <strong>Single Sign-On (SSO)</strong>, um dich einmal anzumelden und überall eingeloggt zu sein</li><li>Erstelle und verwalte <strong>Organisationen</strong> für Teamarbeit</li></ul>'
					: '<p><strong>ManaCore</strong> is the central platform of the Mana ecosystem:</p><ul><li>Manage your <strong>account</strong> and profile in one central place</li><li>Access all Mana apps — Chat, Picture, Zitare, Clock, and more</li><li>Use <strong>Single Sign-On (SSO)</strong> to log in once and be authenticated everywhere</li><li>Create and manage <strong>organizations</strong> for teamwork</li></ul>',
				category: 'general',
				order: 1,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['manacore', 'plattform', 'ökosystem'] : ['manacore', 'platform', 'ecosystem'],
			},
			{
				id: 'faq-sso',
				question: isDE
					? 'Wie funktioniert Single Sign-On (SSO)?'
					: 'How does Single Sign-On (SSO) work?',
				answer: isDE
					? '<p><strong>Single Sign-On</strong> ermöglicht dir, dich einmal anzumelden und alle Mana-Apps zu nutzen:</p><ol><li>Melde dich bei einer beliebigen Mana-App an (z.B. ManaCore, Chat, Picture)</li><li>Dein Login wird automatisch auf alle verbundenen Apps übertragen</li><li>Du bleibst eingeloggt, bis du dich explizit abmeldest</li></ol><p>SSO verwendet <strong>sichere JWT-Tokens</strong> mit EdDSA-Verschlüsselung. Dein Passwort wird nur einmal beim Login übertragen.</p>'
					: '<p><strong>Single Sign-On</strong> lets you log in once and use all Mana apps:</p><ol><li>Sign in to any Mana app (e.g. ManaCore, Chat, Picture)</li><li>Your login is automatically shared across all connected apps</li><li>You stay logged in until you explicitly sign out</li></ol><p>SSO uses <strong>secure JWT tokens</strong> with EdDSA encryption. Your password is only transmitted once during login.</p>',
				category: 'account',
				order: 2,
				language: isDE ? 'de' : 'en',
				tags: isDE
					? ['sso', 'anmeldung', 'login', 'authentifizierung']
					: ['sso', 'login', 'authentication', 'sign-in'],
			},
			{
				id: 'faq-organizations',
				question: isDE ? 'Wie verwalte ich Organisationen?' : 'How do I manage organizations?',
				answer: isDE
					? '<p><strong>Organisationen</strong> ermöglichen Teamarbeit im Mana-Ökosystem:</p><ul><li><strong>Erstellen</strong>: Gehe zu Einstellungen > Organisationen > Neue Organisation</li><li><strong>Mitglieder einladen</strong>: Lade Teammitglieder per E-Mail ein und weise Rollen zu (Admin, Mitglied)</li><li><strong>Apps verwalten</strong>: Aktiviere oder deaktiviere Apps pro Organisation</li><li><strong>Landing Page</strong>: Erstelle eine eigene Landingpage unter <code>slug.mana.how</code></li></ul>'
					: '<p><strong>Organizations</strong> enable teamwork in the Mana ecosystem:</p><ul><li><strong>Create</strong>: Go to Settings > Organizations > New Organization</li><li><strong>Invite members</strong>: Invite team members by email and assign roles (Admin, Member)</li><li><strong>Manage apps</strong>: Enable or disable apps per organization</li><li><strong>Landing page</strong>: Create a custom landing page at <code>slug.mana.how</code></li></ul>',
				category: 'features',
				order: 3,
				language: isDE ? 'de' : 'en',
				tags: isDE
					? ['organisation', 'team', 'mitglieder', 'verwalten']
					: ['organization', 'team', 'members', 'manage'],
			},
			{
				id: 'faq-switch-apps',
				question: isDE ? 'Wie wechsle ich zwischen Apps?' : 'How do I switch between apps?',
				answer: isDE
					? '<p>Du kannst schnell zwischen Mana-Apps wechseln:</p><ul><li><strong>App-Übersicht</strong>: Klicke auf das App-Menü in der Navigation, um alle verfügbaren Apps zu sehen</li><li><strong>Direkt-Links</strong>: Jede App hat ihre eigene URL (z.B. chat.mana.how, picture.mana.how)</li><li><strong>Dashboard</strong>: Das ManaCore-Dashboard zeigt alle deine Apps mit Schnellzugriff</li></ul><p>Dein Login bleibt dank SSO beim Wechsel zwischen Apps erhalten.</p>'
					: '<p>You can quickly switch between Mana apps:</p><ul><li><strong>App overview</strong>: Click the app menu in the navigation to see all available apps</li><li><strong>Direct links</strong>: Each app has its own URL (e.g. chat.mana.how, picture.mana.how)</li><li><strong>Dashboard</strong>: The ManaCore dashboard shows all your apps with quick access</li></ul><p>Your login persists when switching between apps thanks to SSO.</p>',
				category: 'general',
				order: 4,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['wechseln', 'apps', 'navigation'] : ['switch', 'apps', 'navigation'],
			},
			...getPrivacyFAQs(locale, { dataTypeDE: 'Daten', dataTypeEN: 'data' }),
		],
		features: [
			{
				id: 'feature-sso',
				title: 'Single Sign-On',
				description: isDE
					? 'Einmal anmelden und alle Mana-Apps nutzen'
					: 'Sign in once and use all Mana apps',
				icon: '🔐',
				category: 'core',
				highlights: isDE
					? ['Ein Login für alles', 'EdDSA JWT-Tokens', 'Sichere Sitzungen', 'Automatischer Logout']
					: ['One login for everything', 'EdDSA JWT tokens', 'Secure sessions', 'Automatic logout'],
				content: '',
				order: 1,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-app-ecosystem',
				title: isDE ? 'App-Ökosystem' : 'App Ecosystem',
				description: isDE
					? 'Zugang zu allen Mana-Apps über eine zentrale Plattform'
					: 'Access all Mana apps from one central platform',
				icon: '🌐',
				category: 'core',
				highlights: isDE
					? ['App-Übersicht', 'Schnellzugriff', 'Einheitliches Design', 'Verbundene Daten']
					: ['App overview', 'Quick access', 'Unified design', 'Connected data'],
				content: '',
				order: 2,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-organizations',
				title: isDE ? 'Organisationen & Teams' : 'Organizations & Teams',
				description: isDE
					? 'Erstelle Organisationen und verwalte Teammitglieder und Rollen'
					: 'Create organizations and manage team members and roles',
				icon: '👥',
				category: 'advanced',
				highlights: isDE
					? ['Rollenbasierter Zugriff', 'Team-Einladungen', 'App-Verwaltung', 'Landing Pages']
					: ['Role-based access', 'Team invitations', 'App management', 'Landing pages'],
				content: '',
				order: 3,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-unified-profile',
				title: isDE ? 'Einheitliches Profil' : 'Unified Profile',
				description: isDE
					? 'Verwalte dein Profil, Einstellungen und Sicherheit an einem Ort'
					: 'Manage your profile, settings, and security in one place',
				icon: '👤',
				category: 'core',
				highlights: isDE
					? ['Profilbild', 'Sicherheitseinstellungen', 'Sitzungsverwaltung', 'Datenexport']
					: ['Profile picture', 'Security settings', 'Session management', 'Data export'],
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
				? '<p>Unser Support-Team hilft dir bei allen Fragen rund um ManaCore.</p>'
				: '<p>Our support team is here to help you with any questions about ManaCore.</p>',
			language: isDE ? 'de' : 'en',
			order: 1,
			supportEmail: 'support@mana.how',
			documentationUrl: 'https://mana.how/docs',
			responseTime: isDE ? 'Normalerweise innerhalb von 24 Stunden' : 'Usually within 24 hours',
		},
	};
}
