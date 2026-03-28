<script lang="ts">
	import { SubscriptionPage } from '@manacore/shared-subscription-ui';
	import { toastStore } from '@manacore/shared-ui';

	function handleSubscribe(planId: string) {
		console.log('Subscribe to plan:', planId);
		toastStore.info(`Abo "${planId}" ausgewählt. Bezahlsystem wird noch integriert.`);
	}

	function handleBuyPackage(packageId: string) {
		console.log('Buy package:', packageId);
		toastStore.info(`Paket "${packageId}" ausgewählt. Bezahlsystem wird noch integriert.`);
	}
</script>

<svelte:head>
	<title>Mana - Contacts</title>
</svelte:head>

<div class="mana-page">
	<SubscriptionPage
		appName="Contacts"
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
