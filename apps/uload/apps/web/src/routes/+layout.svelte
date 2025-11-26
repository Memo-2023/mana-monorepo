<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { themeStore } from '$lib/theme.svelte';
	import { initLocale } from '$lib/locale';
	import { onMount } from 'svelte';
	import { Toaster } from 'svelte-sonner';
	import { accountsStore } from '$lib/stores/accounts';
	import { page } from '$app/stores';
	import { pb } from '$lib/pocketbase';
	import { initializePWA } from '$lib/pwa';
	import CookieBanner from '$lib/components/gdpr/CookieBanner.svelte';
	import InstallPWABanner from '$lib/components/mobile/InstallPWABanner.svelte';

	let { children, data } = $props();

	// Initialize accounts store when user data changes
	$effect(() => {
		if (data?.user) {
			accountsStore.init(data.user);
		} else {
			accountsStore.clear();
		}
	});

	onMount(() => {
		initLocale();
		
		// Initialize PocketBase auth from cookie on client-side
		if (typeof document !== 'undefined') {
			const cookie = document.cookie;
			pb.authStore.loadFromCookie(cookie);
			console.log('[ROOT LAYOUT] PocketBase auth initialized:', {
				isValid: pb.authStore.isValid,
				userId: pb.authStore.model?.id,
				email: pb.authStore.model?.email
			});
		}
		
		// Initialize PWA
		initializePWA();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}

<!-- Toast Notifications -->
<Toaster
	position="bottom-right"
	expand={false}
	richColors
	closeButton
	duration={4000}
	visibleToasts={3}
	toastOptions={{
		className: 'sonner-toast',
		descriptionClassName: 'sonner-description'
	}}
/>

<!-- GDPR Cookie Banner - Disabled (only using Umami which doesn't use cookies) -->
<!-- <CookieBanner /> -->

<!-- PWA Install Banner -->
<InstallPWABanner />
