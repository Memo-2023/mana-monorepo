export const languages = {
  de: 'Deutsch',
  en: 'English',
  it: 'Italiano',
  fr: 'Français',
  es: 'Español'
} as const;

export type Language = keyof typeof languages;

export const defaultLang: Language = 'de';

// Helper to get the language from a URL
export function getLangFromUrl(url: URL): Language {
  const [, lang] = url.pathname.split('/');
  if (lang in languages) return lang as Language;
  return defaultLang;
}

// Helper to use translations
export function useTranslations(lang: Language) {
  return function t(key: string): string {
    return ui[lang][key as keyof typeof ui[typeof defaultLang]] || key;
  }
}

// UI translations
export const ui = {
  de: {
    // Navigation
    'nav.mission': 'Mission',
    'nav.apps': 'Apps',
    'nav.pricing': 'Preise',
    'nav.forWhom': 'Für wen?',
    'nav.references': 'Referenzen',
    'nav.privacy': 'Datenschutz',

    // Buttons
    'button.startFree': 'Kostenlos testen',
    'button.bookDemo': 'Demo buchen',
    'button.learnMore': 'Mehr erfahren',
    'button.back': 'Zurück',
    'button.backToOverview': 'Zurück zur Übersicht',

    // Homepage Hero
    'home.hero.title': 'Gemeinnützige',
    'home.hero.titleHighlight': 'unabhängige Software',
    'home.hero.subtitle': 'Wir entwickeln quelloffene KI-Anwendungen für Bildung, Forschung und Gesellschaft. Transparent, datenschutzfreundlich und für alle zugänglich.',
    'home.hero.imageAlt': 'Manacore - Gemeinnützige KI-Software',

    // Homepage Apps Section
    'home.apps.title': 'Entdecke unsere',
    'home.apps.titleHighlight': 'KI-Apps',
    'home.apps.subtitle': 'Zugriff auf ein wachsendes Ökosystem leistungsstarker KI-Anwendungen - alles mit einem Mana-Account',
    'home.apps.scrollHint': 'Scrolle für mehr',

    // App Categories
    'app.category.productivity': 'Produktivität',
    'app.category.creative': 'Kreativ',
    'app.category.wellness': 'Wellness',
    'app.category.research': 'Forschung',

    // App Descriptions
    'app.memoro.description': 'KI-gestützte Wissensplattform für intelligentes Lernen und Dokumentation',
    'app.maerchenzauber.description': 'Erstelle magische Kindergeschichten mit KI-Unterstützung',
    'app.moodlit.description': 'Deine persönliche KI für emotionales Wohlbefinden und mentale Gesundheit',
    'app.zitare.description': 'Intelligente Zitatverwaltung und Literaturrecherche für akademisches Arbeiten',
    'app.manadeck.description': 'KI-gestützte Karteikarten-App für effektives Lernen und Wissensmanagement',
    'app.pictus.description': 'Kreativer KI-Bildgenerator für beeindruckende Bilder und Kunstwerke',
    'app.orakel.description': 'Intelligente KI-Chat-Assistentin für alle Lebenslagen',
    'app.nutriphi.description': 'Intelligente Ernährungs-App mit KI-gestütztem Foto-Tracking',
    'app.traces.description': 'Entdecke deine Stadt neu mit KI-gestütztem Bewegungs-Tracking',
    
    // Footer
    'footer.product': 'Produkt',
    'footer.company': 'Unternehmen',
    'footer.resources': 'Ressourcen',
    'footer.legal': 'Rechtliches',
    'footer.aboutUs': 'Über uns',
    'footer.blog': 'Blog',
    'footer.contact': 'Kontakt',
    'footer.partners': 'Partner',
    'footer.documentation': 'Dokumentation',
    'footer.apiReference': 'API Reference',
    'footer.support': 'Support',
    'footer.faq': 'FAQ',
    'footer.privacyCenter': 'Datenschutz-Center',
    'footer.terms': 'AGB',
    'footer.privacyPolicy': 'Datenschutzerklärung',
    'footer.imprint': 'Impressum',
    'footer.rights': 'Alle Rechte vorbehalten.',
    
    // Common
    'common.and': 'und',
    'common.or': 'oder',
    'common.new': 'Neu',
    'common.comingSoon': 'Demnächst',
    'common.beta': 'Beta',
    'common.readMore': 'Weiterlesen',
    'common.showLess': 'Weniger anzeigen',
  },
  en: {
    // Navigation
    'nav.mission': 'Mission',
    'nav.apps': 'Apps',
    'nav.pricing': 'Pricing',
    'nav.forWhom': 'For whom?',
    'nav.references': 'References',
    'nav.privacy': 'Privacy',

    // Buttons
    'button.startFree': 'Start for free',
    'button.bookDemo': 'Book a demo',
    'button.learnMore': 'Learn more',
    'button.back': 'Back',
    'button.backToOverview': 'Back to overview',

    // Homepage Hero
    'home.hero.title': 'AI Power',
    'home.hero.titleHighlight': 'Without Limits',
    'home.hero.subtitle': 'Use the latest AI models flexibly and transparently with our innovative Mana credit system. One platform, unlimited possibilities.',
    'home.hero.imageAlt': 'Manacore AI - Flexible AI Usage',

    // Homepage Apps Section
    'home.apps.title': 'Discover our',
    'home.apps.titleHighlight': 'AI Apps',
    'home.apps.subtitle': 'Access to a growing ecosystem of powerful AI applications - all with one Mana account',
    'home.apps.scrollHint': 'Scroll for more',

    // App Categories
    'app.category.productivity': 'Productivity',
    'app.category.creative': 'Creative',
    'app.category.wellness': 'Wellness',
    'app.category.research': 'Research',

    // App Descriptions
    'app.memoro.description': 'AI-powered knowledge platform for intelligent learning and documentation',
    'app.maerchenzauber.description': 'Create magical children\'s stories with AI support',
    'app.moodlit.description': 'Your personal AI for emotional well-being and mental health',
    'app.zitare.description': 'Intelligent citation management and literature research for academic work',
    'app.manadeck.description': 'AI-powered flashcard app for effective learning and knowledge management',
    'app.pictus.description': 'Creative AI image generator for stunning pictures and artwork',
    'app.orakel.description': 'Intelligent AI chat assistant for all aspects of life',
    'app.nutriphi.description': 'Smart nutrition app with AI-powered photo tracking',
    'app.traces.description': 'Rediscover your city with AI-powered movement tracking',
    
    // Footer
    'footer.product': 'Product',
    'footer.company': 'Company',
    'footer.resources': 'Resources',
    'footer.legal': 'Legal',
    'footer.aboutUs': 'About us',
    'footer.blog': 'Blog',
    'footer.contact': 'Contact',
    'footer.partners': 'Partners',
    'footer.documentation': 'Documentation',
    'footer.apiReference': 'API Reference',
    'footer.support': 'Support',
    'footer.faq': 'FAQ',
    'footer.privacyCenter': 'Privacy Center',
    'footer.terms': 'Terms & Conditions',
    'footer.privacyPolicy': 'Privacy Policy',
    'footer.imprint': 'Imprint',
    'footer.rights': 'All rights reserved.',
    
    // Common
    'common.and': 'and',
    'common.or': 'or',
    'common.new': 'New',
    'common.comingSoon': 'Coming soon',
    'common.beta': 'Beta',
    'common.readMore': 'Read more',
    'common.showLess': 'Show less',
  },
  it: {
    // Navigation
    'nav.mission': 'Missione',
    'nav.apps': 'App',
    'nav.pricing': 'Prezzi',
    'nav.forWhom': 'Per chi?',
    'nav.references': 'Referenze',
    'nav.privacy': 'Privacy',

    // Buttons
    'button.startFree': 'Prova gratuita',
    'button.bookDemo': 'Prenota una demo',
    'button.learnMore': 'Scopri di più',
    'button.back': 'Indietro',
    'button.backToOverview': 'Torna alla panoramica',

    // Homepage Hero
    'home.hero.title': 'Potenza AI',
    'home.hero.titleHighlight': 'Senza Limiti',
    'home.hero.subtitle': 'Utilizza i modelli AI più recenti in modo flessibile e trasparente con il nostro innovativo sistema di crediti Mana. Una piattaforma, possibilità illimitate.',
    'home.hero.imageAlt': 'Manacore AI - Utilizzo flessibile dell\'AI',

    // Homepage Apps Section
    'home.apps.title': 'Scopri le nostre',
    'home.apps.titleHighlight': 'App AI',
    'home.apps.subtitle': 'Accesso a un ecosistema in crescita di potenti applicazioni AI - tutto con un account Mana',
    'home.apps.scrollHint': 'Scorri per vedere di più',

    // App Categories
    'app.category.productivity': 'Produttività',
    'app.category.creative': 'Creativo',
    'app.category.wellness': 'Benessere',
    'app.category.research': 'Ricerca',

    // App Descriptions
    'app.memoro.description': 'Piattaforma di conoscenza basata su AI per apprendimento e documentazione intelligenti',
    'app.maerchenzauber.description': 'Crea storie magiche per bambini con il supporto dell\'AI',
    'app.moodlit.description': 'La tua AI personale per il benessere emotivo e la salute mentale',
    'app.zitare.description': 'Gestione intelligente delle citazioni e ricerca bibliografica per lavoro accademico',
    'app.manadeck.description': 'App di flashcard basata su AI per apprendimento efficace e gestione della conoscenza',
    'app.pictus.description': 'Generatore di immagini AI creativo per immagini e opere d\'arte straordinarie',
    'app.orakel.description': 'Assistente chat AI intelligente per tutti gli aspetti della vita',
    'app.nutriphi.description': 'App di nutrizione intelligente con tracciamento fotografico basato su AI',
    'app.traces.description': 'Riscopri la tua città con il tracciamento dei movimenti basato su AI',

    // Footer
    'footer.product': 'Prodotto',
    'footer.company': 'Azienda',
    'footer.resources': 'Risorse',
    'footer.legal': 'Legale',
    'footer.aboutUs': 'Chi siamo',
    'footer.blog': 'Blog',
    'footer.contact': 'Contatti',
    'footer.partners': 'Partner',
    'footer.documentation': 'Documentazione',
    'footer.apiReference': 'Riferimento API',
    'footer.support': 'Supporto',
    'footer.faq': 'FAQ',
    'footer.privacyCenter': 'Centro Privacy',
    'footer.terms': 'Termini e Condizioni',
    'footer.privacyPolicy': 'Informativa sulla Privacy',
    'footer.imprint': 'Imprint',
    'footer.rights': 'Tutti i diritti riservati.',

    // Common
    'common.and': 'e',
    'common.or': 'o',
    'common.new': 'Nuovo',
    'common.comingSoon': 'Prossimamente',
    'common.beta': 'Beta',
    'common.readMore': 'Leggi di più',
    'common.showLess': 'Mostra meno',
  },
  fr: {
    // Navigation
    'nav.mission': 'Mission',
    'nav.apps': 'Applications',
    'nav.pricing': 'Tarifs',
    'nav.forWhom': 'Pour qui?',
    'nav.references': 'Références',
    'nav.privacy': 'Confidentialité',

    // Buttons
    'button.startFree': 'Essai gratuit',
    'button.bookDemo': 'Réserver une démo',
    'button.learnMore': 'En savoir plus',
    'button.back': 'Retour',
    'button.backToOverview': 'Retour à l\'aperçu',

    // Homepage Hero
    'home.hero.title': 'Puissance IA',
    'home.hero.titleHighlight': 'Sans Limites',
    'home.hero.subtitle': 'Utilisez les derniers modèles d\'IA de manière flexible et transparente avec notre système de crédits Mana innovant. Une plateforme, des possibilités illimitées.',
    'home.hero.imageAlt': 'Manacore AI - Utilisation flexible de l\'IA',

    // Homepage Apps Section
    'home.apps.title': 'Découvrez nos',
    'home.apps.titleHighlight': 'Applications IA',
    'home.apps.subtitle': 'Accès à un écosystème croissant d\'applications IA puissantes - le tout avec un compte Mana',
    'home.apps.scrollHint': 'Faites défiler pour plus',

    // App Categories
    'app.category.productivity': 'Productivité',
    'app.category.creative': 'Créatif',
    'app.category.wellness': 'Bien-être',
    'app.category.research': 'Recherche',

    // App Descriptions
    'app.memoro.description': 'Plateforme de connaissances basée sur l\'IA pour l\'apprentissage et la documentation intelligents',
    'app.maerchenzauber.description': 'Créez des histoires magiques pour enfants avec le soutien de l\'IA',
    'app.moodlit.description': 'Votre IA personnelle pour le bien-être émotionnel et la santé mentale',
    'app.zitare.description': 'Gestion intelligente des citations et recherche bibliographique pour le travail académique',
    'app.manadeck.description': 'Application de cartes mémoire basée sur l\'IA pour un apprentissage efficace et la gestion des connaissances',
    'app.pictus.description': 'Générateur d\'images IA créatif pour des images et œuvres d\'art époustouflantes',
    'app.orakel.description': 'Assistant de chat IA intelligent pour tous les aspects de la vie',
    'app.nutriphi.description': 'Application de nutrition intelligente avec suivi photographique basé sur l\'IA',
    'app.traces.description': 'Redécouvrez votre ville avec le suivi des déplacements basé sur l\'IA',

    // Footer
    'footer.product': 'Produit',
    'footer.company': 'Entreprise',
    'footer.resources': 'Ressources',
    'footer.legal': 'Mentions légales',
    'footer.aboutUs': 'À propos',
    'footer.blog': 'Blog',
    'footer.contact': 'Contact',
    'footer.partners': 'Partenaires',
    'footer.documentation': 'Documentation',
    'footer.apiReference': 'Référence API',
    'footer.support': 'Support',
    'footer.faq': 'FAQ',
    'footer.privacyCenter': 'Centre de confidentialité',
    'footer.terms': 'Conditions générales',
    'footer.privacyPolicy': 'Politique de confidentialité',
    'footer.imprint': 'Mentions légales',
    'footer.rights': 'Tous droits réservés.',

    // Common
    'common.and': 'et',
    'common.or': 'ou',
    'common.new': 'Nouveau',
    'common.comingSoon': 'Bientôt disponible',
    'common.beta': 'Bêta',
    'common.readMore': 'Lire plus',
    'common.showLess': 'Afficher moins',
  },
  es: {
    // Navigation
    'nav.mission': 'Misión',
    'nav.apps': 'Aplicaciones',
    'nav.pricing': 'Precios',
    'nav.forWhom': '¿Para quién?',
    'nav.references': 'Referencias',
    'nav.privacy': 'Privacidad',

    // Buttons
    'button.startFree': 'Prueba gratuita',
    'button.bookDemo': 'Reservar demo',
    'button.learnMore': 'Saber más',
    'button.back': 'Atrás',
    'button.backToOverview': 'Volver al resumen',

    // Homepage Hero
    'home.hero.title': 'Potencia IA',
    'home.hero.titleHighlight': 'Sin Límites',
    'home.hero.subtitle': 'Utiliza los últimos modelos de IA de forma flexible y transparente con nuestro innovador sistema de créditos Mana. Una plataforma, posibilidades ilimitadas.',
    'home.hero.imageAlt': 'Manacore AI - Uso flexible de IA',

    // Homepage Apps Section
    'home.apps.title': 'Descubre nuestras',
    'home.apps.titleHighlight': 'Aplicaciones IA',
    'home.apps.subtitle': 'Acceso a un ecosistema creciente de potentes aplicaciones de IA - todo con una cuenta Mana',
    'home.apps.scrollHint': 'Desplázate para más',

    // App Categories
    'app.category.productivity': 'Productividad',
    'app.category.creative': 'Creativo',
    'app.category.wellness': 'Bienestar',
    'app.category.research': 'Investigación',

    // App Descriptions
    'app.memoro.description': 'Plataforma de conocimiento impulsada por IA para aprendizaje y documentación inteligentes',
    'app.maerchenzauber.description': 'Crea historias mágicas para niños con soporte de IA',
    'app.moodlit.description': 'Tu IA personal para el bienestar emocional y la salud mental',
    'app.zitare.description': 'Gestión inteligente de citas e investigación bibliográfica para trabajo académico',
    'app.manadeck.description': 'App de tarjetas de memoria impulsada por IA para aprendizaje efectivo y gestión del conocimiento',
    'app.pictus.description': 'Generador de imágenes IA creativo para imágenes y obras de arte impresionantes',
    'app.orakel.description': 'Asistente de chat IA inteligente para todos los aspectos de la vida',
    'app.nutriphi.description': 'App de nutrición inteligente con seguimiento fotográfico basado en IA',
    'app.traces.description': 'Redescubre tu ciudad con seguimiento de movimiento basado en IA',

    // Footer
    'footer.product': 'Producto',
    'footer.company': 'Empresa',
    'footer.resources': 'Recursos',
    'footer.legal': 'Legal',
    'footer.aboutUs': 'Sobre nosotros',
    'footer.blog': 'Blog',
    'footer.contact': 'Contacto',
    'footer.partners': 'Socios',
    'footer.documentation': 'Documentación',
    'footer.apiReference': 'Referencia API',
    'footer.support': 'Soporte',
    'footer.faq': 'Preguntas frecuentes',
    'footer.privacyCenter': 'Centro de privacidad',
    'footer.terms': 'Términos y condiciones',
    'footer.privacyPolicy': 'Política de privacidad',
    'footer.imprint': 'Aviso legal',
    'footer.rights': 'Todos los derechos reservados.',

    // Common
    'common.and': 'y',
    'common.or': 'o',
    'common.new': 'Nuevo',
    'common.comingSoon': 'Próximamente',
    'common.beta': 'Beta',
    'common.readMore': 'Leer más',
    'common.showLess': 'Mostrar menos',
  }
} as const;