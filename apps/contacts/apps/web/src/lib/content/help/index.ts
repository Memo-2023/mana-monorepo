/**
 * Central help content loader for Contacts app
 * This file loads and merges the central help content from @manacore/shared-help-content
 */

import type { HelpContent } from '@manacore/shared-help-types';
import { createEmptyContent } from '@manacore/shared-help-content';

/**
 * Central help content that applies to all Manacore apps
 * In a production setup, this would be loaded from the shared-help-content package's
 * Markdown files. For now, we provide the content inline for simplicity.
 */
export const centralHelpContent: HelpContent = {
	faq: [
		// Account FAQs
		{
			id: 'faq-account-001',
			question: 'How do I create an account?',
			answer: `<p>Creating an account is simple:</p>
				<ol>
					<li>Click the <strong>Sign Up</strong> button on the login page</li>
					<li>Enter your email address and choose a secure password</li>
					<li>Verify your email address by clicking the link we send you</li>
					<li>Complete your profile setup</li>
				</ol>
				<p>You can also sign up using your Google or Apple account for faster registration.</p>`,
			category: 'account',
			order: 1,
			language: 'en',
			featured: true,
			tags: ['account', 'registration', 'signup'],
		},
		{
			id: 'faq-account-001',
			question: 'Wie erstelle ich ein Konto?',
			answer: `<p>Die Kontoerstellung ist einfach:</p>
				<ol>
					<li>Klicke auf <strong>Registrieren</strong> auf der Anmeldeseite</li>
					<li>Gib deine E-Mail-Adresse ein und wähle ein sicheres Passwort</li>
					<li>Bestätige deine E-Mail-Adresse durch Klick auf den Link, den wir dir senden</li>
					<li>Vervollständige dein Profil</li>
				</ol>
				<p>Du kannst dich auch mit deinem Google- oder Apple-Konto registrieren, um schneller loszulegen.</p>`,
			category: 'account',
			order: 1,
			language: 'de',
			featured: true,
			tags: ['konto', 'registrierung', 'anmeldung'],
		},
		// Billing FAQs
		{
			id: 'faq-billing-001',
			question: 'How do I cancel my subscription?',
			answer: `<p>You can cancel your subscription at any time:</p>
				<ol>
					<li>Go to <strong>Settings</strong> > <strong>Subscription</strong></li>
					<li>Click <strong>Manage Subscription</strong></li>
					<li>Select <strong>Cancel Subscription</strong></li>
					<li>Confirm your cancellation</li>
				</ol>
				<p>Your subscription will remain active until the end of the current billing period. You won't be charged again after cancellation.</p>`,
			category: 'billing',
			order: 1,
			language: 'en',
			featured: true,
			tags: ['subscription', 'cancel', 'billing'],
		},
		{
			id: 'faq-billing-001',
			question: 'Wie kann ich mein Abo kündigen?',
			answer: `<p>Du kannst dein Abo jederzeit kündigen:</p>
				<ol>
					<li>Gehe zu <strong>Einstellungen</strong> > <strong>Abonnement</strong></li>
					<li>Klicke auf <strong>Abo verwalten</strong></li>
					<li>Wähle <strong>Abo kündigen</strong></li>
					<li>Bestätige die Kündigung</li>
				</ol>
				<p>Dein Abo bleibt bis zum Ende des aktuellen Abrechnungszeitraums aktiv. Nach der Kündigung erfolgen keine weiteren Abbuchungen.</p>`,
			category: 'billing',
			order: 1,
			language: 'de',
			featured: true,
			tags: ['abo', 'kündigung', 'abrechnung'],
		},
		// Privacy FAQs
		{
			id: 'faq-privacy-001',
			question: 'How is my data protected?',
			answer: `<p>We take your privacy seriously:</p>
				<ul>
					<li><strong>Encryption</strong>: All data is encrypted in transit (TLS) and at rest</li>
					<li><strong>GDPR Compliant</strong>: We follow EU data protection regulations</li>
					<li><strong>No Data Selling</strong>: We never sell your personal data to third parties</li>
					<li><strong>Data Export</strong>: You can export all your data at any time</li>
					<li><strong>Account Deletion</strong>: You can permanently delete your account and all associated data</li>
				</ul>`,
			category: 'privacy',
			order: 1,
			language: 'en',
			featured: true,
			tags: ['privacy', 'data', 'security', 'gdpr'],
		},
		{
			id: 'faq-privacy-001',
			question: 'Wie werden meine Daten geschützt?',
			answer: `<p>Wir nehmen deinen Datenschutz ernst:</p>
				<ul>
					<li><strong>Verschlüsselung</strong>: Alle Daten werden bei der Übertragung (TLS) und im Ruhezustand verschlüsselt</li>
					<li><strong>DSGVO-konform</strong>: Wir halten uns an die EU-Datenschutzverordnung</li>
					<li><strong>Kein Datenverkauf</strong>: Wir verkaufen niemals deine persönlichen Daten an Dritte</li>
					<li><strong>Datenexport</strong>: Du kannst jederzeit alle deine Daten exportieren</li>
					<li><strong>Kontolöschung</strong>: Du kannst dein Konto und alle zugehörigen Daten dauerhaft löschen</li>
				</ul>`,
			category: 'privacy',
			order: 1,
			language: 'de',
			featured: true,
			tags: ['datenschutz', 'daten', 'sicherheit', 'dsgvo'],
		},
	],
	features: [],
	shortcuts: [],
	gettingStarted: [
		{
			id: 'guide-welcome',
			title: 'Getting Started',
			description: 'Learn the basics and get up and running quickly',
			content: `<h2>Create Your Account</h2>
				<p>Start by creating your free account. You can sign up with your email address or use Google/Apple sign-in for a faster setup.</p>
				<h2>Explore the Dashboard</h2>
				<p>After logging in, you'll see your dashboard. This is your home base where you can access all features and see important information at a glance.</p>
				<h2>Customize Your Settings</h2>
				<p>Visit the Settings page to personalize your experience.</p>`,
			difficulty: 'beginner',
			estimatedTime: '5 minutes',
			order: 1,
			language: 'en',
		},
		{
			id: 'guide-welcome',
			title: 'Erste Schritte',
			description: 'Lerne die Grundlagen und starte schnell durch',
			content: `<h2>Konto erstellen</h2>
				<p>Beginne mit der Erstellung deines kostenlosen Kontos. Du kannst dich mit deiner E-Mail-Adresse registrieren oder Google/Apple für eine schnellere Anmeldung nutzen.</p>
				<h2>Dashboard erkunden</h2>
				<p>Nach dem Einloggen siehst du dein Dashboard. Dies ist deine Zentrale, von der aus du auf alle Funktionen zugreifen kannst.</p>
				<h2>Einstellungen anpassen</h2>
				<p>Besuche die Einstellungen, um dein Erlebnis zu personalisieren.</p>`,
			difficulty: 'beginner',
			estimatedTime: '5 Minuten',
			order: 1,
			language: 'de',
		},
	],
	changelog: [],
	contact: {
		id: 'contact-support',
		title: 'Contact Support',
		content: `<h2>Need Help?</h2>
			<p>Our support team is here to help you with any questions or issues.</p>
			<h3>Before Contacting Us</h3>
			<ul>
				<li>Check the <strong>FAQ</strong> section for quick answers</li>
				<li>Browse our <strong>Getting Started</strong> guides</li>
				<li>Search the help center using the search bar</li>
			</ul>`,
		language: 'en',
		order: 1,
		supportEmail: 'support@mana.how',
		responseTime: 'Usually within 24 hours',
	},
};
