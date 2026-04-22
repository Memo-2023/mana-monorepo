export default {
	'*.{ts,tsx,js,jsx,mjs,cjs}': [
		'eslint --fix --ignore-pattern "apps-archived/**" --ignore-pattern "services-archived/**" --ignore-pattern "**/web-archived/**" --ignore-pattern "**/server-archived/**"',
		'prettier --config .prettierrc.json --write',
	],
	'*.{json,md,svelte,astro}': ['prettier --config .prettierrc.json --write'],
	// Theme-variable + utility audit whenever styles-bearing files change.
	// Runs on the whole tree (ignores staged filenames), scans ~3k files
	// in <1s, and fails if any file re-introduces:
	//   - bare `--muted` / `--theme-*` CSS variables instead of Mana's
	//     canonical `--color-*` tokens (validate-theme-variables.mjs), or
	//   - raw white-alpha / neutral-palette Tailwind utilities instead of
	//     theme-token utilities (validate-theme-utilities.mjs).
	'*.{svelte,css}': () => [
		'node scripts/validate-theme-variables.mjs',
		'node scripts/validate-theme-utilities.mjs',
		'node scripts/validate-theme-parity.mjs',
	],
	// Validate the tunnel config locally so a malformed ingress map can
	// never reach main. The validator runs entirely in node (no
	// cloudflared CLI dependency on the dev box) and catches the same
	// failure modes that `cloudflared tunnel ingress validate` would
	// catch on the server: bad YAML, missing tunnel id, duplicate
	// hostnames, missing catch-all, malformed service URLs.
	'cloudflared-config.yml': ['node scripts/validate-cloudflared-config.mjs'],
};
