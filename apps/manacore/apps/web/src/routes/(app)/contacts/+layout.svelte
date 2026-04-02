<script lang="ts">
	import { setContext, onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import { useAllContacts } from '$lib/modules/contacts/queries';
	import { contactsFilterStore } from '$lib/modules/contacts/stores/filter.svelte';
	import { contactsStore } from '$lib/modules/contacts/stores/contacts.svelte';
	import { profileService } from '$lib/api/profile';
	import { authStore } from '$lib/stores/auth.svelte';

	let { children }: { children: Snippet } = $props();

	// Live query — auto-update when IndexedDB changes
	const allContacts = useAllContacts();

	// Provide data to child components via Svelte context
	setContext('contacts', allContacts);

	// Initialize filter state from localStorage
	contactsFilterStore.initialize();

	// Ensure self-contact exists and stays synced with profile
	onMount(async () => {
		let profile = null;
		if (authStore.isAuthenticated) {
			try {
				profile = await profileService.getProfile();
			} catch {
				// Profile fetch may fail — continue with guest self-contact
			}
		}
		await contactsStore.ensureSelfContact(profile);
	});
</script>

{@render children()}
