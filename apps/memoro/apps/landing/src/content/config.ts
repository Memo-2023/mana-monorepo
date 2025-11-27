import { defineCollection, z } from 'astro:content';

const baseSchema = z.object({
	title: z.string(),
	description: z.string(),
	pubDate: z.date(),
	author: z.string().default('Anonymous'),
	image: z.string().optional(),
	tags: z.array(z.string()).default([]),
	lang: z.enum(['de', 'en']),
	slug: z.string().optional(),
	lastUpdated: z.date().optional(),
	draft: z.boolean().optional(),
});

const blogCollection = defineCollection({
	type: 'content',
	schema: baseSchema.extend({
		category: z.enum(['News', 'Tutorial', 'Experiment']),
	}),
});

const teamCollection = defineCollection({
	type: 'content',
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			role: z.string(),
			image: z.string().optional(),
			social: z
				.object({
					linkedin: z.string().optional(),
					github: z.string().optional(),
					twitter: z.string().optional(),
				})
				.optional(),
			lang: z.enum(['de', 'en']),
			category: z.enum(['kernteam', 'freelance', 'mentoren', 'unterstuetzer', 'alumni']),
			order: z.number().optional(),
			categoryOrder: z.number().optional(),
			lastUpdated: z.date().optional(),
		}),
});

const guideCollection = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(),
		description: z.string(),
		difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
		duration: z.string(),
		category: z.string(),
		author: z.string().default('Das Platform-Team'),
		lastUpdated: z.date(),
		lang: z.enum(['de', 'en']),
		order: z.number().optional(),
		featured: z.boolean().optional(),
		tags: z.array(z.string()).optional(),
		videoId: z.string().optional(),
	}),
});

const features = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(),
		description: z.string(),
		lang: z.enum(['de', 'en']),
		icon: z.string(),
		color: z.enum(['blue', 'red', 'purple', 'green', 'orange']),
		category: z
			.enum([
				'organization',
				'language',
				'customization',
				'recording',
				'analytics',
				'collaboration',
				'ai-features',
				'sharing',
			])
			.optional(),
		order: z.number().optional(),
	}),
});

const industryCollection = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(),
		description: z.string(),
		icon: z.string(),
		color: z.enum(['blue', 'red', 'purple', 'green']),
		lang: z.enum(['de', 'en']),
		order: z.number().optional(),
		keyFeatures: z.array(z.string()).optional(),
		statistics: z
			.array(
				z.object({
					value: z.string(),
					label: z.string(),
					icon: z.string().optional(),
				})
			)
			.optional(),
		testimonialIds: z.array(z.string()).optional(),
		faq: z
			.array(
				z.object({
					question: z.string(),
					answer: z.string(),
				})
			)
			.optional(),
		comparison: z
			.object({
				withMemoro: z.array(z.string()),
				withoutMemoro: z.array(z.string()),
			})
			.optional(),
		heroImage: z.string().optional(),
		testimonials: z
			.array(
				z.object({
					quote: z.string(),
					author: z.string(),
					role: z.string(),
					company: z.string(),
				})
			)
			.optional(),
	}),
});

const testimonials = defineCollection({
	type: 'content',
	schema: z.object({
		name: z.string(),
		role: z.string(),
		company: z.string().optional(), // Optional für Privatpersonen
		image: z.string().optional(), // Optional für Platzhalter-Icons
		text: z.string(),
		lang: z.enum(['de', 'en']),
		type: z.enum(['private', 'company', 'network', 'press']), // NEU: Testimonial-Typ
		industry: z.string().optional(), // Branchenzuordnung
		featured: z.boolean().optional(), // Für hervorgehobene Testimonials
		order: z.number().optional(),
		lastUpdated: z.date().optional(),
		// Zusätzliche spezifische Felder:
		source: z.string().optional(), // Für Presse: Name der Publikation
		sourceUrl: z.string().optional(), // Für Presse: Link zum Artikel
	}),
});

