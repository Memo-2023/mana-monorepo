<script lang="ts">
	import { SubscriptionPage } from '@manacore/shared-subscription-ui';

	function handleSubscribe(planId: string) {
		alert(`Subscribe to plan: ${planId}\n\nThis would trigger RevenueCat purchase flow.`);
	}

	function handleBuyPackage(packageId: string) {
		alert(`Buy package: ${packageId}\n\nThis would trigger RevenueCat purchase flow.`);
	}
</script>

<SubscriptionPage
	appName="Memoro"
	onSubscribe={handleSubscribe}
	onBuyPackage={handleBuyPackage}
	currentPlanId="free"
/>
