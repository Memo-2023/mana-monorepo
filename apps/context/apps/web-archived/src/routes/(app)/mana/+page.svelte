<script lang="ts">
	import { SubscriptionPage } from '@manacore/subscriptions';

	function handleSubscribe(planId: string) {
		console.log('Subscribe to plan:', planId);
	}

	function handleBuyPackage(packageId: string) {
		console.log('Buy package:', packageId);
	}
</script>

<SubscriptionPage appName="Context" onSubscribe={handleSubscribe} onBuyPackage={handleBuyPackage} />
