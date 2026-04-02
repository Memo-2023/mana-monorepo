/**
 * Auth Store — uses centralized Mana auth factory.
 * All auth logic lives in @manacore/shared-auth-stores.
 */

import { createManaAuthStore } from '@manacore/shared-auth-stores';

export const authStore = createManaAuthStore({
	devBackendPort: 3007,
});
