export default {
	'*.{ts,tsx,js,jsx,mjs,cjs}': ['eslint --fix', 'prettier --config .prettierrc.json --write'],
	'*.{json,md,astro}': ['prettier --config .prettierrc.json --ignore-path .prettierignore --write'],
	// Svelte files: format + check for a11y and Svelte 5 issues
	'*.svelte': [
		'prettier --config .prettierrc.json --write',
		// svelte-check is run at project level via pre-commit hook
	],
};
