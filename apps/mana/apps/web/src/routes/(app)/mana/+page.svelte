<script lang="ts">
	import { SubscriptionPage } from '@mana/subscriptions';

	let toastMessage = $state<string | null>(null);

	function handleSubscribe(planId: string) {
		toastMessage = `Abo "${planId}" ausgewahlt. Bezahlsystem wird in Kurze integriert.`;
		setTimeout(() => (toastMessage = null), 4000);
	}

	function handleBuyPackage(packageId: string) {
		toastMessage = `Paket "${packageId}" ausgewahlt. Bezahlsystem wird in Kurze integriert.`;
		setTimeout(() => (toastMessage = null), 4000);
	}
</script>

<svelte:head>
	<title>Mana - Mana</title>
</svelte:head>

<!-- Toast notification -->
{#if toastMessage}
	<div
		class="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-amber-600 px-5 py-3 text-sm font-medium text-white shadow-lg"
	>
		{toastMessage}
	</div>
{/if}

<div class="mana-page">
	<SubscriptionPage
		appName="Mana"
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
		background-color: hsl(var(--color-background));
	}
</style>
