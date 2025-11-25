<script lang="ts">
	import { goto } from '$app/navigation';

	export let priceType: 'monthly' | 'yearly' | 'lifetime' = 'monthly';
	export let className = '';
	export let size: 'sm' | 'md' | 'lg' = 'md';

	let loading = false;
	let error = '';

	const priceDisplay = {
		monthly: '4,99€/Monat',
		yearly: '39,99€/Jahr',
		lifetime: '129,99€ einmalig'
	};

	const sizeClasses = {
		sm: 'btn-sm',
		md: '',
		lg: 'btn-lg'
	};

	async function handleUpgrade() {
		loading = true;
		error = '';

		try {
			const response = await fetch('/api/stripe/checkout', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ priceType })
			});

			if (!response.ok) {
				const data = await response.json();
				if (response.status === 401) {
					// Not logged in, redirect to login
					goto('/login?redirect=/pricing');
					return;
				}
				throw new Error(data.error || 'Checkout fehlgeschlagen');
			}

			const { url } = await response.json();

			if (url) {
				// Redirect to Stripe Checkout
				window.location.href = url;
			}
		} catch (err: any) {
			error = err.message;
			loading = false;
		}
	}
</script>

<button
	onclick={handleUpgrade}
	disabled={loading}
	class="btn btn-primary {sizeClasses[size]} {className}"
	class:loading
>
	{#if loading}
		<span class="loading loading-spinner"></span>
		Lädt...
	{:else}
		Upgrade für {priceDisplay[priceType]}
	{/if}
</button>

{#if error}
	<div class="text-error mt-2 text-sm">{error}</div>
{/if}
