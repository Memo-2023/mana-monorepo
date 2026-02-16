import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { createPWAConfig } from '@manacore/shared-pwa';
import { MANACORE_SHARED_PACKAGES } from '@manacore/shared-vite-config';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA(
			createPWAConfig({
				name: 'Storage - Cloud Speicher',
				shortName: 'Storage',
				description: 'Cloud-Dateispeicher',
				themeColor: '#64748b',
			})
		),
	],
	server: {
		port: 5185,
		strictPort: true,
	},
	ssr: {
		noExternal: [...MANACORE_SHARED_PACKAGES, 'lucide-svelte'],
	},
	optimizeDeps: {
		exclude: [...MANACORE_SHARED_PACKAGES, 'lucide-svelte'],
	},
});
