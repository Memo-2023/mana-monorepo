// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import netlify from '@astrojs/netlify';
import partytown from '@astrojs/partytown';

// https://astro.build/config
export default defineConfig({
	integrations: [
		mdx(),
		partytown({
			config: {
				forward: ['plausible.io'],
			},
		}),
	],
	// Content Collections config
	markdown: {
		shikiConfig: {
			theme: 'dracula',
		},
	},
	output: 'server',
	adapter: netlify({
		imageCDN: true,
		edgeMiddleware: true,
	}),
});
