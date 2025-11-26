#!/usr/bin/env node

/**
 * Script to create default templates in the unified cards collection
 * Run this with: node scripts/create-default-templates.js
 */

const PocketBase = require('pocketbase').default;

const pb = new PocketBase('http://127.0.0.1:8090');

async function createDefaultTemplates() {
	try {
		// Admin authentication
		await pb.admins.authWithPassword(
			process.env.POCKETBASE_ADMIN_EMAIL || 'admin@example.com',
			process.env.POCKETBASE_ADMIN_PASSWORD || 'admin123456'
		);

		console.log('✅ Authenticated as admin');

		// Default template configurations
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
								subtitle: 'Software Developer',
								avatar: '/api/files/_pb_users_auth_/placeholder/avatar.jpg'
							},
							order: 0
						},
						{
							id: 'content-1',
							type: 'content',
							props: {
								text: 'Passionate about creating amazing digital experiences and building innovative solutions.'
							},
							order: 1
						},
						{
							id: 'links-1',
							type: 'links',
							props: {
								links: [
									{ label: 'GitHub', href: 'https://github.com', icon: '🔗' },
									{ label: 'LinkedIn', href: 'https://linkedin.com', icon: '💼' },
									{ label: 'Portfolio', href: 'https://example.com', icon: '🌐' }
								],
								style: 'button',
								layout: 'vertical'
							},
							order: 2
						}
					],
					layout: {
						padding: '1.5rem',
						gap: '1rem',
						maxWidth: '400px'
					},
					animations: {
						hover: true,
						entrance: 'fade'
					}
				},
				metadata: {
					name: 'Simple Profile',
					description: 'A clean and simple profile card perfect for personal branding',
					version: '1.0.0'
				},
				constraints: {
					aspectRatio: '16/9'
				},
				tags: ['profile', 'minimal', 'clean', 'personal'],
				usage_count: 0,
				likes_count: 0
			},
			{
				type: 'template',
				visibility: 'public',
				is_featured: true,
				allow_duplication: true,
				category: 'creative',
				variant: 'glass',
				config: {
					mode: 'beginner',
					modules: [
						{
							id: 'header-1',
							type: 'header',
							props: {
								title: 'Creative Portfolio',
								subtitle: 'Design • Photography • Art',
								avatar: '/api/files/_pb_users_auth_/placeholder/creative-avatar.jpg'
							},
							order: 0
						},
						{
							id: 'gallery-1',
							type: 'gallery',
							props: {
								images: [
									'/api/files/_pb_users_auth_/placeholder/work1.jpg',
									'/api/files/_pb_users_auth_/placeholder/work2.jpg',
									'/api/files/_pb_users_auth_/placeholder/work3.jpg'
								],
								layout: 'grid',
								columns: 3
							},
							order: 1
						},
						{
							id: 'content-1',
							type: 'content',
							props: {
								text: 'Bringing ideas to life through visual storytelling and innovative design solutions.'
							},
							order: 2
						},
						{
							id: 'links-1',
							type: 'links',
							props: {
								links: [
									{ label: 'Behance', href: 'https://behance.net', icon: '🎨' },
									{ label: 'Instagram', href: 'https://instagram.com', icon: '📸' },
									{ label: 'Dribbble', href: 'https://dribbble.com', icon: '🏀' }
								],
								style: 'minimal',
								layout: 'horizontal'
							},
							order: 3
						}
					],
					layout: {
						padding: '1.5rem',
						gap: '1.2rem',
						maxWidth: '450px'
					},
					animations: {
						hover: true,
						entrance: 'slide'
					}
				},
				metadata: {
					name: 'Creative Portfolio',
					description: 'Showcase your creative work with this visually appealing portfolio card',
					version: '1.0.0'
				},
				constraints: {
					aspectRatio: '4/3'
				},
				tags: ['creative', 'portfolio', 'art', 'design', 'gallery'],
				usage_count: 0,
				likes_count: 0
			},
			{
				type: 'template',
				visibility: 'public',
				is_featured: false,
				allow_duplication: true,
				category: 'minimal',
				variant: 'minimal',
				config: {
					mode: 'beginner',
					modules: [
						{
							id: 'header-1',
							type: 'header',
							props: {
								title: 'Jane Smith',
								subtitle: 'Designer & Developer'
							},
							order: 0
						},
						{
							id: 'links-1',
							type: 'links',
							props: {
								links: [
									{ label: 'Website', href: 'https://janesmith.dev', icon: '🌐' },
									{ label: 'Email', href: 'mailto:jane@example.com', icon: '✉️' }
								],
								style: 'text',
								layout: 'vertical'
							},
							order: 1
						}
					],
					layout: {
						padding: '1rem',
						gap: '0.8rem',
						maxWidth: '300px'
					}
				},
				metadata: {
					name: 'Minimal Card',
					description: 'Clean and minimal design focusing on essential information only',
					version: '1.0.0'
				},
				constraints: {
					aspectRatio: '1/1'
				},
				tags: ['minimal', 'simple', 'clean', 'text'],
				usage_count: 0,
				likes_count: 0
			},
			{
				type: 'template',
				visibility: 'public',
				is_featured: false,
				allow_duplication: true,
				category: 'social',
				variant: 'hero',
				config: {
					mode: 'beginner',
					modules: [
						{
							id: 'header-1',
							type: 'header',
							props: {
								title: '@socialinfluencer',
								subtitle: 'Content Creator & Influencer',
								avatar: '/api/files/_pb_users_auth_/placeholder/influencer-avatar.jpg',
								verified: true
							},
							order: 0
						},
						{
							id: 'stats-1',
							type: 'stats',
							props: {
								stats: [
									{ label: 'Followers', value: '10.2K', icon: '👥' },
									{ label: 'Posts', value: '450', icon: '📱' },
									{ label: 'Engagement', value: '5.8%', icon: '💝' }
								],
								layout: 'compact'
							},
							order: 1
						},
						{
							id: 'content-1',
							type: 'content',
							props: {
								text: 'Sharing daily inspiration, lifestyle tips, and behind-the-scenes moments ✨'
							},
							order: 2
						},
						{
							id: 'links-1',
							type: 'links',
							props: {
								links: [
									{ label: 'Instagram', href: 'https://instagram.com', icon: '📸' },
									{ label: 'TikTok', href: 'https://tiktok.com', icon: '🎵' },
									{ label: 'YouTube', href: 'https://youtube.com', icon: '🎥' },
									{ label: 'Patreon', href: 'https://patreon.com', icon: '💖' }
								],
								style: 'button',
								layout: 'grid',
								columns: 2
							},
							order: 3
						}
					],
					layout: {
						padding: '1.5rem',
						gap: '1rem',
						maxWidth: '400px'
					},
					animations: {
						hover: true,
						entrance: 'bounce'
					}
				},
				metadata: {
					name: 'Social Media Hub',
					description:
						'Perfect for influencers and content creators to showcase their social presence',
					version: '1.0.0'
				},
				constraints: {
					aspectRatio: '9/16'
				},
				tags: ['social', 'influencer', 'content', 'creator', 'instagram'],
				usage_count: 0,
				likes_count: 0
			}
		];

		// Create templates
		for (const template of templates) {
			try {
				const result = await pb.collection('cards').create(template);
				console.log(`✅ Created template: ${template.metadata.name} (ID: ${result.id})`);
			} catch (error) {
				console.error(`❌ Failed to create template: ${template.metadata.name}`, error);
			}
		}

		console.log('🎉 Successfully created default templates!');
	} catch (error) {
		console.error('❌ Error creating templates:', error);
	}
}

// Run the script
createDefaultTemplates();
