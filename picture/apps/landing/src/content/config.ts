import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(),
		description: z.string(),
		author: z.string().default('Picture Team'),
		publishedAt: z.date(),
		updatedAt: z.date().optional(),
		coverImage: z.string(),
		category: z.enum(['tutorial', 'tips', 'updates', 'use-case', 'news']),
		tags: z.array(z.string()),
		language: z.enum(['en', 'de', 'fr', 'it', 'es']),
		draft: z.boolean().default(false),
	}),
});

const featuresCollection = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(),
		description: z.string(),
		icon: z.string(), // emoji or icon name
		coverImage: z.string().optional(),
		category: z.enum([
			'generation', // AI Image Generation features
			'editing', // Image editing tools
			'organization', // Gallery, tags, organization
			'collaboration', // Sharing, teams
			'api', // API & Integrations
			'models', // AI Models
			'platform', // Cross-platform, mobile, web
			'customization', // Themes, settings
			'security', // Privacy, ownership
		]),
		featured: z.boolean().default(false),
		order: z.number().default(0), // Display order
		available: z.boolean().default(true), // Is feature live?
		comingSoon: z.boolean().default(false),
		language: z.enum(['en', 'de', 'fr', 'it', 'es']),
		benefits: z.array(z.string()), // Key benefits
		useCases: z.array(z.string()).optional(), // Example use cases
	}),
});

const testimonialsCollection = defineCollection({
	type: 'content',
	schema: z.object({
		name: z.string(), // Full name of person
		role: z.string(), // Job title / role
		company: z.string().optional(), // Company name
		avatar: z.string().optional(), // Avatar image URL
		rating: z.number().min(1).max(5), // 1-5 star rating
		featured: z.boolean().default(false), // Show on homepage
		category: z.enum([
			'content-creator', // Social media, influencers
			'designer', // Graphic designers, artists
			'marketer', // Marketing professionals
			'photographer', // Professional photographers
			'business', // Business owners, entrepreneurs
			'developer', // Developers using API
			'general', // General users
		]),
		useCase: z.string().optional(), // What they use Picture for
		language: z.enum(['en', 'de', 'fr', 'it', 'es']),
		date: z.date(), // When testimonial was given
		verified: z.boolean().default(false), // Verified customer
	}),
});

const faqCollection = defineCollection({
	type: 'content',
	schema: z.object({
		question: z.string(), // The FAQ question
		category: z.enum([
			'general', // General questions about Picture
			'pricing', // Pricing and billing
			'features', // Feature-specific questions
			'technical', // Technical issues
			'legal', // Legal, privacy, terms
			'account', // Account management
			'generation', // Image generation questions
			'models', // AI model questions
		]),
		featured: z.boolean().default(false), // Show on homepage
		order: z.number().default(0), // Display order within category
		language: z.enum(['en', 'de', 'fr', 'it', 'es']),
		relatedFaqs: z.array(z.string()).default([]), // Slugs of related FAQs
		relatedFeatures: z.array(z.string()).default([]), // Slugs of related features
		relatedTutorials: z.array(z.string()).default([]), // Slugs of related tutorials
		seoKeywords: z.array(z.string()).default([]), // Target keywords
		lastUpdated: z.date(), // When FAQ was last updated
	}),
});

const useCasesCollection = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(), // Use case title
		description: z.string(), // Short description
		icon: z.string(), // Emoji or icon
		coverImage: z.string().optional(), // Hero image for use case
		category: z.enum([
			'social-media', // Instagram, TikTok, Twitter, etc.
			'marketing', // Marketing campaigns, ads, content
			'design', // Graphic design, UI/UX
			'ecommerce', // Product photos, listings
			'education', // Educational content, courses
			'entertainment', // Gaming, streaming, content creation
			'business', // Corporate, presentations, branding
			'personal', // Personal projects, gifts, art
		]),
		industry: z.string().optional(), // Specific industry (e.g., "Real Estate", "Fashion")
		difficulty: z.enum(['beginner', 'intermediate', 'advanced']), // Skill level
		featured: z.boolean().default(false), // Show on homepage
		popular: z.boolean().default(false), // Mark as popular use case
		language: z.enum(['en', 'de', 'fr', 'it', 'es']),

		// The problem this use case solves
		problem: z.string(),
		// How Picture solves it
		solution: z.string(),

		// Related content
		relatedFeatures: z.array(z.string()).default([]), // Feature slugs
		relatedUseCases: z.array(z.string()).default([]), // Other use case slugs
		relatedTutorials: z.array(z.string()).default([]), // Tutorial slugs (when we add them)

		// SEO
		seoKeywords: z.array(z.string()).default([]), // Target keywords

		// Metadata
		estimatedTime: z.string().optional(), // e.g., "5 minutes", "1 hour"
		requiredModels: z.array(z.string()).default([]), // Which AI models work best

		// Examples
		examplePrompts: z.array(z.string()).default([]), // Example prompts for this use case
		tips: z.array(z.string()).default([]), // Pro tips

		publishDate: z.date(),
		lastUpdated: z.date(),
	}),
});

