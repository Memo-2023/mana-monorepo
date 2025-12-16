/**
 * Better Auth Additional Field Definitions
 *
 * Re-exports centralized types from @manacore/better-auth-types.
 * This file is provided for convenience when importing from @manacore/shared-auth.
 *
 * @example
 * ```typescript
 * // In SvelteKit/React app
 * import { createAuthClient } from "better-auth/client";
 * import { inferAdditionalFields } from "better-auth/client/plugins";
 * import { userAdditionalFields } from "@manacore/shared-auth";
 *
 * export const authClient = createAuthClient({
 *   baseURL: "http://localhost:3001",
 *   plugins: [inferAdditionalFields(userAdditionalFields)],
 * });
 *
 * // Now user.role is properly typed!
 * const session = await authClient.getSession();
 * console.log(session?.user.role); // TypeScript knows this is string
 * ```
 *
 * @see https://www.better-auth.com/docs/concepts/typescript
 */

// Re-export from centralized package
export {
	userAdditionalFields,
	type UserRole,
	type OrganizationRole,
	type UserWithAdditionalFields,
	isValidUserRole,
	isValidOrganizationRole,
} from '@manacore/better-auth-types';
