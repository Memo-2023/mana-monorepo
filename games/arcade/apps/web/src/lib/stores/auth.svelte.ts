import { createManaAuthStore } from '@manacore/shared-auth-ui';

export const authStore = createManaAuthStore({
	devBackendPort: 3011,
});