const comparisonsCollection = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(), // e.g., "Picture vs Midjourney: Which AI Image Generator is Better?"
		description: z.string(), // SEO meta description
		icon: z.string(), // Emoji for the comparison
		coverImage: z.string().optional(), // Hero image

		// The competitors being compared
		competitor: z.string(), // e.g., "Midjourney", "DALL-E 3"
		competitorLogo: z.string().optional(), // Logo URL

		// Type of comparison
		type: z.enum([
			'versus', // Picture vs X
			'roundup', // Best AI Image Generators 2025
			'alternative', // X Alternative
		]),

		featured: z.boolean().default(false), // Show on homepage
		trending: z.boolean().default(false), // Mark as trending
		language: z.enum(['en', 'de', 'fr', 'it', 'es']),

		// Quick verdict
		verdict: z.string(), // 1-2 sentence summary
		winnerBadge: z.enum(['picture', 'competitor', 'tie']).optional(),

		// Comparison table data
		comparisonTable: z.object({
			pricing: z.object({
				picture: z.string(),
				competitor: z.string(),
				winner: z.enum(['picture', 'competitor', 'tie']),
			}),
			imageQuality: z.object({
				picture: z.string(),
				competitor: z.string(),
				winner: z.enum(['picture', 'competitor', 'tie']),
			}),
			speed: z.object({
				picture: z.string(),
				competitor: z.string(),
				winner: z.enum(['picture', 'competitor', 'tie']),
			}),
			easeOfUse: z.object({
				picture: z.string(),
				competitor: z.string(),
				winner: z.enum(['picture', 'competitor', 'tie']),
			}),
			features: z.object({
				picture: z.string(),
				competitor: z.string(),
				winner: z.enum(['picture', 'competitor', 'tie']),
			}),
		}),

		// Pros and Cons
		picturePros: z.array(z.string()),
		pictureCons: z.array(z.string()),
		competitorPros: z.array(z.string()),
		competitorCons: z.array(z.string()),

		// Use case recommendations
		bestFor: z.object({
			picture: z.array(z.string()), // When to choose Picture
			competitor: z.array(z.string()), // When to choose competitor
		}),

		// Related content
		relatedComparisons: z.array(z.string()).default([]),
		relatedFeatures: z.array(z.string()).default([]),
		relatedUseCases: z.array(z.string()).default([]),

		// SEO
		seoKeywords: z.array(z.string()).default([]), // e.g., "picture vs midjourney", "best ai image generator"
		targetSearchIntent: z.enum(['comparison', 'alternative', 'best-of']),

		// Metadata
		lastUpdated: z.date(), // Important for "2025" type queries
		publishDate: z.date(),

		// Stats (optional)
		competitorPricing: z.string().optional(), // e.g., "$30/month"
		competitorWebsite: z.string().optional(), // Link to competitor
	}),
});

