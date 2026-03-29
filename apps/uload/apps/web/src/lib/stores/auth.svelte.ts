import { createManaAuthStore } from '@manacore/shared-auth-stores';

export const authStore = createManaAuthStore({
	devBackendPort: 3070,
});
