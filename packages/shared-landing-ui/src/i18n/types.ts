/**
 * Shared i18n types for landing pages
 */

export type Language = 'de' | 'en' | 'fr' | 'it' | 'es';

export const languages: Record<Language, string> = {
	de: 'Deutsch',
	en: 'English',
	fr: 'Français',
	it: 'Italiano',
	es: 'Español',
};

export const defaultLang: Language = 'de';

/**
 * Common translations interface that all apps should implement
 * Apps can extend this with their own specific translations
 */
export interface CommonTranslations {
	// Navigation
	'nav.home'?: string;
	'nav.features'?: string;
	'nav.pricing'?: string;
	'nav.about'?: string;
	'nav.contact'?: string;
	'nav.login'?: string;
	'nav.signup'?: string;

	// Buttons
	'button.getStarted'?: string;
	'button.learnMore'?: string;
	'button.tryFree'?: string;
	'button.signUp'?: string;
	'button.login'?: string;
	'button.back'?: string;
	'button.submit'?: string;
	'button.cancel'?: string;

	// Legal
	'legal.privacy'?: string;
	'legal.terms'?: string;
	'legal.cookies'?: string;
	'legal.imprint'?: string;
	'legal.backHome'?: string;
	'legal.lastUpdated'?: string;

	// Footer
	'footer.product'?: string;
	'footer.company'?: string;
	'footer.resources'?: string;
	'footer.legal'?: string;
	'footer.copyright'?: string;

	// Common
	'common.loading'?: string;
	'common.error'?: string;
	'common.success'?: string;
	'common.new'?: string;
	'common.comingSoon'?: string;

	// Allow any other string keys
	[key: string]: string | undefined;
}

/**
 * Type for a translations object mapping languages to translations
 */
export type Translations<T extends CommonTranslations = CommonTranslations> = Record<Language, T>;

/**
 * Default common translations in all supported languages
 */
