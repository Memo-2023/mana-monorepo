import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('mdsvex').MdsvexOptions} */
const mdsvexOptions = {
	extensions: ['.md', '.mdx'],
	layout: {
		blog: path.join(__dirname, './src/lib/layouts/BlogLayout.svelte'),
		_: path.join(__dirname, './src/lib/layouts/DefaultLayout.svelte')
	},
	rehypePlugins: [
		rehypeSlug,
		[rehypeAutolinkHeadings, { 
			behavior: 'wrap',
			properties: {
				className: 'anchor-link'
			}
		}]
	]
};

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	extensions: ['.svelte', '.md', '.mdx'],
	preprocess: [vitePreprocess(), mdsvex(mdsvexOptions)],
	kit: {
		adapter: adapter(),
		alias: {
			$paraglide: './src/paraglide',
			'$paraglide/*': './src/paraglide/*'
		}
	}
};

export default config;
