<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type { Contact } from '$lib/api/contacts';
	import { getDisplayName, getInitials } from '$lib/utils/contact-display';
	import { CONTACT_FIELD_LABELS, getMatchTypeLabel } from '$lib/constants/contact-fields';

	interface Props {
		isOpen: boolean;
		contacts: Contact[];
		matchType: 'email' | 'phone' | 'name';
		matchValue: string;
		onMerge: (primaryId: string, mergeIds: string[]) => void;
		onDismiss: () => void;
		onClose: () => void;
	}

	let { isOpen, contacts, matchType, matchValue, onMerge, onDismiss, onClose }: Props = $props();

	let selectedPrimaryId = $state<string | null>(null);
	let merging = $state(false);

	// Reset selection when modal opens
	$effect(() => {
		if (isOpen && contacts.length > 0) {
			selectedPrimaryId = contacts[0].id;
		}
	});

	function getFieldValue(contact: Contact, field: keyof Contact): string {
		const value = contact[field];
		if (value === null || value === undefined) return '-';
		if (typeof value === 'boolean') return value ? 'Ja' : 'Nein';
		return String(value);
	}

	async function handleMerge() {
		if (!selectedPrimaryId) return;
		merging = true;
		const mergeIds = contacts.filter((c) => c.id !== selectedPrimaryId).map((c) => c.id);
		onMerge(selectedPrimaryId, mergeIds);
		merging = false;
	}

	// Fields to display in comparison
	const comparisonFieldKeys: (keyof Contact)[] = [
		'firstName',
		'lastName',
		'email',
		'phone',
		'mobile',
		'company',
		'jobTitle',
		'city',
	];
	const comparisonFields = comparisonFieldKeys.map((key) => ({
		key,
		label: CONTACT_FIELD_LABELS[key] || key,
	}));
</script>

{#if isOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center">
		<!-- Backdrop -->
		<button
			type="button"
			class="absolute inset-0 bg-black/50"
			onclick={onClose}
			aria-label="Close modal"
		></button>

		<!-- Modal -->
		<div
			class="relative bg-card rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
		>
			<!-- Header -->
			<div class="p-6 border-b border-border">
				<h2 class="text-xl font-semibold text-foreground">Duplikate zusammenführen</h2>
				<p class="text-sm text-muted-foreground mt-1">
					{contacts.length} Kontakte gefunden mit gleicher {getMatchTypeLabel(matchType)}:
					<span class="font-medium">{matchValue}</span>
				</p>
			</div>

			<!-- Content -->
			<div class="flex-1 overflow-auto p-6">
				<p class="text-sm text-muted-foreground mb-4">
					Wähle den Hauptkontakt aus. Die Daten der anderen Kontakte werden ergänzt (leere Felder
					werden gefüllt).
				</p>

				<!-- Contact comparison table -->
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-border">
								<th class="text-left py-2 px-3 font-medium text-muted-foreground">Feld</th>
								{#each contacts as contact (contact.id)}
									<th class="text-left py-2 px-3">
										<label class="flex items-center gap-2 cursor-pointer">
											<input
												type="radio"
												name="primary"
												value={contact.id}
												bind:group={selectedPrimaryId}
												class="w-4 h-4 text-primary"
											/>
											<span class="flex items-center gap-2">
												<span
													class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium"
												>
													{getInitials(contact)}
												</span>
												<span class="font-medium text-foreground">
													{getDisplayName(contact)}
												</span>
											</span>
										</label>
									</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each comparisonFields as field (field.key)}
								<tr class="border-b border-border/50">
									<td class="py-2 px-3 text-muted-foreground">{field.label}</td>
									{#each contacts as contact (contact.id)}
										<td
											class="py-2 px-3 {selectedPrimaryId === contact.id
												? 'bg-primary-highlight'
												: ''}"
										>
											{getFieldValue(contact, field.key)}
										</td>
									{/each}
								</tr>
							{/each}
							<tr class="border-b border-border/50">
								<td class="py-2 px-3 text-muted-foreground">Erstellt am</td>
								{#each contacts as contact (contact.id)}
									<td
										class="py-2 px-3 {selectedPrimaryId === contact.id
											? 'bg-primary-highlight'
											: ''}"
									>
										{new Date(contact.createdAt).toLocaleDateString('de-DE')}
									</td>
								{/each}
							</tr>
							<tr>
								<td class="py-2 px-3 text-muted-foreground">Zuletzt geändert</td>
								{#each contacts as contact (contact.id)}
									<td
										class="py-2 px-3 {selectedPrimaryId === contact.id
											? 'bg-primary-highlight'
											: ''}"
									>
										{new Date(contact.updatedAt).toLocaleDateString('de-DE')}
									</td>
								{/each}
							</tr>
						</tbody>
					</table>
				</div>

				<!-- Info box -->
				<div class="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm">
					<p class="text-blue-800 dark:text-blue-200">
						<strong>Hinweis:</strong> Der ausgewählte Hauptkontakt wird beibehalten. Leere Felder werden
						mit Daten aus den anderen Kontakten gefüllt. Die anderen Kontakte werden gelöscht.
					</p>
				</div>
			</div>

			<!-- Footer -->
			<div class="p-6 border-t border-border flex justify-between">
				<button
					type="button"
					onclick={onDismiss}
					class="btn btn-ghost text-muted-foreground hover:text-foreground"
				>
					Kein Duplikat
				</button>
				<div class="flex gap-3">
					<button type="button" onclick={onClose} class="btn btn-secondary"> Abbrechen </button>
					<button
						type="button"
						onclick={handleMerge}
						disabled={!selectedPrimaryId || merging}
						class="btn btn-primary"
					>
						{#if merging}
							<span class="animate-spin mr-2">⏳</span>
						{/if}
						Zusammenführen
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.bg-primary-highlight {
		background-color: hsl(var(--primary) / 0.05);
	}
</style>
