<script lang="ts">
	import { SubscriptionPage } from '@manacore/shared-subscription-ui';
	import { currentTheme } from '$lib/stores/theme';
	import { showToast } from '$lib/stores/toast';

	function handleSubscribe(planId: string) {
		console.log('Subscribe to plan:', planId);
		showToast(`Abo "${planId}" ausgewählt. Bezahlsystem wird noch integriert.`, 'info', 5000);
	}

	function handleBuyPackage(packageId: string) {
		console.log('Buy package:', packageId);
		showToast(`Paket "${packageId}" ausgewählt. Bezahlsystem wird noch integriert.`, 'info', 5000);
	}
</script>

<svelte:head>
	<title>Abonnement - Picture</title>
</svelte:head>

<div class="min-h-screen p-4 md:p-8" style="background-color: {$currentTheme.background};">
	<div class="mx-auto max-w-6xl">
		<SubscriptionPage
			appName="Picture"
			onSubscribe={handleSubscribe}
			onBuyPackage={handleBuyPackage}
			currentPlanId="free"
			pageTitle="Wähle dein Abo"
			subscriptionsTitle="Abonnements"
			packagesTitle="Einmal-Pakete"
			yearlyDiscount="2 Monate gratis"
		/>
	</div>
</div>