export const defaultCommonTranslations: Translations<CommonTranslations> = {
	de: {
		'nav.home': 'Startseite',
		'nav.features': 'Funktionen',
		'nav.pricing': 'Preise',
		'nav.about': 'Über uns',
		'nav.contact': 'Kontakt',
		'nav.login': 'Anmelden',
		'nav.signup': 'Registrieren',
		'button.getStarted': 'Jetzt starten',
		'button.learnMore': 'Mehr erfahren',
		'button.tryFree': 'Kostenlos testen',
		'button.signUp': 'Registrieren',
		'button.login': 'Anmelden',
		'button.back': 'Zurück',
		'button.submit': 'Absenden',
		'button.cancel': 'Abbrechen',
		'legal.privacy': 'Datenschutz',
		'legal.terms': 'AGB',
		'legal.cookies': 'Cookies',
		'legal.imprint': 'Impressum',
		'legal.backHome': 'Zurück zur Startseite',
		'legal.lastUpdated': 'Zuletzt aktualisiert',
		'footer.product': 'Produkt',
		'footer.company': 'Unternehmen',
		'footer.resources': 'Ressourcen',
		'footer.legal': 'Rechtliches',
		'footer.copyright': 'Alle Rechte vorbehalten.',
		'common.loading': 'Laden...',
		'common.error': 'Fehler',
		'common.success': 'Erfolg',
		'common.new': 'Neu',
		'common.comingSoon': 'Demnächst',
	},
	en: {
		'nav.home': 'Home',
		'nav.features': 'Features',
		'nav.pricing': 'Pricing',
		'nav.about': 'About',
		'nav.contact': 'Contact',
		'nav.login': 'Login',
		'nav.signup': 'Sign Up',
		'button.getStarted': 'Get Started',
		'button.learnMore': 'Learn More',
		'button.tryFree': 'Try for Free',
		'button.signUp': 'Sign Up',
		'button.login': 'Login',
		'button.back': 'Back',
		'button.submit': 'Submit',
		'button.cancel': 'Cancel',
		'legal.privacy': 'Privacy Policy',
		'legal.terms': 'Terms of Service',
		'legal.cookies': 'Cookie Policy',
		'legal.imprint': 'Imprint',
		'legal.backHome': 'Back to Home',
		'legal.lastUpdated': 'Last Updated',
		'footer.product': 'Product',
		'footer.company': 'Company',
		'footer.resources': 'Resources',
		'footer.legal': 'Legal',
		'footer.copyright': 'All rights reserved.',
		'common.loading': 'Loading...',
		'common.error': 'Error',
		'common.success': 'Success',
		'common.new': 'New',
		'common.comingSoon': 'Coming Soon',
	},
	fr: {
		'nav.home': 'Accueil',
		'nav.features': 'Fonctionnalités',
		'nav.pricing': 'Tarifs',
		'nav.about': 'À propos',
		'nav.contact': 'Contact',
		'nav.login': 'Connexion',
		'nav.signup': "S'inscrire",
		'button.getStarted': 'Commencer',
		'button.learnMore': 'En savoir plus',
		'button.tryFree': 'Essai gratuit',
		'button.signUp': "S'inscrire",
		'button.login': 'Connexion',
		'button.back': 'Retour',
		'button.submit': 'Envoyer',
		'button.cancel': 'Annuler',
		'legal.privacy': 'Confidentialité',
		'legal.terms': "Conditions d'utilisation",
		'legal.cookies': 'Politique de cookies',
		'legal.imprint': 'Mentions légales',
		'legal.backHome': "Retour à l'accueil",
		'legal.lastUpdated': 'Dernière mise à jour',
		'footer.product': 'Produit',
		'footer.company': 'Entreprise',
		'footer.resources': 'Ressources',
		'footer.legal': 'Mentions légales',
		'footer.copyright': 'Tous droits réservés.',
		'common.loading': 'Chargement...',
		'common.error': 'Erreur',
		'common.success': 'Succès',
		'common.new': 'Nouveau',
		'common.comingSoon': 'Bientôt disponible',
	},
	it: {
		'nav.home': 'Home',
		'nav.features': 'Funzionalità',
		'nav.pricing': 'Prezzi',
		'nav.about': 'Chi siamo',
		'nav.contact': 'Contatti',
		'nav.login': 'Accedi',
		'nav.signup': 'Registrati',
		'button.getStarted': 'Inizia',
		'button.learnMore': 'Scopri di più',
		'button.tryFree': 'Prova gratuita',
		'button.signUp': 'Registrati',
		'button.login': 'Accedi',
		'button.back': 'Indietro',
		'button.submit': 'Invia',
		'button.cancel': 'Annulla',
		'legal.privacy': 'Privacy',
		'legal.terms': 'Termini di servizio',
		'legal.cookies': 'Cookie Policy',
		'legal.imprint': 'Imprint',
		'legal.backHome': 'Torna alla home',
		'legal.lastUpdated': 'Ultimo aggiornamento',
		'footer.product': 'Prodotto',
		'footer.company': 'Azienda',
		'footer.resources': 'Risorse',
		'footer.legal': 'Legale',
		'footer.copyright': 'Tutti i diritti riservati.',
		'common.loading': 'Caricamento...',
		'common.error': 'Errore',
		'common.success': 'Successo',
		'common.new': 'Nuovo',
		'common.comingSoon': 'Prossimamente',
	},
	es: {
		'nav.home': 'Inicio',
		'nav.features': 'Características',
		'nav.pricing': 'Precios',
		'nav.about': 'Nosotros',
		'nav.contact': 'Contacto',
		'nav.login': 'Iniciar sesión',
		'nav.signup': 'Registrarse',
		'button.getStarted': 'Empezar',
		'button.learnMore': 'Saber más',
		'button.tryFree': 'Prueba gratis',
		'button.signUp': 'Registrarse',
		'button.login': 'Iniciar sesión',
		'button.back': 'Atrás',
		'button.submit': 'Enviar',
		'button.cancel': 'Cancelar',
		'legal.privacy': 'Privacidad',
		'legal.terms': 'Términos de servicio',
		'legal.cookies': 'Política de cookies',
		'legal.imprint': 'Aviso legal',
		'legal.backHome': 'Volver al inicio',
		'legal.lastUpdated': 'Última actualización',
		'footer.product': 'Producto',
		'footer.company': 'Empresa',
		'footer.resources': 'Recursos',
		'footer.legal': 'Legal',
		'footer.copyright': 'Todos los derechos reservados.',
		'common.loading': 'Cargando...',
		'common.error': 'Error',
		'common.success': 'Éxito',
		'common.new': 'Nuevo',
		'common.comingSoon': 'Próximamente',
	},
};