const tutorialsCollection = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(), // Tutorial title
		description: z.string(), // Short description for SEO
		icon: z.string(), // Emoji or icon
		coverImage: z.string().optional(), // Hero image

		// Classification
		category: z.enum([
			'getting-started', // First steps with Picture
			'generation', // Image generation techniques
			'editing', // Editing workflows
			'advanced', // Advanced features
			'workflows', // Complete workflows
			'tips-tricks', // Pro tips
			'api', // API tutorials
		]),
		difficulty: z.enum(['beginner', 'intermediate', 'advanced']),

		// Visibility
		featured: z.boolean().default(false), // Show on homepage
		popular: z.boolean().default(false), // Mark as popular
		language: z.enum(['en', 'de', 'fr', 'it', 'es']),

		// Tutorial steps (structured in frontmatter for quick overview)
		steps: z.array(
			z.object({
				title: z.string(), // Step title
				duration: z.string().optional(), // e.g., "2 minutes"
			})
		),

		// Requirements
		prerequisites: z.array(z.string()).default([]), // What user should know
		requiredFeatures: z.array(z.string()).default([]), // Feature slugs needed
		requiredModels: z.array(z.string()).default([]), // AI models needed

		// Media
		videoUrl: z.string().optional(), // YouTube, Vimeo, etc.
		videoDuration: z.string().optional(), // e.g., "15:30"
		hasVideo: z.boolean().default(false),

		// Metadata
		estimatedTime: z.string(), // e.g., "10 minutes", "30 minutes"
		lastTested: z.date().optional(), // When tutorial was last verified
		version: z.string().optional(), // Picture version this was created for

		// Content enhancements
		examplePrompts: z.array(z.string()).default([]), // Sample prompts
		tips: z.array(z.string()).default([]), // Pro tips
		commonMistakes: z.array(z.string()).default([]), // What to avoid
		troubleshooting: z.array(
			z.object({
				problem: z.string(),
				solution: z.string(),
			})
		).default([]),

		// Outcomes
		whatYouWillLearn: z.array(z.string()), // Learning objectives
		finalResult: z.string().optional(), // What user will achieve

		// Related content
		relatedTutorials: z.array(z.string()).default([]),
		relatedFeatures: z.array(z.string()).default([]),
		relatedUseCases: z.array(z.string()).default([]),

		// SEO
		seoKeywords: z.array(z.string()).default([]),
		targetAudience: z.string().optional(), // e.g., "Social media managers", "Designers"

		// Dates
		publishDate: z.date(),
		lastUpdated: z.date(),

		// Engagement
		downloadableResources: z.array(
			z.object({
				title: z.string(),
				url: z.string(),
				type: z.enum(['template', 'preset', 'example', 'cheatsheet']),
			})
		).default([]),
	}),
});

const changelogCollection = defineCollection({
	type: 'content',
	schema: z.object({
		version: z.string(), // e.g., "1.2.0", "2.0.0-beta"
		title: z.string(), // Release title, e.g., "Mobile App Launch"
		releaseDate: z.date(), // When this version was released

		// Release type
		type: z.enum([
			'major', // Breaking changes, major new features
			'minor', // New features, improvements
			'patch', // Bug fixes, small improvements
			'beta', // Beta release
			'alpha', // Alpha release
		]),

		// Visibility
		featured: z.boolean().default(false), // Highlight on homepage
		highlighted: z.boolean().default(false), // Special highlight in changelog
		draft: z.boolean().default(false), // Draft release (not yet published)

		// Summary
		summary: z.string(), // Short description of the release (1-2 sentences)
		coverImage: z.string().optional(), // Optional hero image for major releases

		// Changes (categorized)
		changes: z.object({
			features: z.array(
				z.object({
					title: z.string(),
					description: z.string(),
					category: z.enum([
						'generation',
						'editing',
						'organization',
						'api',
						'mobile',
						'web',
						'performance',
						'ui',
						'other',
					]).optional(),
					image: z.string().optional(), // Screenshot or demo image
					videoUrl: z.string().optional(), // Demo video
					link: z.string().optional(), // Link to feature page or docs
				})
			).default([]),

			improvements: z.array(
				z.object({
					title: z.string(),
					description: z.string(),
					category: z.enum([
						'performance',
						'ui',
						'ux',
						'accessibility',
						'security',
						'other',
					]).optional(),
				})
			).default([]),

			bugfixes: z.array(
				z.object({
					title: z.string(),
					description: z.string(),
					severity: z.enum(['critical', 'major', 'minor']).optional(),
				})
			).default([]),

			breaking: z.array(
				z.object({
					title: z.string(),
					description: z.string(),
					migration: z.string().optional(), // Migration guide
				})
			).default([]),
		}),

		// Platform availability
		platforms: z.array(
			z.enum(['web', 'mobile-ios', 'mobile-android', 'api', 'all'])
		).default(['all']),

		// Related content
		relatedFeatures: z.array(z.string()).default([]), // Feature slugs
		relatedTutorials: z.array(z.string()).default([]), // Tutorial slugs
		blogPost: z.string().optional(), // Link to detailed blog post

		// Engagement
		announcementUrl: z.string().optional(), // Link to announcement (Twitter, etc.)
		discussionUrl: z.string().optional(), // Link to discussion (GitHub, Discord)

		// Stats (optional, for major releases)
		stats: z.object({
			totalChanges: z.number().optional(),
			contributors: z.number().optional(),
			daysInDevelopment: z.number().optional(),
		}).optional(),

		// SEO
		seoKeywords: z.array(z.string()).default([]),

		// Technical info
		gitTag: z.string().optional(), // Git tag for this release
		previousVersion: z.string().optional(), // Previous version number
		language: z.enum(['en', 'de', 'fr', 'it', 'es']),
	}),
});