const pages = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(),
		description: z.string(),
		lang: z.enum(['de', 'en']),
		type: z.string(),
		lastUpdated: z.date(),
		sections: z.object({
			hero: z.object({
				title: z.string(),
				subtitle: z.string().optional(),
			}),
			plans: z
				.array(
					z.object({
						id: z.string().optional(),
						name: z.string(),
						price: z.object({
							monthly: z.number(),
							yearly: z.number(),
						}),
						priceUnit: z.string().optional(),
						yearlyBreakdown: z.string().optional(),
						features: z.array(z.string()),
						// Legacy fields (optional for backward compatibility)
						minutes: z.number().optional(),
						memoLength: z.number().optional(),
						dailyMemos: z.union([z.number(), z.literal('∞')]).optional(),
						// New Mana-based fields
						initialMana: z.number().optional(),
						dailyMana: z.number().optional(),
						maxMana: z.number().optional(),
						canGiftMana: z.boolean().optional(),
						cta: z.string(),
						highlight: z.boolean(),
					})
				)
				.optional(),
			manaPotions: z
				.object({
					title: z.string(),
					subtitle: z.string(),
					items: z.array(
						z.object({
							id: z.string(),
							name: z.string(),
							manaAmount: z.number(),
							price: z.number(),
							popular: z.boolean(),
						})
					),
				})
				.optional(),
			comparison: z
				.object({
					title: z.string(),
				})
				.optional(),
			faq: z
				.object({
					title: z.string(),
					items: z.array(
						z.object({
							question: z.string(),
							answer: z.string(),
						})
					),
				})
				.optional(),
			callToAction: z
				.object({
					title: z.string(),
					description: z.string(),
					buttonText: z.string(),
					buttonLink: z.string(),
				})
				.optional(),
		}),
	}),
});

const blueprintsCollection = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(),
		description: z.string(),
		icon: z.string(),
		color: z.enum(['blue', 'red', 'purple', 'green', 'orange', 'yellow']),
		industry: z.enum(['office', 'construction', 'education', 'business']).optional(),
		lang: z.enum(['de', 'en']),
		order: z.number().optional(),
		lastUpdated: z.date().optional(),
		isActive: z.boolean().default(true),
		features: z.array(z.string()).optional(),
		compatibility: z.array(z.string()).optional(),
	}),
});

const memoriesCollection = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(),
		description: z.string(),
		icon: z.string(),
		color: z.enum(['blue', 'red', 'purple', 'green', 'orange', 'yellow']),
		category: z.string().optional(),
		lang: z.enum(['de', 'en']),
		order: z.number().optional(),
		lastUpdated: z.date().optional(),
		isActive: z.boolean().default(true),
		features: z.array(z.string()).optional(),
		compatibility: z.array(z.string()).optional(),
	}),
});

const wallpaperCollection = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(),
		description: z.string(),
		thumbnail: z.string(),

		// Verfügbare Formate als strukturiertes Array
		formats: z.array(
			z.object({
				type: z.enum(['desktop', 'mobile', 'tablet', 'ultrawide']),
				device: z.string().optional(), // z.B. "iPhone 16 Pro", "iPad Pro"
				resolution: z.string(), // "3840x2160"
				aspectRatio: z.string(), // "16:9"
				fileUrl: z.string(), // "/images/wallpaper/..."
				fileSize: z.string().optional(), // "2.4 MB"
			})
		),

		category: z.enum(['nature', 'abstract', 'city', 'technology', 'other']),
		colors: z.array(z.string()).optional(),
		tags: z.array(z.string()).optional(),
		lang: z.enum(['de', 'en']),
		order: z.number().optional(),
		lastUpdated: z.date().optional(),
		isActive: z.boolean().default(true),
		isFeatured: z.boolean().default(false),

		// Download-Statistiken
		downloadCount: z.number().default(0),
		formatDownloads: z.record(z.string(), z.number()).optional(), // Pro Format
	}),
});

// FAQ collection
const faqsCollection = defineCollection({
	type: 'content',
	schema: z.object({
		question: z.string(),
		answer: z.string(),
		category: z.enum([
			'general', // Allgemeine Fragen
			'features', // Funktionen
			'technical', // Technische Fragen
			'pricing', // Preise & Pläne
			'security', // Sicherheit & Datenschutz
			'business', // Business & Enterprise
			'industries', // Branchenspezifische Fragen
			'guides', // Anleitungen & Tutorials
		]),
		tags: z.array(z.string()).optional(),
		order: z.number().default(0),
		featured: z.boolean().default(false),
		relatedLinks: z
			.array(
				z.object({
					title: z.string(),
					url: z.string(),
				})
			)
			.optional(),
		lang: z.enum(['de', 'en']),
	}),
});

