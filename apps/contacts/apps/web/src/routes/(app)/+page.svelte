<script lang="ts">
	import { _ } from 'svelte-i18n';
	import ContactList from '$lib/components/ContactList.svelte';
	import '$lib/i18n';
</script>

<svelte:head>
	<title>{$_('contacts.title')} - Contacts</title>
</svelte:head>

<ContactList />
