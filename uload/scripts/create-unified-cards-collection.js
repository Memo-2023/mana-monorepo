#!/usr/bin/env node

/**
 * Script to create the unified cards collection in PocketBase
 * Run this with: node scripts/create-unified-cards-collection.js
 */

const PocketBase = require('pocketbase');

const pb = new PocketBase('http://127.0.0.1:8090');

async function createUnifiedCardsCollection() {
	try {
		// Admin authentication
		await pb.admins.authWithPassword(
			process.env.POCKETBASE_ADMIN_EMAIL || 'admin@example.com',
			process.env.POCKETBASE_ADMIN_PASSWORD || 'admin123456'
		);

		console.log('✅ Authenticated as admin');

		// Define the unified cards collection schema
		const collection = {
			name: 'cards',
			type: 'base',
			schema: [
				// Core relationships
				{
					name: 'user_id',
					type: 'relation',
					required: false, // null for system templates
					options: {
						collectionId: '_pb_users_auth_',
						cascadeDelete: true,
						minSelect: null,
						maxSelect: 1,
						displayFields: ['email', 'username']
					}
				},

				// Card type and origin
				{
					name: 'type',
					type: 'select',
					required: true,
					options: {
						values: ['user', 'template', 'system'],
						maxSelect: 1
					}
				},
				{
					name: 'source',
					type: 'select',
					required: false,
					options: {
						values: ['created', 'duplicated', 'imported', 'migrated'],
						maxSelect: 1
					}
				},
				{
					name: 'template_id',
					type: 'relation',
					required: false,
					options: {
						collectionId: 'cards', // Self-reference
						cascadeDelete: false,
						minSelect: null,
						maxSelect: 1,
						displayFields: ['metadata']
					}
				},

				// Card configuration (unified structure)
				{
					name: 'config',
					type: 'json',
					required: true,
					options: {
						maxSize: 1000000 // 1MB max
					}
				},
				{
					name: 'metadata',
					type: 'json',
					required: false,
					options: {
						maxSize: 100000 // 100KB max
					}
				},
				{
					name: 'constraints',
					type: 'json',
					required: false,
					options: {
						maxSize: 10000 // 10KB max
					}
				},

				// Organization
				{
					name: 'page',
					type: 'text',
					required: false,
					options: {
						min: 0,
						max: 100,
						pattern: ''
					}
				},
				{
					name: 'position',
					type: 'number',
					required: false,
					options: {
						min: 0,
						max: 9999,
						noDecimal: true
					}
				},
				{
					name: 'folder_id',
					type: 'relation',
					required: false,
					options: {
						collectionId: 'folders',
						cascadeDelete: false,
						minSelect: null,
						maxSelect: 1,
						displayFields: ['name']
					}
				},

				// Visibility and sharing
				{
					name: 'visibility',
					type: 'select',
					required: true,
					options: {
						values: ['private', 'public', 'unlisted'],
						maxSelect: 1
					}
				},
				{
					name: 'is_featured',
					type: 'bool',
					required: false
				},
				{
					name: 'allow_duplication',
					type: 'bool',
					required: false
				},

				// Statistics
				{
					name: 'usage_count',
					type: 'number',
					required: false,
					options: {
						min: 0,
						max: 999999,
						noDecimal: true
					}
				},
				{
					name: 'likes_count',
					type: 'number',
					required: false,
					options: {
						min: 0,
						max: 999999,
						noDecimal: true
					}
				},

				// Search and categorization
				{
					name: 'tags',
					type: 'json',
					required: false,
					options: {
						maxSize: 10000
					}
				},
				{
					name: 'category',
					type: 'select',
					required: false,
					options: {
						values: ['personal', 'creative', 'minimal', 'social', 'portfolio', 'other'],
						maxSelect: 1
					}
				},

				// Variant for styling
				{
					name: 'variant',
					type: 'select',
					required: false,
					options: {
						values: ['default', 'compact', 'hero', 'minimal', 'glass', 'gradient'],
						maxSelect: 1
					}
				}
			],

			// Indexes for performance
			indexes: [
				'CREATE INDEX idx_cards_user_id ON cards (user_id)',
				'CREATE INDEX idx_cards_type ON cards (type)',
				'CREATE INDEX idx_cards_page ON cards (page)',
				'CREATE INDEX idx_cards_visibility ON cards (visibility)',
				'CREATE INDEX idx_cards_template_id ON cards (template_id)',
				'CREATE INDEX idx_cards_position ON cards (position)'
			],

			// API Rules
			listRule:
				'@request.auth.id = user_id || visibility = "public" || (visibility = "unlisted" && @request.query.id != "")',
			viewRule: '@request.auth.id = user_id || visibility != "private"',
			createRule: '@request.auth.id != ""',
			updateRule:
				'@request.auth.id = user_id || (@request.auth.id != "" && type = "system" && @request.auth.admin = true)',
			deleteRule: '@request.auth.id = user_id && type != "system"',

			options: {}
		};

		// Create the collection
		const result = await pb.collections.create(collection);
		console.log('✅ Created unified cards collection:', result.name);

		// Create some default system templates
		await createDefaultTemplates(pb);

		console.log('🎉 Successfully created unified cards collection!');
	} catch (error) {
		console.error('❌ Error creating collection:', error);

		// If collection already exists, try to update it
		if (error.response?.code === 400) {
			console.log('Collection might already exist. Trying to update...');
			try {
				const existing = await pb.collections.getOne('cards');
				await pb.collections.update(existing.id, collection);
				console.log('✅ Updated existing cards collection');
			} catch (updateError) {
				console.error('❌ Failed to update:', updateError);
			}
		}
	}
}