// Content Calendar collection für Monatsplanung
const calendarCollection = defineCollection({
	type: 'content',
	schema: z.object({
		// Monatsinformationen
		month: z.number().min(1).max(12), // 1-12
		year: z.number().min(2024).max(2030),

		// Events im Monat
		events: z.array(
			z.object({
				id: z.string(),
				title: z.string(),
				description: z.string().optional(),
				date: z.date(), // Genaues Datum
				contentType: z.enum([
					'blog',
					'changelog',
					'statistics',
					'feature',
					'guide',
					'testimonial',
					'faq',
					'social',
					'newsletter',
					'event',
				]),
				contentCollection: z.string().optional(), // z.B. "blog", "changelog"
				status: z
					.enum(['idea', 'planned', 'writing', 'review', 'scheduled', 'published', 'cancelled'])
					.default('planned'),
				author: z.string().optional(),
				assignee: z.string().optional(),
				priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
				lang: z.enum(['de', 'en', 'both']).default('both'),
				tags: z.array(z.string()).optional(),
				notes: z.string().optional(),
				color: z.string().optional(), // Hex-Farbe für Kalender-Darstellung
				linkedContentId: z.string().optional(),
				estimatedTime: z.string().optional(),
			})
		),

		// Monatsziele
		goals: z.array(z.string()).optional(),
		notes: z.string().optional(),
	}),
});

// Statistics collection für Wochen- und Monatsberichte
const statisticsCollection = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(),
		description: z.string(),
		reportType: z.enum(['weekly', 'monthly']).default('weekly'),
		weekNumber: z.number().optional(), // Kalenderwoche (nur für Wochenberichte)
		month: z.number().optional(), // Monat (nur für Monatsberichte)
		year: z.number(), // Jahr
		period: z.object({
			start: z.date(),
			end: z.date(),
		}),
		stats: z.object({
			totalUsers: z.number(),
			newUsers: z.number(),
			activeUsers: z.number(),
			totalRecordings: z.number(),
			totalMinutes: z.number(),
			totalWords: z.number().optional(), // Gesamtanzahl transkribierter Wörter
			totalEntries: z.number().optional(), // Gesamtanzahl Memo-Einträge
			manaConsumed: z.number(),
			manaPurchased: z.number(),
		}),
		highlights: z.array(z.string()).optional(), // Wichtige Ereignisse der Woche
		trends: z
			.object({
				userGrowth: z.number(), // Prozent im Vergleich zur Vorwoche
				recordingGrowth: z.number(),
				manaGrowth: z.number(),
			})
			.optional(),
		topFeatures: z
			.array(
				z.object({
					name: z.string(),
					usage: z.number(),
				})
			)
			.optional(),
		lang: z.enum(['de', 'en']),
		publishDate: z.date(),
		draft: z.boolean().default(false),
		author: z.string().default('Das Memoro Team'),
	}),
});

// Changelog collection für Produkt-Updates und Release Notes
const changelogCollection = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(),
		description: z.string(),
		version: z.string(), // z.B. "1.2.0"
		releaseDate: z.date(),
		type: z.enum(['major', 'minor', 'patch']), // Semantic versioning
		category: z
			.enum([
				'feature', // Neue Features
				'improvement', // Verbesserungen
				'bugfix', // Fehlerbehebungen
				'security', // Sicherheitsupdates
				'performance', // Performance-Verbesserungen
				'other', // Sonstiges
			])
			.array(), // Mehrere Kategorien möglich
		highlights: z.array(z.string()).optional(), // Hauptmerkmale dieser Version
		breaking: z.boolean().default(false), // Breaking changes
		deprecated: z.array(z.string()).optional(), // Veraltete Features
		migration: z.string().optional(), // Migrations-Anleitung bei breaking changes
		platforms: z.array(z.enum(['web', 'ios', 'android', 'api'])).optional(),
		lang: z.enum(['de', 'en']),
		draft: z.boolean().default(false),
		author: z.string().default('Das Memoro Team'),
	}),
});

