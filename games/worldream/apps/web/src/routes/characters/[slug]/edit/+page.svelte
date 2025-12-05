<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { ContentNode, ContentData } from '$lib/types/content';

	let { data } = $props();

	if (!data.user) {
		goto('/auth/login');
	}

	const slug = $page.params.slug;

	let node = $state<ContentNode | null>(null);
	let title = $state('');
	let summary = $state('');
	let visibility = $state<'private' | 'shared' | 'public'>('private');
	let tags = $state('');

	// Content fields
	let appearance = $state('');
	let lore = $state('');
	let voice_style = $state('');
	let capabilities = $state('');
	let constraints = $state('');
	let motivations = $state('');
	let secrets = $state('');
	let relationships_text = $state('');
	let inventory_text = $state('');
	let timeline_text = $state('');
	let state_text = $state('');

	let loading = $state(true);
	let saving = $state(false);
	let error = $state<string | null>(null);

	async function loadCharacter() {
		try {
			const response = await fetch(`/api/nodes/${slug}`);
			if (!response.ok) {
				if (response.status === 404) {
					throw new Error('Charakter nicht gefunden');
				}
				throw new Error('Fehler beim Laden des Charakters');
			}
			const loadedNode = await response.json();
			node = loadedNode;

			// Check ownership
			if (!node || node.owner_id !== data.user?.id) {
				throw new Error('Du hast keine Berechtigung, diesen Charakter zu bearbeiten');
			}

			// Populate form fields
			title = node.title;
			summary = node.summary || '';
			visibility = node.visibility;
			tags = node.tags?.join(', ') || '';

			// Content fields
			appearance = node.content.appearance || '';
			lore = node.content.lore || '';
			voice_style = node.content.voice_style || '';
			capabilities = node.content.capabilities || '';
			constraints = node.content.constraints || '';
			motivations = node.content.motivations || '';
			secrets = node.content.secrets || '';
			relationships_text = node.content.relationships_text || '';
			inventory_text = node.content.inventory_text || '';
			timeline_text = node.content.timeline_text || '';
			state_text = node.content.state_text || '';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
		} finally {
			loading = false;
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		saving = true;
		error = null;

		try {
			const content: ContentData = {
				appearance,
				lore,
				voice_style,
				capabilities,
				constraints,
				motivations,
				secrets,
				relationships_text,
				inventory_text,
				timeline_text,
				state_text,
			};

			const response = await fetch(`/api/nodes/${slug}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title,
					summary,
					visibility,
					tags: tags
						.split(',')
						.map((t) => t.trim())
						.filter(Boolean),
					content,
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to update character');
			}

			goto(`/characters/${slug}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
		} finally {
			saving = false;
		}
	}

	$effect(() => {
		loadCharacter();
	});
</script>

<div class="mx-auto max-w-4xl">
	{#if loading}
		<div class="py-12 text-center">
			<p class="text-theme-text-secondary">Lade Charakter...</p>
		</div>
	{:else if error && !node}
		<div class="bg-theme-error/10 rounded-md p-4">
			<p class="text-sm text-theme-error">{error}</p>
			<a
				href="/characters"
				class="mt-2 inline-block text-sm text-theme-primary-600 hover:text-theme-primary-500"
			>
				Zurück zur Übersicht
			</a>
		</div>
	{:else}
		<div class="mb-6">
			<h1 class="text-2xl font-bold text-theme-text-primary">Charakter bearbeiten</h1>
			<p class="mt-1 text-sm text-theme-text-secondary">
				Bearbeite die Details von {title}
			</p>
		</div>

		<form onsubmit={handleSubmit} class="space-y-6 rounded-lg bg-theme-surface p-6 shadow">
			{#if error}
				<div class="bg-theme-error/10 rounded-md p-4">
					<p class="text-sm text-theme-error">{error}</p>
				</div>
			{/if}

			<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
				<div>
					<label for="title" class="block text-sm font-medium text-theme-text-primary">
						Name
					</label>
					<input
						type="text"
						id="title"
						bind:value={title}
						required
						class="border-theme-border-default mt-1 block w-full rounded-md shadow-sm focus:border-theme-primary-500 focus:ring-theme-primary-500 sm:text-sm"
					/>
				</div>

				<div>
					<label for="visibility" class="block text-sm font-medium text-theme-text-primary">
						Sichtbarkeit
					</label>
					<select
						id="visibility"
						bind:value={visibility}
						class="border-theme-border-default mt-1 block w-full rounded-md shadow-sm focus:border-theme-primary-500 focus:ring-theme-primary-500 sm:text-sm"
					>
						<option value="private">Privat</option>
						<option value="shared">Geteilt</option>
						<option value="public">Öffentlich</option>
					</select>
				</div>
			</div>

			<div>
				<label for="summary" class="block text-sm font-medium text-theme-text-primary">
					Kurzbeschreibung
				</label>
				<textarea
					id="summary"
					bind:value={summary}
					rows="2"
					class="border-theme-border-default mt-1 block w-full rounded-md shadow-sm focus:border-theme-primary-500 focus:ring-theme-primary-500 sm:text-sm"
				></textarea>
			</div>

			<div>
				<label for="tags" class="block text-sm font-medium text-theme-text-primary">
					Tags (kommagetrennt)
				</label>
				<input
					type="text"
					id="tags"
					bind:value={tags}
					placeholder="fantasy, held, magier"
					class="border-theme-border-default mt-1 block w-full rounded-md shadow-sm focus:border-theme-primary-500 focus:ring-theme-primary-500 sm:text-sm"
				/>
			</div>

			<div class="border-t border-theme-border-subtle pt-6">
				<h3 class="mb-4 text-lg font-medium text-theme-text-primary">Charakter-Details</h3>

				<div class="space-y-6">
					<div>
						<label for="appearance" class="block text-sm font-medium text-theme-text-primary">
							Aussehen
						</label>
						<textarea
							id="appearance"
							bind:value={appearance}
							rows="3"
							class="border-theme-border-default mt-1 block w-full rounded-md shadow-sm focus:border-theme-primary-500 focus:ring-theme-primary-500 sm:text-sm"
						></textarea>
					</div>

					<div>
						<label for="lore" class="block text-sm font-medium text-theme-text-primary">
							Hintergrundgeschichte
						</label>
						<textarea
							id="lore"
							bind:value={lore}
							rows="4"
							class="border-theme-border-default mt-1 block w-full rounded-md shadow-sm focus:border-theme-primary-500 focus:ring-theme-primary-500 sm:text-sm"
						></textarea>
					</div>

					<div>
						<label for="voice_style" class="block text-sm font-medium text-theme-text-primary">
							Sprechstil / Stimme
						</label>
						<textarea
							id="voice_style"
							bind:value={voice_style}
							rows="2"
							class="border-theme-border-default mt-1 block w-full rounded-md shadow-sm focus:border-theme-primary-500 focus:ring-theme-primary-500 sm:text-sm"
						></textarea>
					</div>

					<div>
						<label for="capabilities" class="block text-sm font-medium text-theme-text-primary">
							Fähigkeiten
						</label>
						<textarea
							id="capabilities"
							bind:value={capabilities}
							rows="3"
							class="border-theme-border-default mt-1 block w-full rounded-md shadow-sm focus:border-theme-primary-500 focus:ring-theme-primary-500 sm:text-sm"
						></textarea>
					</div>

					<div>
						<label for="constraints" class="block text-sm font-medium text-theme-text-primary">
							Grenzen & Regeln
						</label>
						<textarea
							id="constraints"
							bind:value={constraints}
							rows="2"
							class="border-theme-border-default mt-1 block w-full rounded-md shadow-sm focus:border-theme-primary-500 focus:ring-theme-primary-500 sm:text-sm"
						></textarea>
					</div>

					<div>
						<label for="motivations" class="block text-sm font-medium text-theme-text-primary">
							Motivationen & Ziele
						</label>
						<textarea
							id="motivations"
							bind:value={motivations}
							rows="3"
							class="border-theme-border-default mt-1 block w-full rounded-md shadow-sm focus:border-theme-primary-500 focus:ring-theme-primary-500 sm:text-sm"
						></textarea>
					</div>

					<div>
						<label for="secrets" class="block text-sm font-medium text-theme-text-primary">
							Geheimnisse
						</label>
						<textarea
							id="secrets"
							bind:value={secrets}
							rows="2"
							placeholder="Verborgene Informationen, die nicht jeder kennt"
							class="border-theme-border-default mt-1 block w-full rounded-md shadow-sm focus:border-theme-primary-500 focus:ring-theme-primary-500 sm:text-sm"
						></textarea>
					</div>

					<div>
						<label
							for="relationships_text"
							class="block text-sm font-medium text-theme-text-primary"
						>
							Beziehungen
						</label>
						<textarea
							id="relationships_text"
							bind:value={relationships_text}
							rows="3"
							placeholder="Beziehungen zu anderen Charakteren (nutze @slug für Referenzen)"
							class="border-theme-border-default mt-1 block w-full rounded-md shadow-sm focus:border-theme-primary-500 focus:ring-theme-primary-500 sm:text-sm"
						></textarea>
					</div>

					<div>
						<label for="inventory_text" class="block text-sm font-medium text-theme-text-primary">
							Inventar / Besitz
						</label>
						<textarea
							id="inventory_text"
							bind:value={inventory_text}
							rows="3"
							placeholder="z.B. 'Trägt @excalibur und @schutzamulett'"
							class="border-theme-border-default mt-1 block w-full rounded-md shadow-sm focus:border-theme-primary-500 focus:ring-theme-primary-500 sm:text-sm"
						></textarea>
						<p class="mt-1 text-xs text-theme-text-secondary">
							Verwende @objekt-slug um Objekte zu verlinken. Diese werden automatisch auf der
							Charakterseite angezeigt.
						</p>
					</div>

					<div>
						<label for="timeline_text" class="block text-sm font-medium text-theme-text-primary">
							Zeitlinie / Wichtige Ereignisse
						</label>
						<textarea
							id="timeline_text"
							bind:value={timeline_text}
							rows="3"
							placeholder="Chronologie wichtiger Ereignisse"
							class="border-theme-border-default mt-1 block w-full rounded-md shadow-sm focus:border-theme-primary-500 focus:ring-theme-primary-500 sm:text-sm"
						></textarea>
					</div>

					<div>
						<label for="state_text" class="block text-sm font-medium text-theme-text-primary">
							Aktueller Zustand
						</label>
						<textarea
							id="state_text"
							bind:value={state_text}
							rows="2"
							placeholder="Wo befindet sich der Charakter gerade? Was ist sein aktueller Status?"
							class="border-theme-border-default mt-1 block w-full rounded-md shadow-sm focus:border-theme-primary-500 focus:ring-theme-primary-500 sm:text-sm"
						></textarea>
					</div>
				</div>
			</div>

			<div class="flex justify-end space-x-3">
				<a
					href="/characters/{slug}"
					class="border-theme-border-default rounded-md border bg-theme-surface px-4 py-2 text-sm font-medium text-theme-text-primary shadow-sm hover:bg-theme-interactive-hover"
				>
					Abbrechen
				</a>
				<button
					type="submit"
					disabled={saving}
					class="rounded-md border border-transparent bg-theme-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-theme-primary-700 disabled:opacity-50"
				>
					{saving ? 'Wird gespeichert...' : 'Änderungen speichern'}
				</button>
			</div>
		</form>
	{/if}
</div>
