export default {
	'*.{ts,tsx,js,jsx,mjs,cjs}': [
		'eslint --fix --ignore-pattern "apps-archived/**"',
		'prettier --config .prettierrc.json --write',
	],
	'*.{json,md,svelte,astro}': ['prettier --config .prettierrc.json --write'],
};
