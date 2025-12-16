<script lang="ts">
	import { SubscriptionPage } from '@manacore/shared-subscription-ui';
	import { authStore } from '$lib/stores/auth.svelte';

	function handleSubscribe(planId: string) {
		console.log('Subscribe to plan:', planId);
		// TODO: Implement subscription logic
	}

	function handleBuyPackage(packageId: string) {
		console.log('Buy package:', packageId);
		// TODO: Implement package purchase logic
	}
</script>

<SubscriptionPage appName="Clock" onSubscribe={handleSubscribe} onBuyPackage={handleBuyPackage} />
