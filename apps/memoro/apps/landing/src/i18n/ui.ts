interface UI {
  [key: string]: {
    [key: string]: string;
  };
}

export const languages = {
  de: 'Deutsch',
  en: 'English',
};

export const defaultLang = 'de';

export const ui: UI = {
  de: {
    'nav.home': 'Startseite',
    'nav.features': 'Funktionen',
    'nav.guides': 'Anleitungen',
    'nav.blog': 'Blog',
    'nav.team': 'Team',
    'nav.download': 'Download',
    'nav.contracts': 'Verträge',
    'nav.blueprints': 'Vorlagen',
    
    // Features page
    'features.title': 'Unsere Funktionen',
    'features.description': 'Entdecke die vielfältigen Möglichkeiten und Features unserer modernen Plattform.',
    
    // Blueprints page
    'blueprints.title': 'Verfügbare Vorlagen',
    'blueprints.description': 'Entdecke unsere verschiedenen Vorlagen für unterschiedliche Anwendungsfälle',
    'blueprints.features': 'Funktionen',
    'blueprints.compatibility': 'Kompatibilität',
    'blueprints.lastUpdated': 'Zuletzt aktualisiert',
    'blueprints.backToOverview': 'Zurück zur Übersicht',
    'blueprints.readMore': 'Mehr erfahren',
    
    // Guides page
    'guides.title': 'Anleitungen & Tutorials',
    'guides.description': 'Entdecken Sie unsere umfassende Sammlung an Anleitungen und lernen Sie, wie Sie die Plattform optimal nutzen.',
    'guides.filter.all': 'Alle',
    'guides.difficulty.beginner': 'Anfänger',
    'guides.difficulty.intermediate': 'Fortgeschritten',
    'guides.difficulty.advanced': 'Experte',
    'guides.readMore': 'Weiterlesen',
    
    // Blog page
    'blog.title': 'Unser Blog',
    'blog.description': 'Aktuelle Neuigkeiten, Updates und Einblicke in unsere Plattform.',
    'blog.readMore': 'Weiterlesen',
    
    // Team page
    'team.title': 'Unser Team',
    'team.description': 'Die Menschen hinter der Plattform.',
    'team.backToTeam': '← Zurück zum Team',
    'team.connect': 'Verbinden',
    
    // Call to action
    'cta.ready': 'Bereit loszulegen?',
    'cta.discover': 'Entdecke alle Funktionen und starte noch heute.',
    'cta.start': 'Jetzt starten',
    'cta.learnMore': 'Mehr erfahren',

    // Guide detail page
    'guides.backToOverview': '← Zurück zur Übersicht',
    'guides.wasFeedbackHelpful': 'War diese Anleitung hilfreich?',

    // Contracts page
    'contracts.title': 'Verträge & Rechtliches',
    'contracts.description': 'Alle rechtlichen Dokumente und Verträge für unsere Plattform',
    'contracts.download': 'Als PDF herunterladen',
    'contracts.lastUpdated': 'Zuletzt aktualisiert',
    'contracts.backToOverview': 'Zurück zur Übersicht',
    
    // Download page
    'download.title': 'Download',
    'download.description': 'Laden Sie die Memoro App für Ihr Gerät herunter',
    'download.windows': 'Windows',
    'download.windowsDesc': 'Für Windows 10 und neuer',
    'download.mac': 'macOS',
    'download.macDesc': 'Für macOS 10.15 und neuer',
    'download.linux': 'Linux',
    'download.linuxDesc': 'Für Ubuntu, Debian und andere Linux-Distributionen',
    'download.downloadButton': 'Herunterladen',

    // Common
    'common.yes': 'Ja',
    'common.no': 'Nein',
    
    // Testimonials
    'testimonials.title': 'Was unsere Nutzer sagen',
    'testimonials.subtitle': 'Erfahren Sie, wie Memoro Profis aus verschiedenen Branchen dabei hilft, effizienter zu arbeiten',
    'testimonials.role.projectManager': 'Projektmanager',
    'testimonials.role.doctor': 'Ärztin',
    'testimonials.role.freelancer': 'Freelancer',
    
    // FAQ
    'faq.title': 'Häufig gestellte Fragen',
    'faq.subtitle': 'Finden Sie Antworten auf die wichtigsten Fragen zu Memoro',
    'faq.description': 'Finden Sie Antworten auf die häufigsten Fragen zu Memoro',
    
    // Final CTA
    'finalCta.title': 'Bereit, Ihre Produktivität zu steigern?',
    'finalCta.subtitle': 'Wählen Sie die Option, die am besten zu Ihnen passt',
    'finalCta.trialTitle': 'Selbst ausprobieren',
    'finalCta.trialSubtitle': '14 Tage kostenlos testen',
    'finalCta.trialDescription': 'Keine Kreditkarte erforderlich. Voller Funktionsumfang.',
    'finalCta.trialButton': 'Kostenlos starten',
    'finalCta.demoTitle': 'Erst überzeugen lassen',
    'finalCta.demoSubtitle': '15-minütige Live-Demo',
    'finalCta.demoDescription': 'Persönliche Beratung. Alle Fragen beantwortet.',
    'finalCta.demoButton': 'Demo buchen',
    
    // How It Works
    'howItWorks.title': 'So funktioniert Memoro',
    'howItWorks.subtitle': 'In drei einfachen Schritten zu perfekter Dokumentation',
    'howItWorks.tabs.meetings': 'Meetings',
    'howItWorks.tabs.personal': 'Persönlich',
    'howItWorks.meetings.step1.title': 'Aufnehmen',
    'howItWorks.meetings.step1.description': 'Starten Sie die Aufnahme in Meetings oder laden Sie Audio-Dateien hoch',
    'howItWorks.meetings.step2.title': 'KI verarbeitet',
    'howItWorks.meetings.step2.description': 'Automatische Transkription, Sprechererkennung und intelligente Strukturierung',
    'howItWorks.meetings.step3.title': 'Dokumentation fertig',
    'howItWorks.meetings.step3.description': 'Erhalten Sie strukturierte Protokolle mit Aufgaben und Kernpunkten',
    'howItWorks.personal.step1.title': 'Sprechen Sie einfach',
    'howItWorks.personal.step1.description': 'Diktieren Sie Ihre Gedanken, Ideen oder Notizen',
    'howItWorks.personal.step2.title': 'Automatisch organisiert',
    'howItWorks.personal.step2.description': 'KI erkennt Themen und strukturiert Ihre Inhalte',
    'howItWorks.personal.step3.title': 'Sofort durchsuchbar',
    'howItWorks.personal.step3.description': 'Finden Sie alles wieder mit intelligenter Suche',
    'howItWorks.demo.title': 'Erleben Sie Memoro in Aktion',
    'howItWorks.demo.description': 'Testen Sie die Spracheingabe direkt hier',
    'howItWorks.demo.recording': 'Sprechen Sie jetzt...',
    'howItWorks.demo.cta': 'Kostenlos testen',
    
    // Use Cases
    'useCases.title': 'Für jeden Anwendungsfall',
    'useCases.subtitle': 'Memoro passt sich Ihren Bedürfnissen an',
    'useCases.business.title': 'Business & Management',
    'useCases.business.description': 'Perfekt für Meetings, Projektmanagement und Teamkommunikation',
    'useCases.business.benefit1': 'Automatische Meeting-Protokolle',
    'useCases.business.benefit2': 'Aufgabenerkennung und -zuweisung',
    'useCases.office.title': 'Büro & Verwaltung',
    'useCases.office.description': 'Optimieren Sie Ihre Büroarbeit mit KI-gestützter Dokumentation',
    'useCases.office.benefit1': 'Automatische Meetingprotokolle',
    'useCases.office.benefit2': 'Effiziente Aufgabenverwaltung',
    'useCases.legal.title': 'Recht & Beratung',
    'useCases.legal.description': 'Mandantengespräche sicher dokumentieren',
    'useCases.legal.benefit1': 'Rechtssichere Dokumentation',
    'useCases.legal.benefit2': 'Zeitstempel und Audit-Trail',
    'useCases.education.title': 'Bildung & Forschung',
    'useCases.education.description': 'Vorlesungen, Interviews und Forschungsgespräche festhalten',
    'useCases.education.benefit1': 'Automatische Kapitelgliederung',
    'useCases.education.benefit2': 'Zitate und Quellen verwalten',
    'useCases.creative.title': 'Kreative & Medien',
    'useCases.creative.description': 'Brainstorming, Interviews und Content-Erstellung',
    'useCases.creative.benefit1': 'Ideen sofort festhalten',
    'useCases.creative.benefit2': 'Content in verschiedene Formate',
    'useCases.personal.title': 'Persönliche Nutzung',
    'useCases.personal.description': 'Tagebuch, Gedanken und persönliche Notizen',
    'useCases.personal.benefit1': 'Privat und verschlüsselt',
    'useCases.personal.benefit2': 'Überall verfügbar',
    'useCases.cta.text': 'Finden Sie Ihren perfekten Anwendungsfall',
    'useCases.cta.button': 'Jetzt Demo ansehen',
    
    // Numbers Section
    'numbers.title': 'Zahlen, die überzeugen',
    'numbers.subtitle': 'Vertrauen Sie auf unsere bewährte Plattform',
    'numbers.users.title': 'Nutzer',
    'numbers.users.description': 'Vertrauen bereits auf Memoro',
    'numbers.minutes.title': 'Minuten transkribiert',
    'numbers.minutes.description': 'Über 5.200 Stunden Gespräche',
    'numbers.words.title': 'Millionen Wörter',
    'numbers.words.description': 'Erfolgreich verarbeitet',
    'numbers.recordings.title': 'Aufnahmen',
    'numbers.recordings.description': 'Gespräche und Notizen dokumentiert',
    'numbers.testimonial.quote': 'Seit wir Memoro nutzen, sparen wir pro Woche mindestens 10 Stunden bei der Dokumentation. Die automatische Aufgabenerkennung hat unsere Projektabläufe revolutioniert.',
    'numbers.testimonial.author': 'Anna Schneider',
    'numbers.testimonial.role': 'CEO, TechInnovate GmbH',
    'numbers.cta': 'Berechnen Sie Ihre Zeitersparnis',
    
    // Contact page
    'contact.name': 'Name',
    'contact.email': 'E-Mail',
    'contact.message': 'Nachricht',
    'contact.submit': 'Absenden',
    
    // Cookie Consent
    'cookie.title': 'Wir verwenden Cookies',
    'cookie.description': 'Wir verwenden Cookies, um Ihre Erfahrung auf unserer Website zu verbessern. Mit Klick auf "Alle akzeptieren" stimmen Sie der Verwendung aller Cookies zu.',
    'cookie.privacy_link': 'Datenschutzerklärung',
    'cookie.settings': 'Einstellungen',
    'cookie.settings_aria': 'Cookie-Einstellungen öffnen',
    'cookie.reject_all': 'Alle ablehnen',
    'cookie.reject_all_aria': 'Alle optionalen Cookies ablehnen',
    'cookie.accept_all': 'Alle akzeptieren',
    'cookie.accept_all_aria': 'Alle Cookies akzeptieren',
    'cookie.settings_title': 'Cookie-Einstellungen',
    'cookie.close_settings': 'Einstellungen schließen',
    'cookie.necessary_title': 'Notwendige Cookies',
    'cookie.necessary_description': 'Diese Cookies sind für das ordnungsgemäße Funktionieren der Website unerlässlich. Sie ermöglichen grundlegende Funktionen wie die Seitennavigation und den Zugriff auf sichere Bereiche.',
    'cookie.always_active': 'Immer aktiv',
    'cookie.analytics_title': 'Analyse-Cookies',
    'cookie.analytics_description': 'Wir verwenden PostHog für erweiterte Analysen, A/B-Tests und Feature-Flags. Umami Analytics läuft cookielos und benötigt keine Einwilligung.',
    'cookie.marketing_title': 'Marketing-Cookies',
    'cookie.marketing_description': 'Diese Cookies können von unseren Werbepartnern gesetzt werden, um ein Profil Ihrer Interessen zu erstellen und Ihnen relevante Anzeigen auf anderen Websites zu zeigen.',
    'cookie.functional_title': 'Funktionale Cookies',
    'cookie.functional_description': 'Diese Cookies ermöglichen erweiterte Funktionen und Personalisierung, wie das Speichern Ihrer Präferenzen.',
    'cookie.save_selected': 'Auswahl speichern',
    
    // SEO Meta Descriptions
    'seo.home.title': 'Memoro - KI-gestützte Gesprächsdokumentation & Notizen-App',
    'seo.home.description': 'Memoro revolutioniert die Gesprächsdokumentation mit KI. Automatische Transkription, intelligente Zusammenfassung und Aufgabenerkennung. Jetzt kostenlos testen!',
    'seo.features.title': 'Funktionen - Memoro KI-Dokumentations-App',
    'seo.features.description': 'Entdecke alle Funktionen von Memoro: Automatische Transkription in 24 Sprachen, KI-Zusammenfassungen, Aufgabenerkennung und vieles mehr.',
    'seo.guides.title': 'Anleitungen & Tutorials - Memoro App',
    'seo.guides.description': 'Schritt-für-Schritt Anleitungen für Memoro. Lerne wie du Gespräche aufnimmst, transkribierst und mit KI-Unterstützung dokumentierst.',
    'seo.blog.title': 'Blog & News - Memoro Updates',
    'seo.blog.description': 'Aktuelle News, Updates und Tipps rund um Memoro. Erfahre mehr über KI-gestützte Dokumentation und Produktivität.',
    'seo.team.title': 'Das Team hinter Memoro',
    'seo.team.description': 'Lerne das Expertenteam hinter Memoro kennen. Spezialisten für KI, Softwareentwicklung und Datensicherheit aus Deutschland.',
    'seo.download.title': 'Memoro App Download - iOS, Android & Desktop',
    'seo.download.description': 'Lade Memoro für dein Gerät herunter. Verfügbar für iOS, Android, Windows, macOS und Linux. Kostenlos starten!',
    'seo.contracts.title': 'Rechtliches & Datenschutz - Memoro',
    'seo.contracts.description': 'Datenschutzerklärung, AGB und rechtliche Dokumente von Memoro. DSGVO-konform und transparent.',
    'seo.blueprints.title': 'Branchenspezifische Vorlagen - Memoro für jeden Beruf',
    'seo.blueprints.description': 'Memoro Vorlagen für verschiedene Branchen: Handwerk, Pflege, Büro, Marketing und mehr. Optimiert für deine Arbeitsweise.',
    'seo.welcome.title': 'Willkommen bei Memoro - Registrierung erfolgreich',
    'seo.welcome.description': 'Sie haben sich erfolgreich bei Memoro registriert. Kehren Sie jetzt zur App zurück, um sich anzumelden.',
  },
  en: {
    'nav.home': 'Home',
    'nav.features': 'Features',
    'nav.guides': 'Guides',
    'nav.blog': 'Blog',
    'nav.team': 'Team',
    'nav.download': 'Download',
    'nav.contracts': 'Contracts',
    'nav.blueprints': 'Blueprints',
    
    // Features page
    'features.title': 'Our Features',
    'features.description': 'Discover the diverse possibilities and features of our modern platform.',
    
    // Blueprints page
    'blueprints.title': 'Available Blueprints',
    'blueprints.description': 'Discover our different blueprints for various use cases',
    'blueprints.features': 'Features',
    'blueprints.compatibility': 'Compatibility',
    'blueprints.lastUpdated': 'Last updated',
    'blueprints.backToOverview': 'Back to overview',
    'blueprints.readMore': 'Read more',
    
    // Guides page
    'guides.title': 'Guides & Tutorials',
    'guides.description': 'Explore our comprehensive collection of guides and learn how to make the most of the platform.',
    'guides.filter.all': 'All',
    'guides.difficulty.beginner': 'Beginner',
    'guides.difficulty.intermediate': 'Intermediate',
    'guides.difficulty.advanced': 'Advanced',
    
    // Blog page
    'blog.title': 'Our Blog',
    'blog.description': 'Latest news, updates, and insights into our platform.',
    'blog.readMore': 'Read More',
    
    // Team page
    'team.title': 'Our Team',
    'team.description': 'The people behind the platform.',
    'team.backToTeam': '← Back to Team',
    'team.connect': 'Connect',
    
    // Call to action
    'cta.ready': 'Ready to get started?',
    'cta.discover': 'Explore all features and start today.',
    'cta.start': 'Get Started',
    'cta.learnMore': 'Learn More',

    // Guide detail page
    'guides.backToOverview': '← Back to Overview',
    'guides.wasFeedbackHelpful': 'Was this guide helpful?',

    // Contracts page
    'contracts.title': 'Contracts & Legal',
    'contracts.description': 'All legal documents and contracts for our platform',
    'contracts.download': 'Download as PDF',
    'contracts.lastUpdated': 'Last updated',
    'contracts.backToOverview': 'Back to overview',
    
    // Download page
    'download.title': 'Download',
    'download.description': 'Download the Memoro app for your device',
    'download.windows': 'Windows',
    'download.windowsDesc': 'For Windows 10 and newer',
    'download.mac': 'macOS',
    'download.macDesc': 'For macOS 10.15 and newer',
    'download.linux': 'Linux',
    'download.linuxDesc': 'For Ubuntu, Debian and other Linux distributions',
    'download.downloadButton': 'Download',

    // Common
    'common.yes': 'Yes',
    'common.no': 'No',
    
    // Testimonials
    'testimonials.title': 'What Our Users Say',
    'testimonials.subtitle': 'Learn how Memoro helps professionals from various industries work more efficiently',
    'testimonials.role.projectManager': 'Project Manager',
    'testimonials.role.doctor': 'Doctor',
    'testimonials.role.freelancer': 'Freelancer',
    
    // FAQ
    'faq.title': 'Frequently Asked Questions',
    'faq.subtitle': 'Find answers to the most important questions about Memoro',
    'faq.description': 'Find answers to the most frequently asked questions about Memoro',
    
    // Final CTA
    'finalCta.title': 'Ready to Boost Your Productivity?',
    'finalCta.subtitle': 'Choose the option that best suits you',
    'finalCta.trialTitle': 'Try It Yourself',
    'finalCta.trialSubtitle': '14 days free trial',
    'finalCta.trialDescription': 'No credit card required. Full feature set.',
    'finalCta.trialButton': 'Start Free',
    'finalCta.demoTitle': 'Get Convinced First',
    'finalCta.demoSubtitle': '15-minute live demo',
    'finalCta.demoDescription': 'Personal consultation. All questions answered.',
    'finalCta.demoButton': 'Book Demo',
    
    // How It Works
    'howItWorks.title': 'How Memoro Works',
    'howItWorks.subtitle': 'Perfect documentation in three simple steps',
    'howItWorks.tabs.meetings': 'Meetings',
    'howItWorks.tabs.personal': 'Personal',
    'howItWorks.meetings.step1.title': 'Record',
    'howItWorks.meetings.step1.description': 'Start recording in meetings or upload audio files',
    'howItWorks.meetings.step2.title': 'AI Processes',
    'howItWorks.meetings.step2.description': 'Automatic transcription, speaker recognition and intelligent structuring',
    'howItWorks.meetings.step3.title': 'Documentation Ready',
    'howItWorks.meetings.step3.description': 'Get structured protocols with tasks and key points',
    'howItWorks.personal.step1.title': 'Just Speak',
    'howItWorks.personal.step1.description': 'Dictate your thoughts, ideas or notes',
    'howItWorks.personal.step2.title': 'Automatically Organized',
    'howItWorks.personal.step2.description': 'AI recognizes topics and structures your content',
    'howItWorks.personal.step3.title': 'Instantly Searchable',
    'howItWorks.personal.step3.description': 'Find everything again with intelligent search',
    'howItWorks.demo.title': 'Experience Memoro in Action',
    'howItWorks.demo.description': 'Test voice input right here',
    'howItWorks.demo.recording': 'Speak now...',
    'howItWorks.demo.cta': 'Try Free',
    
    // Use Cases
    'useCases.title': 'For Every Use Case',
    'useCases.subtitle': 'Memoro adapts to your needs',
    'useCases.business.title': 'Business & Management',
    'useCases.business.description': 'Perfect for meetings, project management and team communication',
    'useCases.business.benefit1': 'Automatic meeting minutes',
    'useCases.business.benefit2': 'Task detection and assignment',
    'useCases.office.title': 'Office & Administration',
    'useCases.office.description': 'Optimize your office work with AI-powered documentation',
    'useCases.office.benefit1': 'Automatic meeting minutes',
    'useCases.office.benefit2': 'Efficient task management',
    'useCases.legal.title': 'Law & Consulting',
    'useCases.legal.description': 'Document client conversations securely',
    'useCases.legal.benefit1': 'Legally compliant documentation',
    'useCases.legal.benefit2': 'Timestamps and audit trail',
    'useCases.education.title': 'Education & Research',
    'useCases.education.description': 'Capture lectures, interviews and research conversations',
    'useCases.education.benefit1': 'Automatic chapter structure',
    'useCases.education.benefit2': 'Manage quotes and sources',
    'useCases.creative.title': 'Creative & Media',
    'useCases.creative.description': 'Brainstorming, interviews and content creation',
    'useCases.creative.benefit1': 'Capture ideas instantly',
    'useCases.creative.benefit2': 'Content in various formats',
    'useCases.personal.title': 'Personal Use',
    'useCases.personal.description': 'Diary, thoughts and personal notes',
    'useCases.personal.benefit1': 'Private and encrypted',
    'useCases.personal.benefit2': 'Available everywhere',
    'useCases.cta.text': 'Find your perfect use case',
    'useCases.cta.button': 'Watch Demo Now',
    
    // Numbers Section
    'numbers.title': 'Convincing Numbers',
    'numbers.subtitle': 'Trust our proven platform',
    'numbers.users.title': 'Users',
    'numbers.users.description': 'Already trust Memoro',
    'numbers.minutes.title': 'Minutes Transcribed',
    'numbers.minutes.description': 'Over 5,200 hours of conversations',
    'numbers.words.title': 'Million Words',
    'numbers.words.description': 'Successfully processed',
    'numbers.recordings.title': 'Recordings',
    'numbers.recordings.description': 'Conversations and notes documented',
    'numbers.testimonial.quote': 'Since using Memoro, we save at least 10 hours per week on documentation. The automatic task detection has revolutionized our project workflows.',
    'numbers.testimonial.author': 'Anna Schneider',
    'numbers.testimonial.role': 'CEO, TechInnovate Ltd',
    'numbers.cta': 'Calculate Your Time Savings',
    
    // Contact page
    'contact.name': 'Name',
    'contact.email': 'Email',
    'contact.message': 'Message',
    'contact.submit': 'Submit',
    
    // Cookie Consent
    'cookie.title': 'We use cookies',
    'cookie.description': 'We use cookies to improve your experience on our website. By clicking "Accept All", you consent to the use of all cookies.',
    'cookie.privacy_link': 'Privacy Policy',
    'cookie.settings': 'Settings',
    'cookie.settings_aria': 'Open cookie settings',
    'cookie.reject_all': 'Reject All',
    'cookie.reject_all_aria': 'Reject all optional cookies',
    'cookie.accept_all': 'Accept All',
    'cookie.accept_all_aria': 'Accept all cookies',
    'cookie.settings_title': 'Cookie Settings',
    'cookie.close_settings': 'Close settings',
    'cookie.necessary_title': 'Necessary Cookies',
    'cookie.necessary_description': 'These cookies are essential for the website to function properly. They enable basic functions like page navigation and access to secure areas.',
    'cookie.always_active': 'Always Active',
    'cookie.analytics_title': 'Analytics Cookies',
    'cookie.analytics_description': 'We use PostHog for advanced analytics, A/B testing and feature flags. Umami Analytics runs cookieless and requires no consent.',
    'cookie.marketing_title': 'Marketing Cookies',
    'cookie.marketing_description': 'These cookies may be set by our advertising partners to build a profile of your interests and show you relevant ads on other sites.',
    'cookie.functional_title': 'Functional Cookies',
    'cookie.functional_description': 'These cookies enable enhanced functionality and personalization, such as remembering your preferences.',
    'cookie.save_selected': 'Save Selected',
    
    // SEO Meta Descriptions
    'seo.home.title': 'Memoro - AI-Powered Conversation Documentation & Notes App',
    'seo.home.description': 'Memoro revolutionizes conversation documentation with AI. Automatic transcription, intelligent summarization and task detection. Try free now!',
    'seo.features.title': 'Features - Memoro AI Documentation App',
    'seo.features.description': 'Discover all Memoro features: Automatic transcription in 24 languages, AI summaries, task detection and much more.',
    'seo.guides.title': 'Guides & Tutorials - Memoro App',
    'seo.guides.description': 'Step-by-step guides for Memoro. Learn how to record, transcribe and document conversations with AI support.',
    'seo.blog.title': 'Blog & News - Memoro Updates',
    'seo.blog.description': 'Latest news, updates and tips about Memoro. Learn more about AI-powered documentation and productivity.',
    'seo.team.title': 'The Team Behind Memoro',
    'seo.team.description': 'Meet the expert team behind Memoro. Specialists in AI, software development and data security from Germany.',
    'seo.download.title': 'Memoro App Download - iOS, Android & Desktop',
    'seo.download.description': 'Download Memoro for your device. Available for iOS, Android, Windows, macOS and Linux. Start free!',
    'seo.contracts.title': 'Legal & Privacy - Memoro',
    'seo.contracts.description': 'Privacy policy, terms and legal documents of Memoro. GDPR compliant and transparent.',
    'seo.blueprints.title': 'Industry-Specific Blueprints - Memoro for Every Profession',
    'seo.blueprints.description': 'Memoro blueprints for different industries: Crafts, healthcare, office, marketing and more. Optimized for your workflow.',
    'seo.welcome.title': 'Welcome to Memoro - Registration Successful',
    'seo.welcome.description': 'You have successfully registered with Memoro. Return to the app to sign in.',
  },
};
