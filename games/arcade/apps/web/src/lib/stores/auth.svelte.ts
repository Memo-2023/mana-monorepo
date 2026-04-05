import { createManaAuthStore } from '@mana/shared-auth-ui';

export const authStore = createManaAuthStore({
	devBackendPort: 3011,
});