const aiModelsCollection = defineCollection({
	type: 'content',
	schema: z.object({
		name: z.string(), // Model name, e.g., "FLUX Dev"
		provider: z.string(), // e.g., "Black Forest Labs", "Stability AI"
		providerUrl: z.string().optional(), // Provider website

		// Basic info
		description: z.string(), // Short description (1-2 sentences)
		tagline: z.string().optional(), // Marketing tagline
		icon: z.string().optional(), // Emoji or icon
		coverImage: z.string().optional(), // Hero image
		logo: z.string().optional(), // Model/provider logo

		// Model type & category
		type: z.enum([
			'text-to-image', // Generate from text
			'image-to-image', // Modify existing images
			'upscaling', // Enhance resolution
			'inpainting', // Fill or edit parts
			'style-transfer', // Apply styles
			'video', // Video generation
		]),
		category: z.enum([
			'general', // General purpose
			'photorealistic', // Realistic photos
			'artistic', // Art styles
			'illustration', // Illustrations, cartoons
			'anime', // Anime/manga
			'architecture', // Architecture, 3D
			'specialized', // Niche/specialized
		]),

		// Availability
		availability: z.enum([
			'available', // Currently available
			'beta', // Beta access
			'coming-soon', // Announced but not available
			'deprecated', // No longer supported
		]),
		featured: z.boolean().default(false), // Feature on homepage
		recommended: z.boolean().default(false), // Recommended badge
		new: z.boolean().default(false), // New model badge

		// Pricing & Access
		pricing: z.object({
			free: z.boolean(), // Available on free plan
			pro: z.boolean(), // Available on pro plan
			enterprise: z.boolean(), // Available on enterprise
			credits: z.number().optional(), // Credits per generation (if applicable)
		}),

		// Performance metrics
		performance: z.object({
			speed: z.string(), // e.g., "~2 seconds", "5-10 seconds"
			speedScore: z.number().min(1).max(5), // 1-5 rating for comparison
			quality: z.enum(['good', 'excellent', 'outstanding', 'exceptional']),
			qualityScore: z.number().min(1).max(5), // 1-5 rating
			reliability: z.number().min(1).max(5).optional(), // Consistency score
		}),

		// Technical specs
		technical: z.object({
			maxResolution: z.string().optional(), // e.g., "1024x1024", "2048x2048"
			aspectRatios: z.array(z.string()).default([]), // e.g., ["1:1", "16:9", "9:16"]
			parameters: z.object({
				steps: z.object({
					min: z.number(),
					max: z.number(),
					default: z.number(),
				}).optional(),
				guidanceScale: z.object({
					min: z.number(),
					max: z.number(),
					default: z.number(),
				}).optional(),
				seed: z.boolean().default(true), // Supports seed control
			}).optional(),
			modelSize: z.string().optional(), // e.g., "2.8B parameters"
			architecture: z.string().optional(), // e.g., "Diffusion Transformer"
		}),

		// Capabilities
		capabilities: z.object({
			textToImage: z.boolean().default(true),
			imageToImage: z.boolean().default(false),
			inpainting: z.boolean().default(false),
			outpainting: z.boolean().default(false),
			negativePrompts: z.boolean().default(true),
			batchGeneration: z.boolean().default(true),
			promptWeighting: z.boolean().default(false),
			stylePresets: z.boolean().default(false),
		}),

		// Strengths & Weaknesses
		strengths: z.array(z.string()), // What this model excels at
		weaknesses: z.array(z.string()).default([]), // Known limitations

		// Best use cases
		bestFor: z.array(z.string()), // When to use this model
		notRecommendedFor: z.array(z.string()).default([]), // When not to use

		// Example outputs
		exampleImages: z.array(
			z.object({
				url: z.string(),
				prompt: z.string(),
				settings: z.object({
					steps: z.number().optional(),
					guidance: z.number().optional(),
					seed: z.number().optional(),
				}).optional(),
			})
		).default([]),

		// Comparison data
		comparisonMetrics: z.object({
			promptAdherence: z.number().min(1).max(5), // How well it follows prompts
			detailLevel: z.number().min(1).max(5), // Level of detail
			colorAccuracy: z.number().min(1).max(5), // Color reproduction
			textRendering: z.number().min(1).max(5).optional(), // Text in images
			consistency: z.number().min(1).max(5), // Result consistency
		}).optional(),

		// Related content
		relatedModels: z.array(z.string()).default([]), // Similar model slugs
		relatedTutorials: z.array(z.string()).default([]), // Tutorial slugs
		relatedUseCases: z.array(z.string()).default([]), // Use case slugs

		// SEO
		seoKeywords: z.array(z.string()).default([]),
		language: z.enum(['en', 'de', 'fr', 'it', 'es']),

		// Metadata
		releaseDate: z.date().optional(), // When model was released
		lastUpdated: z.date(), // When this content was last updated
		version: z.string().optional(), // Model version

		// Documentation
		documentationUrl: z.string().optional(), // Official docs
		licenseType: z.string().optional(), // License information
		openSource: z.boolean().default(false), // Is it open source?
	}),
});

