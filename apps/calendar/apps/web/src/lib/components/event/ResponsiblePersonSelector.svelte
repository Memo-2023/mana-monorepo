<script lang="ts">
	import type { ResponsiblePerson } from '@calendar/shared';
	import type { ContactSummary, ContactOrManual, ManualContactEntry } from '@manacore/shared-types';
	import { ContactSelector, ContactAvatar } from '@manacore/shared-ui';
	import { X, ArrowSquareOut, User } from '@manacore/shared-icons';
	import { contactsStore } from '$lib/stores/contacts.svelte';

	interface Props {
		responsiblePerson: ResponsiblePerson | null;
		onResponsiblePersonChange: (person: ResponsiblePerson | null) => void;
		disabled?: boolean;
	}

	let { responsiblePerson, onResponsiblePersonChange, disabled = false }: Props = $props();

	let contactsAvailable = $state<boolean | null>(null);
	let showSelector = $state(false);

	// Check contacts availability on mount
	$effect(() => {
		contactsStore.checkAvailability().then((available) => {
			contactsAvailable = available;
		});
	});

	// Convert responsible person to ContactOrManual format for the selector
	const selectedContacts = $derived<ContactOrManual[]>(
		responsiblePerson
			? responsiblePerson.contactId
				? [
						{
							contactId: responsiblePerson.contactId,
							displayName: responsiblePerson.name || responsiblePerson.email,
							email: responsiblePerson.email,
							photoUrl: responsiblePerson.photoUrl,
							company: responsiblePerson.company,
							fetchedAt: new Date().toISOString(),
						},
					]
				: [
						{
							email: responsiblePerson.email,
							name: responsiblePerson.name,
							isManual: true as const,
						},
					]
			: []
	);

	function handleContactsChange(contacts: ContactOrManual[]) {
		if (contacts.length === 0) {
			onResponsiblePersonChange(null);
			showSelector = false;
			return;
		}

		const contact = contacts[0];

		if ('isManual' in contact && contact.isManual) {
			// Manual entry
			const manual = contact as ManualContactEntry;
			onResponsiblePersonChange({
				email: manual.email,
				name: manual.name,
			});
		} else {
			// Contact reference
			const contactRef = contact as {
				contactId: string;
				displayName: string;
				email?: string;
				photoUrl?: string;
				company?: string;
			};
			onResponsiblePersonChange({
				email: contactRef.email || '',
				name: contactRef.displayName,
				contactId: contactRef.contactId,
				photoUrl: contactRef.photoUrl,
				company: contactRef.company,
			});
		}

		showSelector = false;
	}

	function handleSearch(query: string): Promise<ContactSummary[]> {
		return contactsStore.searchContacts(query);
	}

	function handleRemove() {
		onResponsiblePersonChange(null);
	}

	function handleOpenContact() {
		if (responsiblePerson?.contactId) {
			// Open contacts app with this contact
			window.open(`/contacts/${responsiblePerson.contactId}`, '_blank');
		}
	}
</script>

<div class="responsible-person-selector">
	{#if responsiblePerson}
		<!-- Selected Person Display -->
		<div class="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
			<ContactAvatar
				photoUrl={responsiblePerson.photoUrl}
				name={responsiblePerson.name || responsiblePerson.email}
				size="sm"
			/>

			<div class="flex-1 min-w-0">
				<div class="text-sm font-medium text-foreground truncate">
					{responsiblePerson.name || responsiblePerson.email}
				</div>
				{#if responsiblePerson.name && responsiblePerson.email}
					<div class="text-xs text-muted-foreground truncate">
						{responsiblePerson.email}
					</div>
				{/if}
				{#if responsiblePerson.company}
					<div class="text-xs text-muted-foreground truncate">
						{responsiblePerson.company}
					</div>
				{/if}
			</div>

			<!-- Open Contact Button (only if linked to contact) -->
			{#if responsiblePerson.contactId}
				<button
					type="button"
					onclick={handleOpenContact}
					class="
						p-1.5 rounded-md
						text-gray-400 hover:text-blue-500
						hover:bg-blue-50 dark:hover:bg-blue-900/20
						transition-colors
					"
					title="Kontakt öffnen"
				>
					<ArrowSquareOut size={16} />
				</button>
			{/if}

			<!-- Remove Button -->
			<button
				type="button"
				onclick={handleRemove}
				class="
					p-1.5 rounded-md
					text-gray-400 hover:text-red-500
					hover:bg-red-50 dark:hover:bg-red-900/20
					transition-colors
				"
				title="Entfernen"
				{disabled}
			>
				<X size={16} />
			</button>
		</div>
	{:else if showSelector}
		<!-- Contact Selector -->
		<ContactSelector
			selectedContacts={[]}
			onContactsChange={handleContactsChange}
			onSearch={handleSearch}
			allowManualEntry={true}
			placeholder="Person suchen oder E-Mail eingeben..."
			addLabel="Verantwortlich"
			searchPlaceholder="Name oder E-Mail..."
			isAvailable={contactsAvailable ?? false}
			{disabled}
			singleSelect={true}
		/>
		<button
			type="button"
			onclick={() => (showSelector = false)}
			class="mt-2 text-sm text-muted-foreground hover:text-foreground"
		>
			Abbrechen
		</button>
	{:else}
		<!-- Add Button -->
		<button
			type="button"
			onclick={() => (showSelector = true)}
			class="
				w-full flex items-center justify-center gap-2
				px-4 py-2.5 rounded-lg
				border-2 border-dashed border-gray-200 dark:border-gray-700
				text-sm text-muted-foreground
				hover:border-gray-300 dark:hover:border-gray-600
				hover:text-foreground
				transition-colors
			"
			{disabled}
		>
			<User size={16} />
			Verantwortliche Person hinzufügen
		</button>
	{/if}
</div>

<style>
	.responsible-person-selector {
		position: relative;
	}
</style>