// Authors collection für Autoren-Profile und Beiträger
const authorsCollection = defineCollection({
	type: 'content',
	schema: z.object({
		// Basis-Informationen
		name: z.string(),
		displayName: z.string(), // Anzeigename (kann vom echten Namen abweichen)
		bio: z.string(),
		role: z.string(), // z.B. "Content Creator", "Technical Writer", "Guest Author"

		// Profilbild und Avatar
		avatar: z.string().optional(), // Pfad zum Profilbild

		// Social Media & Kontakt
		social: z
			.object({
				email: z.string().email().optional(),
				website: z.string().url().optional(),
				linkedin: z.string().optional(),
				twitter: z.string().optional(),
				github: z.string().optional(),
				instagram: z.string().optional(),
			})
			.optional(),

		// Autor-Statistiken
		stats: z
			.object({
				totalPosts: z.number().default(0),
				totalViews: z.number().default(0),
				totalLikes: z.number().default(0),
				joinedDate: z.date(),
			})
			.optional(),

		// Expertise & Themenbereiche
		expertise: z.array(z.string()).optional(), // z.B. ["AI", "Productivity", "Business"]
		topics: z.array(z.string()).optional(), // Spezifische Themen

		// Schreibstil & Voice
		writingPrompt: z.string().optional(), // Prompt für KI: Stil, Tonalität, Besonderheiten

		// Status und Sichtbarkeit
		isActive: z.boolean().default(true),
		isFeatured: z.boolean().default(false), // Hervorgehobene Autoren
		showInDirectory: z.boolean().default(true), // Im Autorenverzeichnis anzeigen

		// Berechtigungen
		permissions: z
			.object({
				canPublish: z.boolean().default(false),
				canEditOthers: z.boolean().default(false),
				isAdmin: z.boolean().default(false),
			})
			.optional(),

		// Sprache und Lokalisierung
		lang: z.enum(['de', 'en']), // Wird durch Ordnerstruktur bestimmt
		preferredLanguages: z.array(z.enum(['de', 'en'])).optional(),

		// Metadaten
		slug: z.string().optional(), // URL-Slug für Autorenprofil
		lastActive: z.date().optional(),
		createdAt: z.date().default(() => new Date()),
		updatedAt: z.date().optional(),
	}),
});

// Data Protection collection für Datenschutz-Dokumente
const dataprotectionCollection = defineCollection({
	type: 'content',
	schema: z.object({
		// Basis-Informationen
		title: z.string(),
		description: z.string(),

		// Kategorisierung
		category: z.enum([
			'privacy-center', // Übersichtsseite/Hub
			'website-privacy', // Website-Datenschutzerklärung
			'app-privacy', // App-Datenschutzerklärung
			'cookie-policy', // Cookie-Richtlinie
			'dpa', // Auftragsverarbeitungsvertrag
			'data-request', // Datenauskunft-Prozesse
			'third-party', // Drittanbieter-Informationen
			'retention', // Datenaufbewahrungsrichtlinien
			'rights', // Betroffenenrechte
			'security', // Sicherheitsmaßnahmen
		]),

		// Versionierung
		version: z.string(), // z.B. "1.0.0", "2.1.3"
		validFrom: z.date(), // Ab wann gültig
		validUntil: z.date().optional(), // Bis wann gültig (für alte Versionen)

		// Rechtliche Informationen
		scope: z.enum(['website', 'app', 'both', 'service']).default('both'),
		legalBasis: z.array(z.string()).optional(), // z.B. ["DSGVO", "BDSG", "TTDSG"]
		dataController: z
			.object({
				name: z.string(),
				address: z.string(),
				email: z.string(),
				phone: z.string().optional(),
			})
			.optional(),

		// Dokumenten-Eigenschaften
		isActive: z.boolean().default(true), // Ist dies die aktuelle Version?
		isDraft: z.boolean().default(false),
		requiresConsent: z.boolean().default(false),

		// Navigation & Anzeige
		order: z.number().optional(), // Reihenfolge in Listen
		icon: z.string().optional(), // Icon für Navigation
		showInFooter: z.boolean().default(false), // Im Footer anzeigen?
		showInPrivacyCenter: z.boolean().default(true), // Im Privacy Center anzeigen?

		// Verknüpfungen
		relatedDocuments: z.array(z.string()).optional(), // IDs verwandter Dokumente
		previousVersion: z.string().optional(), // ID der vorherigen Version

		// Changelog
		changelog: z
			.array(
				z.object({
					version: z.string(),
					date: z.date(),
					changes: z.array(z.string()),
				})
			)
			.optional(),

		// SEO & Meta
		slug: z.string().optional(), // URL-Slug
		keywords: z.array(z.string()).optional(),

		// Sprache
		lang: z.enum(['de', 'en']),

		// Zeitstempel
		createdAt: z.date().default(() => new Date()),
		lastUpdated: z.date(),
		publishedAt: z.date().optional(),

		// Zusätzliche Metadaten
		author: z.string().default('Memoro Rechtsabteilung'),
		reviewer: z.string().optional(), // Wer hat geprüft?
		approvedBy: z.string().optional(), // Wer hat freigegeben?
	}),
});