const galleryCollection = defineCollection({
	type: 'data',
	schema: z.object({
		title: z.string(), // Image title
		slug: z.string(), // URL-friendly slug
		imageUrl: z.string(), // URL to the generated image

		// Generation details
		prompt: z.string(), // The prompt used to generate
		negativePrompt: z.string().optional(), // Negative prompt if used
		model: z.string(), // Model slug (e.g., "flux-dev")

		// Generation settings
		settings: z.object({
			seed: z.number().optional(),
			steps: z.number().optional(),
			guidanceScale: z.number().optional(),
			width: z.number().optional(),
			height: z.number().optional(),
			aspectRatio: z.string().optional(),
		}).optional(),

		// Categorization
		category: z.enum([
			'portrait', // People, faces
			'landscape', // Nature, scenery
			'abstract', // Abstract art
			'illustration', // Illustrations, drawings
			'photography', // Photorealistic
			'product', // Product shots
			'architecture', // Buildings, interiors
			'character', // Character design
			'concept-art', // Concept art
			'other', // Other
		]),
		style: z.array(z.string()).default([]), // Style tags (e.g., ["cinematic", "dark", "moody"])
		tags: z.array(z.string()).default([]), // General tags

		// Creator info
		creator: z.object({
			name: z.string(),
			avatar: z.string().optional(),
			profileUrl: z.string().optional(),
		}).optional(),

		// Visibility & Status
		featured: z.boolean().default(false), // Featured on homepage
		trending: z.boolean().default(false), // Trending badge
		staffPick: z.boolean().default(false), // Staff pick badge
		published: z.boolean().default(true), // Published or draft

		// Engagement metrics
		likes: z.number().default(0),
		downloads: z.number().default(0),
		views: z.number().default(0),

		// Quality & Moderation
		qualityScore: z.number().min(1).max(5).optional(), // 1-5 quality rating
		nsfw: z.boolean().default(false), // NSFW content flag
		moderationStatus: z.enum(['approved', 'pending', 'rejected']).default('approved'),

		// Related content
		relatedImages: z.array(z.string()).default([]), // Slugs of similar images
		relatedTutorials: z.array(z.string()).default([]), // Tutorial slugs
		relatedModels: z.array(z.string()).default([]), // Model slugs

		// SEO
		description: z.string().optional(), // SEO description
		seoKeywords: z.array(z.string()).default([]),

		// Metadata
		createdAt: z.string().transform((str) => new Date(str)),
		updatedAt: z.string().transform((str) => new Date(str)).optional(),
		language: z.enum(['en', 'de', 'fr', 'it', 'es']).default('en'),

		// Technical metadata
		fileSize: z.number().optional(), // File size in bytes
		dimensions: z.object({
			width: z.number(),
			height: z.number(),
		}).optional(),
	}),
});