async function createDefaultTemplates(pb) {
	const templates = [
		{
			type: 'template',
			visibility: 'public',
			is_featured: true,
			allow_duplication: true,
			category: 'personal',
			variant: 'default',
			config: {
				mode: 'beginner',
				modules: [
					{
						id: 'header-1',
						type: 'header',
						props: {
							title: 'John Doe',
							subtitle: 'Software Developer'
						},
						order: 0
					},
					{
						id: 'content-1',
						type: 'content',
						props: {
							text: 'Passionate about creating amazing digital experiences.'
						},
						order: 1
					},
					{
						id: 'links-1',
						type: 'links',
						props: {
							links: [
								{ label: 'GitHub', href: 'https://github.com', icon: '🔗' },
								{ label: 'LinkedIn', href: 'https://linkedin.com', icon: '💼' }
							],
							style: 'button'
						},
						order: 2
					}
				]
			},
			metadata: {
				name: 'Simple Profile',
				description: 'A clean and simple profile card',
				version: '1.0.0',
				tags: ['profile', 'minimal', 'clean']
			},
			constraints: {
				aspectRatio: '16/9'
			},
			usage_count: 0,
			likes_count: 0
		},
		{
			type: 'template',
			visibility: 'public',
			is_featured: true,
			allow_duplication: true,
			category: 'personal',
			variant: 'gradient',
			config: {
				mode: 'advanced',
				template: `
					<div class="professional-card">
						<h1>{{name}}</h1>
						<p class="tagline">{{tagline}}</p>
						<div class="contact">
							<a href="mailto:{{email}}">{{email}}</a>
							<a href="tel:{{phone}}">{{phone}}</a>
						</div>
					</div>
				`,
				css: `
					.professional-card {
						padding: 2rem;
						text-align: center;
						background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
						color: white;
					}
					.tagline {
						font-size: 1.2rem;
						margin: 1rem 0;
						opacity: 0.9;
					}
					.contact {
						display: flex;
						justify-content: center;
						gap: 2rem;
						margin-top: 2rem;
					}
					.contact a {
						color: white;
						text-decoration: none;
					}
				`,
				variables: [
					{ name: 'name', type: 'text', label: 'Your Name' },
					{ name: 'tagline', type: 'text', label: 'Tagline' },
					{ name: 'email', type: 'text', label: 'Email' },
					{ name: 'phone', type: 'text', label: 'Phone' }
				],
				values: {
					name: 'Your Name',
					tagline: 'Your tagline here',
					email: 'contact@example.com',
					phone: '+1 234 567 890'
				}
			},
			metadata: {
				name: 'Professional Card',
				description: 'Professional contact card template',
				version: '1.0.0',
				tags: ['professional', 'contact']
			},
			constraints: {
				aspectRatio: '16/9'
			},
			usage_count: 0,
			likes_count: 0
		}
	];

	for (const template of templates) {
		try {
			await pb.collection('cards').create(template);
			console.log(`✅ Created template: ${template.metadata.name}`);
		} catch (error) {
			console.error(`❌ Failed to create template: ${template.metadata.name}`, error);
		}
	}
}

// Run the script
createUnifiedCardsCollection();
