<script lang="ts">
	import { SubscriptionPage } from '@manacore/shared-subscription-ui';
	import { toast } from '$lib/stores/toast.svelte';

	function handleSubscribe(planId: string) {
		toast.info(`Abo "${planId}" ausgewählt. Bezahlsystem wird noch integriert.`);
	}

	function handleBuyPackage(packageId: string) {
		toast.info(`Paket "${packageId}" ausgewählt. Bezahlsystem wird noch integriert.`);
	}
</script>

<svelte:head>
	<title>Mana - Kalender</title>
</svelte:head>

<div class="mana-page">
	<SubscriptionPage
		appName="Kalender"
		onSubscribe={handleSubscribe}
		onBuyPackage={handleBuyPackage}
		currentPlanId="free"
		pageTitle="Wähle dein Abo"
		subscriptionsTitle="Abonnements"
		packagesTitle="Einmal-Pakete"
		yearlyDiscount="2 Monate gratis"
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
