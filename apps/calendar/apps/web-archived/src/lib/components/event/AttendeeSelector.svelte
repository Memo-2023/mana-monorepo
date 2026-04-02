<script lang="ts">
	import type { EventAttendee, AttendeeStatus } from '@calendar/shared';
	import type { ContactSummary, ContactOrManual, ManualContactEntry } from '@manacore/shared-types';
	import { ContactSelector, ContactAvatar } from '@manacore/shared-ui';
	import { Check, X, Question, Clock, CaretDown } from '@manacore/shared-icons';
	import { contactsStore } from '$lib/stores/contacts.svelte';

	interface Props {
		attendees: EventAttendee[];
		onAttendeesChange: (attendees: EventAttendee[]) => void;
		disabled?: boolean;
	}

	let { attendees, onAttendeesChange, disabled = false }: Props = $props();

	let contactsAvailable = $state<boolean | null>(null);
	let showStatusDropdown = $state<string | null>(null);

	// Check contacts availability on mount
	$effect(() => {
		contactsStore.checkAvailability().then((available) => {
			contactsAvailable = available;
		});
	});

	// Convert attendees to ContactOrManual format for the selector
	const selectedContacts = $derived<ContactOrManual[]>(
		attendees.map((a) => {
			if (a.contactId) {
				return {
					contactId: a.contactId,
					displayName: a.name || a.email,
					email: a.email,
					photoUrl: a.photoUrl,
					company: a.company,
					fetchedAt: new Date().toISOString(),
				};
			}
			// Manual entry
			return {
				email: a.email,
				name: a.name,
				isManual: true as const,
			};
		})
	);

	function handleContactsChange(contacts: ContactOrManual[]) {
		const newAttendees: EventAttendee[] = contacts.map((contact) => {
			if ('isManual' in contact && contact.isManual) {
				// Manual entry
				const manual = contact as ManualContactEntry;
				// Preserve existing status if email matches
				const existing = attendees.find((a) => a.email === manual.email);
				return {
					email: manual.email,
					name: manual.name,
					status: existing?.status || ('pending' as AttendeeStatus),
				};
			} else {
				// Contact reference
				const contactRef = contact as {
					contactId: string;
					displayName: string;
					email?: string;
					photoUrl?: string;
					company?: string;
				};
				// Preserve existing status if contactId or email matches
				const existing = attendees.find(
					(a) => a.contactId === contactRef.contactId || a.email === contactRef.email
				);
				return {
					email: contactRef.email || '',
					name: contactRef.displayName,
					status: existing?.status || ('pending' as AttendeeStatus),
					contactId: contactRef.contactId,
					photoUrl: contactRef.photoUrl,
					company: contactRef.company,
				};
			}
		});
		onAttendeesChange(newAttendees);
	}

	function handleSearch(query: string): Promise<ContactSummary[]> {
		return contactsStore.searchContacts(query);
	}

	function handleStatusChange(email: string, status: AttendeeStatus) {
		const updated = attendees.map((a) => (a.email === email ? { ...a, status } : a));
		onAttendeesChange(updated);
		showStatusDropdown = null;
	}

	function handleRemoveAttendee(email: string) {
		onAttendeesChange(attendees.filter((a) => a.email !== email));
	}

	function getStatusColor(status?: AttendeeStatus): string {
		switch (status) {
			case 'accepted':
				return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
			case 'declined':
				return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
			case 'tentative':
				return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
			default:
				return 'text-gray-500 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
		}
	}

	function getStatusLabel(status?: AttendeeStatus): string {
		switch (status) {
			case 'accepted':
				return 'Zugesagt';
			case 'declined':
				return 'Abgesagt';
			case 'tentative':
				return 'Vorbehaltlich';
			default:
				return 'Ausstehend';
		}
	}

	const statusOptions: { value: AttendeeStatus; label: string }[] = [
		{ value: 'pending', label: 'Ausstehend' },
		{ value: 'accepted', label: 'Zugesagt' },
		{ value: 'tentative', label: 'Vorbehaltlich' },
		{ value: 'declined', label: 'Abgesagt' },
	];
</script>

<div class="attendee-selector">
	<!-- Existing Attendees with Status -->
	{#if attendees.length > 0}
		<div class="space-y-2 mb-4">
			{#each attendees as attendee (attendee.email)}
				<div class="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
					<ContactAvatar
						photoUrl={attendee.photoUrl}
						name={attendee.name || attendee.email}
						size="sm"
					/>

					<div class="flex-1 min-w-0">
						<div class="text-sm font-medium text-foreground truncate">
							{attendee.name || attendee.email}
						</div>
						{#if attendee.name && attendee.email}
							<div class="text-xs text-muted-foreground truncate">
								{attendee.email}
							</div>
						{/if}
						{#if attendee.company}
							<div class="text-xs text-muted-foreground truncate">
								{attendee.company}
							</div>
						{/if}
					</div>

					<!-- Status Dropdown -->
					<div class="relative">
						<button
							type="button"
							onclick={() =>
								(showStatusDropdown =
									showStatusDropdown === attendee.email ? null : attendee.email)}
							class="
								flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium
								{getStatusColor(attendee.status)}
								hover:opacity-80 transition-opacity
							"
							{disabled}
						>
							{#if attendee.status === 'accepted'}
								<Check size={12} />
							{:else if attendee.status === 'declined'}
								<X size={12} />
							{:else if attendee.status === 'tentative'}
								<Question size={12} />
							{:else}
								<Clock size={12} />
							{/if}
							<span class="hidden sm:inline">{getStatusLabel(attendee.status)}</span>
							<CaretDown size={12} />
						</button>

						{#if showStatusDropdown === attendee.email}
							<div
								class="
									absolute right-0 top-full mt-1 z-50
									bg-white dark:bg-gray-800
									border border-gray-200 dark:border-gray-700
									rounded-lg shadow-lg
									py-1 min-w-[140px]
								"
							>
								{#each statusOptions as option (option.value)}
									<button
										type="button"
										onclick={() => handleStatusChange(attendee.email, option.value)}
										class="
											w-full flex items-center gap-2 px-3 py-1.5
											text-sm text-left
											hover:bg-gray-100 dark:hover:bg-gray-700
											{attendee.status === option.value ? 'bg-gray-50 dark:bg-gray-700/50' : ''}
										"
									>
										<span class="{getStatusColor(option.value)} p-0.5 rounded">
											{#if option.value === 'accepted'}
												<Check size={12} />
											{:else if option.value === 'declined'}
												<X size={12} />
											{:else if option.value === 'tentative'}
												<Question size={12} />
											{:else}
												<Clock size={12} />
											{/if}
										</span>
										{option.label}
									</button>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Remove Button -->
					<button
						type="button"
						onclick={() => handleRemoveAttendee(attendee.email)}
						class="
							p-1 rounded-md
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
			{/each}
		</div>
	{/if}

	<!-- Add New Attendees -->
	<ContactSelector
		{selectedContacts}
		onContactsChange={handleContactsChange}
		onSearch={handleSearch}
		allowManualEntry={true}
		placeholder="Teilnehmer hinzufügen..."
		addLabel="Teilnehmer"
		searchPlaceholder="Name oder E-Mail..."
		isAvailable={contactsAvailable ?? false}
		{disabled}
	/>
</div>

<style>
	.attendee-selector {
		position: relative;
	}
</style>
