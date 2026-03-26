<script lang="ts">
	import { ProfilePage } from '@manacore/shared-profile-ui';
	import { authStore } from '$lib/stores/auth.svelte';
</script>

<ProfilePage user={authStore.user} appName="CityCorners" />