const promptTemplatesCollection = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(), // Template title
		description: z.string(), // Short description for SEO
		icon: z.string(), // Emoji or icon

		// Template content
		promptTemplate: z.string(), // The actual prompt template with {variables}
		variables: z.array(
			z.object({
				name: z.string(), // Variable name (e.g., "product", "style")
				description: z.string(), // What this variable is for
				placeholder: z.string(), // Example value
				required: z.boolean().default(true),
			})
		).default([]), // Variables in the template

		// Classification
		category: z.enum([
			'social-media', // Instagram, TikTok, etc.
			'product-photography', // E-commerce products
			'marketing', // Ads, campaigns
			'logo-design', // Logos and branding
			'character-design', // Characters, avatars
			'illustration', // Digital art, illustrations
			'photography', // Photo styles
			'architecture', // Buildings, interiors
			'abstract', // Abstract art
			'portrait', // People, faces
			'landscape', // Nature, scenery
			'other',
		]),
		subcategory: z.string().optional(), // More specific category
		tags: z.array(z.string()).default([]), // Keywords

		// Difficulty & Recommendations
		difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
		recommendedModel: z.string(), // e.g., "flux-1-1-pro", "ideogram-v3-turbo"
		alternativeModels: z.array(z.string()).default([]),

		// Settings Recommendations
		recommendedSettings: z.object({
			aspectRatio: z.string().optional(), // e.g., "1:1", "16:9"
			steps: z.number().optional(),
			guidanceScale: z.number().optional(),
			negativePrompt: z.string().optional(),
		}).optional(),

		// Example Outputs
		exampleImages: z.array(
			z.object({
				url: z.string(),
				prompt: z.string(), // Filled-in version of the template
				variables: z.record(z.string()).optional(), // Variable values used
			})
		).default([]),

		// Variations
		variations: z.array(
			z.object({
				title: z.string(),
				prompt: z.string(), // Slightly different version
				description: z.string().optional(),
			})
		).default([]),

		// Use Cases
		useCases: z.array(z.string()).default([]), // When to use this template
		idealFor: z.array(z.string()).default([]), // Target audience

		// Tips & Best Practices
		tips: z.array(z.string()).default([]),
		commonMistakes: z.array(z.string()).default([]),
		doAndDont: z.object({
			do: z.array(z.string()).default([]),
			dont: z.array(z.string()).default([]),
		}).optional(),

		// Visibility
		featured: z.boolean().default(false), // Featured on homepage
		popular: z.boolean().default(false), // Popular badge
		trending: z.boolean().default(false), // Trending badge
		premium: z.boolean().default(false), // Premium/Pro only
		language: z.enum(['en', 'de', 'fr', 'it', 'es']),

		// Engagement
		uses: z.number().default(0), // How many times used
		likes: z.number().default(0),
		saves: z.number().default(0), // Bookmarks
		rating: z.number().min(0).max(5).default(0), // User rating

		// Related Content
		relatedTemplates: z.array(z.string()).default([]),
		relatedTutorials: z.array(z.string()).default([]),
		relatedModels: z.array(z.string()).default([]),

		// SEO
		seoKeywords: z.array(z.string()).default([]),

		// Metadata
		createdBy: z.string().default('Picture Team'), // Author
		publishDate: z.date(),
		lastUpdated: z.date(),

		// Stats
		successRate: z.number().min(0).max(100).optional(), // % of successful generations
	}),
});

