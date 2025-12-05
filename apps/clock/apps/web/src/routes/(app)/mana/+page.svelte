<script lang="ts">
	import { SubscriptionPage } from '@manacore/shared-subscription-ui';
	import { authStore } from '$lib/stores/auth.svelte';
</script>

<SubscriptionPage user={authStore.user} appName="Clock" />
