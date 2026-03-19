<script lang="ts">
	import { ProfilePage } from '@manacore/shared-profile-ui';
	import type { UserProfile } from '@manacore/shared-profile-ui';
	import { authStore } from '$lib/stores/auth.svelte';

	let userProfile = $derived<UserProfile>({
		id: authStore.user?.id || '',
		email: authStore.user?.email || '',
	});
</script>

<ProfilePage user={userProfile} appName="Context" />
