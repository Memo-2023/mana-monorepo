// @ts-check
import { baseConfig, typescriptConfig, svelteConfig, prettierConfig } from '@mana/eslint-config';

export default [
	{
		ignores: ['dist/**', '.svelte-kit/**', 'node_modules/**'],
	},
	...baseConfig,
	...typescriptConfig,
	...svelteConfig,
	...prettierConfig,
	// Guard: prevent raw liveQuery imports in module code. All modules
	// must use useLiveQueryWithDefault from @mana/local-store/svelte
	// instead, which provides a reactive { value, loading, error } shape.
	// Raw liveQuery returns an Observable that requires manual .subscribe()
	// boilerplate and was the root cause of 38 type errors.
	{
		files: ['src/lib/modules/**/queries.ts'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					paths: [
						{
							name: 'dexie',
							importNames: ['liveQuery'],
							message:
								'Use useLiveQueryWithDefault from @mana/local-store/svelte instead of raw liveQuery. See the Observable migration commit for rationale.',
						},
					],
				},
			],
		},
	},
];
