/**
 * Auth Store — uses centralized Mana auth factory.
 */

import { createManaAuthStore } from '@manacore/shared-auth-stores';

export const authStore = createManaAuthStore({
	devBackendPort: 3017,
});