// ========== INTERNE/PRIVATE COLLECTIONS (mit _ Prefix) ==========

// Personas Collection für Marketing und Produktentwicklung (INTERN)
const _personasCollection = defineCollection({
	type: 'content',
	schema: z.object({
		// Basis-Informationen
		name: z.string(), // z.B. "Sabine Schmidt"
		title: z.string(), // z.B. "Die gestresste Projektmanagerin"
		avatar: z.string().optional(), // Pfad zum Profilbild/Avatar

		// Appearance - Detaillierte Beschreibung des Erscheinungsbilds
		appearance: z
			.object({
				prompt: z.string(), // Grundlegende Beschreibung der Person
				description: z.string(), // Kurze prägnante Beschreibung
				height: z.string().optional(), // z.B. "1,75m" oder "mittelgroß"
				build: z.string().optional(), // z.B. "athletisch", "kräftig", "schlank"
				hairColor: z.string().optional(), // z.B. "dunkelbraun mit grauen Strähnen"
				hairStyle: z.string().optional(), // z.B. "kurz und praktisch"
				eyeColor: z.string().optional(), // z.B. "braun"
				facialFeatures: z.string().optional(), // Besondere Merkmale
				clothingStyle: z.string(), // z.B. "Arbeitskleidung", "Business Casual"
				typicalOutfit: z.string(), // Detaillierte Outfit-Beschreibung
				accessories: z.array(z.string()).optional(), // z.B. ["Smartwatch", "Ehering"]
				bodyLanguage: z.string().optional(), // z.B. "selbstbewusst, energetisch"
				firstImpression: z.string(), // Erster Eindruck bei Begegnung
			})
			.optional(),

		// Outfits - Verschiedene Kleidungskombinationen für unterschiedliche Anlässe
		outfits: z
			.array(
				z.object({
					name: z.string(), // z.B. "Baustellen-Outfit"
					occasion: z.string(), // z.B. "Arbeit auf der Baustelle"
					season: z.enum(['Frühling', 'Sommer', 'Herbst', 'Winter', 'Ganzjährig']).optional(),
					description: z.string(), // Detaillierte Beschreibung
					items: z.object({
						head: z.string().optional(), // Kopfbedeckung
						top: z.string(), // Oberteil
						bottom: z.string(), // Unterteil
						shoes: z.string(), // Schuhe
						outerwear: z.string().optional(), // Jacke/Mantel
						accessories: z.array(z.string()).optional(), // Zusätzliche Accessoires
					}),
					colors: z.array(z.string()), // Dominante Farben
					style: z.string(), // Stilrichtung z.B. "praktisch", "professionell"
					impression: z.string(), // Welchen Eindruck vermittelt das Outfit
				})
			)
			.optional(),

		// Demografische Daten
		demographics: z.object({
			age: z.number().or(z.string()), // z.B. 35 oder "30-40"
			gender: z.enum(['male', 'female', 'diverse', 'unspecified']).optional(),
			location: z.string(), // z.B. "München, Deutschland"
			education: z.string(), // z.B. "Master in Wirtschaftswissenschaften"
			income: z.string().optional(), // z.B. "60.000-80.000€/Jahr"
			familyStatus: z.string().optional(), // z.B. "Verheiratet, 2 Kinder"
		}),

		// Berufliches Profil
		professional: z.object({
			jobTitle: z.string(), // z.B. "Senior Project Manager"
			company: z.string().optional(), // z.B. "Mittelständisches IT-Unternehmen"
			companySize: z.string().optional(), // z.B. "50-200 Mitarbeiter"
			industry: z.string(), // z.B. "IT & Software"
			experience: z.string(), // z.B. "10+ Jahre"
			responsibilities: z.array(z.string()), // Liste der Hauptaufgaben
			teamSize: z.string().optional(), // z.B. "Führt 5-10 Personen"
		}),

		// Psychografische Merkmale
		psychographics: z.object({
			personality: z.array(z.string()), // z.B. ["organisiert", "detailorientiert", "teamfähig"]
			values: z.array(z.string()), // z.B. ["Effizienz", "Work-Life-Balance", "Professionalität"]
			motivations: z.array(z.string()), // Was treibt die Person an?
			frustrations: z.array(z.string()), // Pain Points
			goals: z.array(z.string()), // Persönliche und berufliche Ziele
		}),

		// Verhalten & Gewohnheiten
		behavior: z.object({
			techSavviness: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
			workStyle: z.array(z.string()), // z.B. ["remote", "hybrid", "viele Meetings"]
			tools: z.array(z.string()), // Welche Tools nutzt die Person bereits?
			communicationPreference: z.array(z.string()), // z.B. ["Email", "Slack", "Face-to-Face"]
			buyingBehavior: z.string().optional(), // Wie trifft die Person Kaufentscheidungen?
			informationSources: z.array(z.string()), // Wo informiert sich die Person?
		}),

		// Memoro-spezifische Aspekte
		memoroContext: z.object({
			useCase: z.array(z.string()), // Wie würde Memoro genutzt werden?
			benefits: z.array(z.string()), // Welche Vorteile sind besonders relevant?
			concerns: z.array(z.string()), // Mögliche Bedenken oder Hindernisse
			features: z.array(z.string()), // Welche Features sind am wichtigsten?
			priceSensitivity: z.enum(['low', 'medium', 'high']),
			adoptionLikelihood: z.enum(['low', 'medium', 'high', 'very-high']),
			influencers: z.array(z.string()).optional(), // Wer beeinflusst die Entscheidung?
		}),

		// User Story & Szenarien
		userStory: z.string(), // Narrative Beschreibung eines typischen Tages/Problems
		scenarios: z
			.array(
				z.object({
					title: z.string(),
					description: z.string(),
					outcome: z.string().optional(),
				})
			)
			.optional(),

		// Zitate & Aussagen
		quotes: z.array(z.string()).optional(), // Typische Aussagen dieser Persona

		// Marketing-Relevanz
		marketing: z.object({
			segment: z.enum(['primary', 'secondary', 'tertiary']), // Zielgruppensegment
			channels: z.array(z.string()), // Beste Marketing-Kanäle
			messaging: z.array(z.string()), // Kern-Botschaften für diese Persona
			contentPreferences: z.array(z.string()), // z.B. ["Fallstudien", "Video-Tutorials"]
		}),

		// Meta-Informationen
		status: z.enum(['draft', 'active', 'archived']).default('draft'),
		visibility: z.enum(['internal', 'team', 'stakeholders']).default('internal'),
		tags: z.array(z.string()).optional(),
		relatedPersonas: z.array(z.string()).optional(), // IDs verwandter Personas

		// Zeitstempel
		createdAt: z.date().default(() => new Date()),
		lastUpdated: z.date(),
		validatedAt: z.date().optional(), // Wann wurde die Persona zuletzt validiert?

		// Verantwortlichkeiten
		owner: z.string().default('Marketing Team'),
		contributors: z.array(z.string()).optional(),

		// Sprache (für internationale Personas)
		lang: z.enum(['de', 'en']),
	}),
});

