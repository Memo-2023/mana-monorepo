<script lang="ts">
	import { SubscriptionPage } from '@manacore/subscriptions';

	function handleSubscribe(planId: string) {
		console.log('Subscribe to plan:', planId);
		alert(`Abo "${planId}" ausgewählt. Bezahlsystem wird noch integriert.`);
	}

	function handleBuyPackage(packageId: string) {
		console.log('Buy package:', packageId);
		alert(`Paket "${packageId}" ausgewählt. Bezahlsystem wird noch integriert.`);
	}
</script>

<svelte:head>
	<title>Mana - Todo</title>
</svelte:head>

<div class="mana-page">
	<SubscriptionPage
		appName="Todo"
		onSubscribe={handleSubscribe}
		onBuyPackage={handleBuyPackage}
		currentPlanId="free"
		pageTitle="Wähle dein Abo"
		subscriptionsTitle="Abonnements"
		packagesTitle="Einmal-Pakete"
		yearlyDiscount="20% Rabatt"
	/>
</div>

<style>
	.mana-page {
		min-height: 100%;
		width: 100%;
		overflow-x: hidden;
		background-color: hsl(var(--background));
	}
</style>
