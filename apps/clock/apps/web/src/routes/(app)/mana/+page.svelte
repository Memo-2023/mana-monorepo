<script lang="ts">
	import { SubscriptionPage } from '@manacore/subscriptions';
	import { authStore } from '$lib/stores/auth.svelte';
</script>

<SubscriptionPage user={authStore.user} appName="Clock" />
