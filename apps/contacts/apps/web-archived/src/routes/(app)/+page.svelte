<script lang="ts">
	import { _ } from 'svelte-i18n';
	import ContactList from '$lib/components/ContactList.svelte';
	import '$lib/i18n';
</script>

<svelte:head>
	<title>{$_('contacts.title')} - Contacts</title>
</svelte:head>

<svelte:window
	onkeydown={(e) => {
		const target = e.target as HTMLElement;
		const isInQuickInput = target.closest('.quick-input-bar');
		if (isInQuickInput && (e.key === 'ArrowUp' || (e.key === 'Tab' && !e.shiftKey))) {
			const firstName = document.querySelector<HTMLElement>(
				'.contact-name-editable[contenteditable]'
			);
			if (firstName) {
				e.preventDefault();
				firstName.focus();
			}
		}
	}}
/>

<ContactList />
