export default {
	'*.{ts,tsx,js,jsx,mjs,cjs}': [
		'eslint --fix --ignore-pattern "apps-archived/**" --ignore-pattern "services-archived/**" --ignore-pattern "**/web-archived/**" --ignore-pattern "**/server-archived/**"',
		'prettier --config .prettierrc.json --write',
	],
	'*.{json,md,svelte,astro}': ['prettier --config .prettierrc.json --write'],
	// Theme-token audit whenever styles-bearing files change. Runs on the
	// whole tree (ignores staged filenames), scans ~3k files in <1s, and
	// fails if any file re-introduces bare --muted / --theme-* references
	// instead of Mana's canonical --color-* tokens.
	'*.{svelte,css}': () => 'node scripts/audit-theme-tokens.mjs',
	// Validate the tunnel config locally so a malformed ingress map can
	// never reach main. The validator runs entirely in node (no
	// cloudflared CLI dependency on the dev box) and catches the same
	// failure modes that `cloudflared tunnel ingress validate` would
	// catch on the server: bad YAML, missing tunnel id, duplicate
	// hostnames, missing catch-all, malformed service URLs.
	'cloudflared-config.yml': ['node scripts/validate-cloudflared-config.mjs'],
};
