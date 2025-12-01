/**
 * Better Auth CLI configuration file
 * This file is used by the Better Auth CLI to generate the schema.
 * Run: npx @better-auth/cli generate --output ./src/db/schema/better-auth-schema.ts
 */

import { betterAuth } from 'better-auth';
import { organization } from 'better-auth/plugins/organization';
import { jwt } from 'better-auth/plugins/jwt';

export const auth = betterAuth({
	// Use simple URL-based connection for CLI
	database: {
		type: 'postgres',
		url: 'postgresql://manacore:devpassword@localhost:5432/manacore',
	},
	emailAndPassword: {
		enabled: true,
	},
	plugins: [
		organization({
			allowUserToCreateOrganization: true,
		}),
		jwt(),
	],
});
