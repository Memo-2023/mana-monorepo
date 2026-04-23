import type { SiteTemplate } from './types';

/**
 * One-pager with hero + 6 CTAs. Classic "link-in-bio" layout for
 * creators, streamers, podcasters.
 */
export const linktreeTemplate: SiteTemplate = {
	id: 'personal-linktree',
	name: 'Link-Sammlung',
	description:
		'Eine Seite mit mehreren Call-to-Action-Buttons — für Link-in-Bio, Creator-Profile, Linkhub.',
	tag: 'privat',
	pages: [
		{
			path: '/',
			title: 'Start',
			order: 1024,
			blocks: [
				{
					localId: 'hero',
					type: 'hero',
					props: {
						eyebrow: '',
						title: '[Dein Name]',
						subtitle: 'Meine Plattformen und Projekte auf einen Blick.',
						ctaLabel: '',
						ctaHref: '',
						align: 'center',
						background: 'gradient',
					},
				},
				{
					localId: 'cta-1',
					type: 'cta',
					props: {
						title: 'YouTube',
						description: '',
						buttonLabel: 'Kanal abonnieren',
						buttonHref: 'https://youtube.com/@example',
						variant: 'primary',
						align: 'center',
						background: 'none',
					},
				},
				{
					localId: 'cta-2',
					type: 'cta',
					props: {
						title: 'Instagram',
						description: '',
						buttonLabel: '@handle folgen',
						buttonHref: 'https://instagram.com/example',
						variant: 'secondary',
						align: 'center',
						background: 'none',
					},
				},
				{
					localId: 'cta-3',
					type: 'cta',
					props: {
						title: 'Newsletter',
						description: 'Einmal pro Woche, null Spam.',
						buttonLabel: 'Abonnieren',
						buttonHref: '#',
						variant: 'primary',
						align: 'center',
						background: 'subtle',
					},
				},
				{
					localId: 'cta-4',
					type: 'cta',
					props: {
						title: 'Podcast',
						description: '',
						buttonLabel: 'Hören',
						buttonHref: '#',
						variant: 'secondary',
						align: 'center',
						background: 'none',
					},
				},
				{
					localId: 'cta-5',
					type: 'cta',
					props: {
						title: 'Shop',
						description: '',
						buttonLabel: 'Produkte ansehen',
						buttonHref: '#',
						variant: 'ghost',
						align: 'center',
						background: 'none',
					},
				},
				{
					localId: 'cta-6',
					type: 'cta',
					props: {
						title: 'Kontakt',
						description: '',
						buttonLabel: 'E-Mail schreiben',
						buttonHref: 'mailto:hallo@example.com',
						variant: 'ghost',
						align: 'center',
						background: 'none',
					},
				},
			],
		},
	],
};