// Stories Collection für Persona-Szenarien und Storyboards (INTERN)
const _storiesCollection = defineCollection({
	type: 'content',
	schema: z.object({
		// Basis-Informationen
		title: z.string(), // Titel der Story
		description: z.string(), // Kurzbeschreibung
		persona: z.string(), // ID/Slug der zugehörigen Persona

		// Story-Typ und Kategorie
		storyType: z.enum([
			'problem-solution', // Problem-Lösung mit Memoro
			'day-in-life', // Ein Tag im Leben der Persona
			'transformation', // Vorher-Nachher Story
			'tutorial', // Anleitungs-Story
			'testimonial', // Testimonial-artige Story
		]),

		// Visual Style Guidelines
		visualStyle: z.object({
			characterDescription: z.string(), // Konsistente Charakterbeschreibung für Bilder
			setting: z.string(), // Umgebung/Setting der Story
			colorPalette: z.array(z.string()).optional(), // Farben für konsistentes Aussehen
			mood: z.string(), // Stimmung/Atmosphäre
			lightingStyle: z.string().optional(), // z.B. "natural daylight", "warm indoor"
			cameraAngle: z.string().optional(), // Standard-Kameraperspektive
			artStyle: z.string().default('photorealistic'), // Kunststil
		}),

		// Story-Szenen
		scenes: z.array(
			z.object({
				sceneNumber: z.number(),
				title: z.string(), // Szenen-Titel

				// Visual Content
				imagePrompt: z.string(), // Englischer Prompt für Bildgenerierung
				imageSettings: z
					.object({
						aspectRatio: z.string().default('16:9'),
						style: z.string().optional(),
						camera: z.string().optional(), // z.B. "medium shot", "close-up"
						lighting: z.string().optional(),
					})
					.optional(),

				// Audio Content
				voiceOver: z.string(), // Deutscher Sprechertext
				voiceSettings: z
					.object({
						speaker: z.enum(['male', 'female', 'narrator']).default('narrator'),
						tone: z.string().optional(), // z.B. "freundlich", "professionell"
						pace: z.enum(['slow', 'normal', 'fast']).default('normal'),
					})
					.optional(),

				// Animation/Video
				videoPrompt: z.string(), // Englischer Prompt für Video/Animation
				videoDuration: z.number().default(5), // Dauer in Sekunden
				videoTransitions: z
					.object({
						in: z.string().optional(), // z.B. "fade", "cut", "slide"
						out: z.string().optional(),
					})
					.optional(),

				// Zusätzliche Elemente
				soundEffects: z.array(z.string()).optional(), // z.B. ["hammer sounds", "phone ringing"]
				backgroundMusic: z.string().optional(), // Stimmung der Hintergrundmusik
				textOverlay: z.string().optional(), // Text-Einblendungen

				// Memoro-Kontext
				memoroFeature: z.string().optional(), // Welches Feature wird gezeigt?
				memoroAction: z.string().optional(), // Was passiert in Memoro?
			})
		),

		// Story-Metriken und Ziele
		objectives: z.array(z.string()), // Was soll die Story vermitteln?
		keyTakeaways: z.array(z.string()), // Hauptaussagen
		targetAudience: z.array(z.string()).optional(), // Spezifische Zielgruppen

		// Produktion und Verwendung
		production: z
			.object({
				format: z.array(z.enum(['image', 'video', 'animation', 'slideshow'])),
				duration: z.string().optional(), // Gesamtdauer bei Videos
				budget: z.enum(['low', 'medium', 'high']).optional(),
				priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
			})
			.optional(),

		// Verwendungszwecke
		usage: z
			.object({
				channels: z.array(z.string()), // z.B. ["Website", "Social Media", "Sales"]
				campaigns: z.array(z.string()).optional(), // Zugehörige Kampagnen
				presentations: z.array(z.string()).optional(), // Präsentationen
			})
			.optional(),

		// Varianten und Versionen
		variants: z
			.array(
				z.object({
					name: z.string(), // z.B. "Kurze Social Media Version"
					description: z.string(),
					scenes: z.array(z.number()), // Welche Szenen-Nummern?
					modifications: z.string().optional(), // Was wurde geändert?
				})
			)
			.optional(),

		// Meta-Informationen
		status: z
			.enum(['concept', 'draft', 'review', 'approved', 'produced', 'archived'])
			.default('draft'),
		visibility: z.enum(['internal', 'team', 'stakeholders']).default('internal'),
		tags: z.array(z.string()).optional(),

		// Zeitstempel
		createdAt: z.date().default(() => new Date()),
		lastUpdated: z.date(),
		approvedAt: z.date().optional(),
		producedAt: z.date().optional(),

		// Verantwortlichkeiten
		owner: z.string().default('Marketing Team'),
		author: z.string(),
		reviewers: z.array(z.string()).optional(),
		approvedBy: z.string().optional(),

		// Sprache
		lang: z.enum(['de', 'en']),

		// Notizen
		notes: z.string().optional(), // Interne Notizen
		feedback: z
			.array(
				z.object({
					author: z.string(),
					date: z.date(),
					comment: z.string(),
				})
			)
			.optional(),
	}),
});

export const collections = {
	// Öffentliche Collections
	blog: blogCollection,
	team: teamCollection,
	guides: guideCollection,
	features: features,
	pages: pages,
	industries: industryCollection,
	testimonials: testimonials,
	blueprints: blueprintsCollection,
	memories: memoriesCollection,
	wallpapers: wallpaperCollection,
	faqs: faqsCollection,
	statistics: statisticsCollection,
	changelog: changelogCollection,
	calendar: calendarCollection,
	authors: authorsCollection,
	dataprotection: dataprotectionCollection,

	// Private/Interne Collections (mit _ Prefix)
	_personas: _personasCollection,
	_stories: _storiesCollection,
};