const caseStudiesCollection = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(), // Case study title
		description: z.string(), // Short description for SEO

		// Company/Client info
		company: z.object({
			name: z.string(), // Company name
			logo: z.string().optional(), // Company logo URL
			website: z.string().optional(), // Company website
			industry: z.string(), // e.g., "E-commerce", "Marketing Agency"
			size: z.enum(['startup', 'small', 'medium', 'enterprise']).optional(),
			location: z.string().optional(), // e.g., "San Francisco, CA"
		}),

		// Contact person (optional)
		contact: z.object({
			name: z.string(),
			role: z.string(), // Job title
			avatar: z.string().optional(),
			quote: z.string().optional(), // Pull quote from interview
		}).optional(),

		// Hero image
		coverImage: z.string(), // Main case study image
		heroVideo: z.string().optional(), // Video URL if available

		// Classification
		category: z.enum([
			'ecommerce', // E-commerce businesses
			'marketing', // Marketing agencies
			'design', // Design studios
			'content-creation', // Content creators, influencers
			'saas', // SaaS companies
			'education', // Educational institutions
			'enterprise', // Large enterprises
			'startup', // Startups
			'other',
		]),
		tags: z.array(z.string()).default([]), // Keywords like ["product-photography", "social-media"]

		// Visibility
		featured: z.boolean().default(false), // Featured on homepage
		trending: z.boolean().default(false), // Trending case study
		language: z.enum(['en', 'de', 'fr', 'it', 'es']),

		// The Story (structured)
		challenge: z.string(), // What problem did they face?
		solution: z.string(), // How did Picture solve it?
		implementation: z.string(), // How did they implement Picture?
		results: z.string(), // What results did they achieve?

		// Key Metrics (Results)
		metrics: z.array(
			z.object({
				label: z.string(), // e.g., "Time Saved", "Cost Reduction", "Images Generated"
				value: z.string(), // e.g., "80%", "€2,000/month", "10,000+"
				description: z.string().optional(), // Additional context
				icon: z.string().optional(), // Emoji or icon
			})
		).default([]),

		// Features Used
		featuresUsed: z.array(z.string()).default([]), // Feature slugs they used
		modelsUsed: z.array(z.string()).default([]), // Model slugs they used
		useCases: z.array(z.string()).default([]), // Use case slugs

		// Before & After (optional)
		beforeAfter: z.object({
			before: z.object({
				description: z.string(),
				image: z.string().optional(),
				metrics: z.array(z.string()).default([]),
			}),
			after: z.object({
				description: z.string(),
				image: z.string().optional(),
				metrics: z.array(z.string()).default([]),
			}),
		}).optional(),

		// Example images (work samples)
		exampleImages: z.array(
			z.object({
				url: z.string(),
				caption: z.string().optional(),
				prompt: z.string().optional(), // If showing AI-generated examples
			})
		).default([]),

		// Timeline (optional)
		timeline: z.array(
			z.object({
				date: z.string(), // e.g., "January 2025"
				milestone: z.string(), // What happened
			})
		).default([]),

		// Key Takeaways
		keyTakeaways: z.array(z.string()), // Bullet points of lessons learned

		// Testimonial quote (main quote for the case study)
		testimonial: z.object({
			quote: z.string(),
			author: z.string(),
			role: z.string(),
		}).optional(),

		// Technical Details (optional)
		technicalDetails: z.object({
			integrations: z.array(z.string()).default([]), // e.g., ["Shopify", "WordPress"]
			workflow: z.string().optional(), // Description of their workflow
			team: z.object({
				size: z.number().optional(), // Team size
				roles: z.array(z.string()).default([]), // e.g., ["Designer", "Marketer"]
			}).optional(),
		}).optional(),

		// Related content
		relatedCaseStudies: z.array(z.string()).default([]), // Other case study slugs
		relatedTutorials: z.array(z.string()).default([]),
		relatedFeatures: z.array(z.string()).default([]),

		// SEO
		seoKeywords: z.array(z.string()).default([]),
		ogImage: z.string().optional(), // Social share image

		// Metadata
		publishDate: z.date(),
		lastUpdated: z.date(),
		author: z.string().default('Picture Team'), // Who wrote the case study

		// Stats (for internal tracking)
		views: z.number().default(0),
		likes: z.number().default(0),

		// Call to Action (optional custom CTA)
		cta: z.object({
			text: z.string(),
			url: z.string(),
		}).optional(),
	}),
});

export const collections = {
	blog: blogCollection,
	features: featuresCollection,
	testimonials: testimonialsCollection,
	faq: faqCollection,
	useCases: useCasesCollection,
	comparisons: comparisonsCollection,
	tutorials: tutorialsCollection,
	changelog: changelogCollection,
	aiModels: aiModelsCollection,
	gallery: galleryCollection,
	promptTemplates: promptTemplatesCollection,
	caseStudies: caseStudiesCollection,
};
