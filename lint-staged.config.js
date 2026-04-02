export default {
	'*.{ts,tsx,js,jsx,mjs,cjs}': [
		'eslint --fix --ignore-pattern "apps-archived/**" --ignore-pattern "services-archived/**" --ignore-pattern "**/web-archived/**" --ignore-pattern "**/server-archived/**"',
		'prettier --config .prettierrc.json --write',
	],
	'*.{json,md,svelte,astro}': ['prettier --config .prettierrc.json --write'],
};
