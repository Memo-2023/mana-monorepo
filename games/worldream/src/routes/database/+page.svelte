<script lang="ts">
	interface TableInfo {
		name: string;
		description: string;
		columns: ColumnInfo[];
		relationships: string[];
		policies: string[];
		indexes: string[];
	}

	interface ColumnInfo {
		name: string;
		type: string;
		constraints: string[];
		description: string;
	}

	// Database structure data
	const enums = [
		{
			name: 'node_kind',
			values: ['world', 'character', 'object', 'place', 'story'],
			description: 'Content-Arten',
		},
		{
			name: 'visibility_level',
			values: ['private', 'shared', 'public'],
			description: 'Sichtbarkeitsebenen',
		},
		{
			name: 'story_entry_type',
			values: ['narration', 'dialog', 'note'],
			description: 'Story-Eintragstypen',
		},
	];

	const tables: TableInfo[] = [
		{
			name: 'content_nodes',
			description:
				'Haupttabelle für alle Content-Entities (Welten, Charaktere, Orte, Objekte, Stories)',
			columns: [
				{ name: 'id', type: 'UUID', constraints: ['PK'], description: 'Eindeutige ID' },
				{ name: 'kind', type: 'node_kind', constraints: ['NOT NULL'], description: 'Content-Art' },
				{ name: 'slug', type: 'TEXT', constraints: ['UNIQUE'], description: 'URL-Identifier' },
				{ name: 'title', type: 'TEXT', constraints: ['NOT NULL'], description: 'Name' },
				{ name: 'summary', type: 'TEXT', constraints: [], description: 'Beschreibung' },
				{ name: 'owner_id', type: 'UUID', constraints: ['FK'], description: 'Besitzer' },
				{
					name: 'visibility',
					type: 'visibility_level',
					constraints: [],
					description: 'Sichtbarkeit',
				},
				{ name: 'world_slug', type: 'TEXT', constraints: ['FK'], description: 'Zugehörige Welt' },
				{ name: 'content', type: 'JSONB', constraints: [], description: 'Flexibler Content' },
				{ name: 'generation_prompt', type: 'TEXT', constraints: [], description: 'AI-Prompt' },
				{ name: 'generation_model', type: 'TEXT', constraints: [], description: 'AI-Modell' },
				{ name: 'image_url', type: 'TEXT', constraints: [], description: 'Hauptbild' },
				{
					name: 'search_tsv',
					type: 'tsvector',
					constraints: ['GENERATED'],
					description: 'Volltext-Suche',
				},
				{ name: 'created_at', type: 'TIMESTAMPTZ', constraints: [], description: 'Erstellt' },
				{ name: 'updated_at', type: 'TIMESTAMPTZ', constraints: [], description: 'Aktualisiert' },
			],
			relationships: ['auth.users (owner)', 'self-reference (world)'],
			policies: ['Visibility-based access', 'Owner full control'],
			indexes: ['kind', 'owner', 'visibility', 'world', 'tags (GIN)', 'search (GIN)'],
		},
		{
			name: 'story_entries',
			description: 'Einzelne Story-Einträge (Dialoge, Erzählung, Notizen)',
			columns: [
				{ name: 'id', type: 'UUID', constraints: ['PK'], description: 'ID' },
				{ name: 'story_slug', type: 'TEXT', constraints: ['FK', 'NOT NULL'], description: 'Story' },
				{
					name: 'position',
					type: 'INTEGER',
					constraints: ['NOT NULL'],
					description: 'Reihenfolge',
				},
				{ name: 'type', type: 'story_entry_type', constraints: ['NOT NULL'], description: 'Typ' },
				{ name: 'speaker_slug', type: 'TEXT', constraints: [], description: 'Sprecher' },
				{ name: 'body', type: 'TEXT', constraints: ['NOT NULL'], description: 'Inhalt' },
				{ name: 'created_by', type: 'UUID', constraints: ['FK'], description: 'Ersteller' },
				{ name: 'created_at', type: 'TIMESTAMPTZ', constraints: [], description: 'Erstellt' },
			],
			relationships: ['content_nodes (story)', 'auth.users (creator)'],
			policies: ['Inherits story visibility', 'Owner control'],
			indexes: ['story', 'speaker'],
		},
		{
			name: 'prompt_templates',
			description: 'Wiederverwendbare AI-Prompt-Vorlagen',
			columns: [
				{ name: 'id', type: 'UUID', constraints: ['PK'], description: 'ID' },
				{ name: 'owner_id', type: 'UUID', constraints: ['FK'], description: 'Ersteller' },
				{ name: 'world_slug', type: 'TEXT', constraints: ['FK'], description: 'Welt' },
				{ name: 'kind', type: 'TEXT', constraints: ['NOT NULL'], description: 'Ziel-Art' },
				{ name: 'title', type: 'TEXT', constraints: ['NOT NULL'], description: 'Name' },
				{
					name: 'prompt_template',
					type: 'TEXT',
					constraints: ['NOT NULL'],
					description: 'Template',
				},
				{ name: 'usage_count', type: 'INTEGER', constraints: [], description: 'Verwendungen' },
				{ name: 'is_public', type: 'BOOLEAN', constraints: [], description: 'Öffentlich' },
			],
			relationships: ['auth.users (owner)', 'content_nodes (world)'],
			policies: ['Own templates + public templates'],
			indexes: ['owner', 'world', 'kind', 'public'],
		},
		{
			name: 'node_images',
			description: 'Mehrere Bilder pro Content-Knoten',
			columns: [
				{ name: 'id', type: 'UUID', constraints: ['PK'], description: 'ID' },
				{ name: 'node_id', type: 'UUID', constraints: ['FK', 'NOT NULL'], description: 'Knoten' },
				{ name: 'image_url', type: 'TEXT', constraints: ['NOT NULL'], description: 'Bild-URL' },
				{ name: 'prompt', type: 'TEXT', constraints: [], description: 'AI-Prompt' },
				{ name: 'is_primary', type: 'BOOLEAN', constraints: [], description: 'Hauptbild' },
				{ name: 'sort_order', type: 'INTEGER', constraints: [], description: 'Sortierung' },
			],
			relationships: ['content_nodes (node)'],
			policies: ['Inherits node visibility'],
			indexes: ['node_id', 'is_primary', 'sort_order'],
		},
		{
			name: 'attachments',
			description: 'Dateianhänge für Content-Knoten',
			columns: [
				{ name: 'id', type: 'UUID', constraints: ['PK'], description: 'ID' },
				{ name: 'node_slug', type: 'TEXT', constraints: ['FK', 'NOT NULL'], description: 'Knoten' },
				{ name: 'kind', type: 'TEXT', constraints: ['CHECK'], description: 'Dateityp' },
				{ name: 'url', type: 'TEXT', constraints: ['NOT NULL'], description: 'Datei-URL' },
				{ name: 'notes', type: 'TEXT', constraints: [], description: 'Notizen' },
			],
			relationships: ['content_nodes (node)'],
			policies: ['Inherits node visibility'],
			indexes: ['node'],
		},
		{
			name: 'node_revisions',
			description: 'Versionierung von Content-Änderungen',
			columns: [
				{ name: 'id', type: 'UUID', constraints: ['PK'], description: 'ID' },
				{ name: 'node_id', type: 'UUID', constraints: ['FK', 'NOT NULL'], description: 'Knoten' },
				{ name: 'content_before', type: 'JSONB', constraints: [], description: 'Vorher' },
				{ name: 'content_after', type: 'JSONB', constraints: [], description: 'Nachher' },
				{ name: 'edited_by', type: 'UUID', constraints: ['FK'], description: 'Editor' },
				{ name: 'edited_at', type: 'TIMESTAMPTZ', constraints: [], description: 'Zeitpunkt' },
			],
			relationships: ['content_nodes (node)', 'auth.users (editor)'],
			policies: ['Inherits node visibility'],
			indexes: [],
		},
		{
			name: 'prompt_history',
			description: 'Historie der AI-Prompt-Ausführungen',
			columns: [
				{ name: 'id', type: 'UUID', constraints: ['PK'], description: 'ID' },
				{ name: 'user_id', type: 'UUID', constraints: ['FK'], description: 'Benutzer' },
				{ name: 'node_id', type: 'UUID', constraints: ['FK'], description: 'Knoten' },
				{ name: 'prompt', type: 'TEXT', constraints: ['NOT NULL'], description: 'Prompt' },
				{ name: 'response', type: 'JSONB', constraints: [], description: 'Antwort' },
				{ name: 'model', type: 'TEXT', constraints: [], description: 'Modell' },
			],
			relationships: ['auth.users (user)', 'content_nodes (node)'],
			policies: ['Own history only'],
			indexes: ['user', 'node'],
		},
	];

	const functions = [
		{ name: 'search_content_nodes', description: 'Full-Text-Suche mit Ranking' },
		{ name: 'increment_template_usage', description: 'Template-Verwendungszähler' },
		{ name: 'update_updated_at_column', description: 'Auto-Update Timestamps' },
		{ name: 'ensure_single_primary_image', description: 'Ein Hauptbild pro Knoten' },
	];

	let selectedTable = $state<string | null>(null);
	let viewMode = $state<'compact' | 'detailed'>('compact');
</script>

<div class="space-y-6">
	<!-- Header with toggle -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-theme-text-primary mb-2">Datenbankstruktur</h1>
			<p class="text-theme-text-secondary">
				{tables.length} Tabellen • {enums.length} Enums • {functions.length} Funktionen • RLS aktiviert
			</p>
		</div>
		<div class="flex items-center space-x-2">
			<button
				class="px-3 py-1 text-sm rounded-md transition-colors {viewMode === 'compact'
					? 'bg-theme-primary-600 text-white'
					: 'bg-theme-surface text-theme-text-secondary hover:text-theme-text-primary border border-theme-border-default'}"
				onclick={() => (viewMode = 'compact')}
			>
				Kompakt
			</button>
			<button
				class="px-3 py-1 text-sm rounded-md transition-colors {viewMode === 'detailed'
					? 'bg-theme-primary-600 text-white'
					: 'bg-theme-surface text-theme-text-secondary hover:text-theme-text-primary border border-theme-border-default'}"
				onclick={() => (viewMode = 'detailed')}
			>
				Detailliert
			</button>
		</div>
	</div>

	<!-- Tables Section - Now at the top -->
	<div class="space-y-4">
		<h2 class="text-2xl font-semibold text-theme-text-primary">Tabellen</h2>

		{#if viewMode === 'compact'}
			<!-- Compact Grid View -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each tables as table}
					<div
						class="bg-theme-surface rounded-lg border border-theme-border-default p-4 hover:border-theme-border-subtle transition-colors"
					>
						<div class="mb-3">
							<h3 class="font-mono font-semibold text-theme-text-primary mb-1">{table.name}</h3>
							<p class="text-sm text-theme-text-secondary line-clamp-2">{table.description}</p>
						</div>

						<!-- Spalten - immer sichtbar -->
						<div class="mb-4">
							<h4 class="text-sm font-medium text-theme-text-primary mb-2">
								Spalten ({table.columns.length})
							</h4>
							<div class="space-y-1">
								{#each table.columns as column}
									<div class="flex items-center justify-between text-xs">
										<div class="flex items-center space-x-2">
											<span class="font-mono text-theme-text-primary">{column.name}</span>
											{#each column.constraints as constraint}
												<span
													class="px-1 py-0.5 text-xs bg-theme-interactive-subtle text-theme-text-secondary rounded"
												>
													{constraint}
												</span>
											{/each}
										</div>
										<span class="text-theme-text-secondary">{column.type}</span>
									</div>
								{/each}
							</div>
						</div>

						<!-- Bottom info in drei nebeneinander -->
						<div class="grid grid-cols-3 gap-2 text-xs">
							<!-- Beziehungen -->
							<div>
								<h5 class="font-medium text-theme-text-primary mb-1">Beziehungen</h5>
								{#if table.relationships.length > 0}
									<div class="space-y-0.5">
										{#each table.relationships as rel}
											<div class="text-theme-text-secondary text-xs">• {rel}</div>
										{/each}
									</div>
								{:else}
									<div class="text-theme-text-tertiary">Keine</div>
								{/if}
							</div>

							<!-- Policies -->
							<div>
								<h5 class="font-medium text-theme-text-primary mb-1">Policies</h5>
								{#if table.policies.length > 0}
									<div class="space-y-0.5">
										{#each table.policies as policy}
											<div class="text-theme-text-secondary text-xs">• {policy}</div>
										{/each}
									</div>
								{:else}
									<div class="text-theme-text-tertiary">Keine</div>
								{/if}
							</div>

							<!-- Indizes -->
							<div>
								<h5 class="font-medium text-theme-text-primary mb-1">Indizes</h5>
								{#if table.indexes.length > 0}
									<div class="flex flex-wrap gap-1">
										{#each table.indexes as index}
											<span
												class="px-1 py-0.5 text-xs bg-theme-interactive-subtle text-theme-text-secondary rounded"
											>
												{index}
											</span>
										{/each}
									</div>
								{:else}
									<div class="text-theme-text-tertiary">Keine</div>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<!-- Detailed Table View -->
			<div class="space-y-4">
				{#each tables as table}
					<div
						class="bg-theme-surface rounded-lg border border-theme-border-default overflow-hidden"
					>
						<div class="p-4 border-b border-theme-border-subtle">
							<h3 class="font-mono font-semibold text-theme-text-primary mb-1">{table.name}</h3>
							<p class="text-sm text-theme-text-secondary">{table.description}</p>
						</div>

						<div class="overflow-x-auto">
							<table class="w-full text-sm">
								<thead class="bg-theme-subtle">
									<tr>
										<th class="text-left p-3 font-medium text-theme-text-primary">Spalte</th>
										<th class="text-left p-3 font-medium text-theme-text-primary">Typ</th>
										<th class="text-left p-3 font-medium text-theme-text-primary">Constraints</th>
										<th class="text-left p-3 font-medium text-theme-text-primary">Beschreibung</th>
									</tr>
								</thead>
								<tbody>
									{#each table.columns as column}
										<tr class="border-t border-theme-border-subtle">
											<td class="p-3 font-mono text-theme-text-primary">{column.name}</td>
											<td class="p-3 text-theme-text-secondary">{column.type}</td>
											<td class="p-3">
												{#each column.constraints as constraint}
													<span
														class="inline-block px-1.5 py-0.5 text-xs bg-theme-interactive-subtle text-theme-text-secondary rounded mr-1 mb-1"
													>
														{constraint}
													</span>
												{/each}
											</td>
											<td class="p-3 text-theme-text-secondary">{column.description}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>

						<div class="p-4 bg-theme-subtle grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
							{#if table.relationships.length > 0}
								<div>
									<h4 class="font-medium text-theme-text-primary mb-2">Beziehungen</h4>
									<div class="space-y-1">
										{#each table.relationships as rel}
											<div class="text-theme-text-secondary">• {rel}</div>
										{/each}
									</div>
								</div>
							{/if}

							{#if table.policies.length > 0}
								<div>
									<h4 class="font-medium text-theme-text-primary mb-2">RLS-Richtlinien</h4>
									<div class="space-y-1">
										{#each table.policies as policy}
											<div class="text-theme-text-secondary">• {policy}</div>
										{/each}
									</div>
								</div>
							{/if}

							{#if table.indexes.length > 0}
								<div>
									<h4 class="font-medium text-theme-text-primary mb-2">Indizes</h4>
									<div class="flex flex-wrap gap-1">
										{#each table.indexes as index}
											<span
												class="px-2 py-1 text-xs bg-theme-interactive-subtle text-theme-text-secondary rounded"
											>
												{index}
											</span>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Bottom sections in compact layout -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Enums -->
		<div>
			<h2 class="text-xl font-semibold text-theme-text-primary mb-3">Enumerations</h2>
			<div class="space-y-3">
				{#each enums as enumInfo}
					<div class="bg-theme-surface rounded-lg p-3 border border-theme-border-default">
						<h3 class="font-mono font-semibold text-theme-text-primary mb-1">{enumInfo.name}</h3>
						<p class="text-sm text-theme-text-secondary mb-2">{enumInfo.description}</p>
						<div class="flex flex-wrap gap-1">
							{#each enumInfo.values as value}
								<span
									class="inline-block px-2 py-1 text-xs bg-theme-primary-100 text-theme-primary-700 rounded"
								>
									{value}
								</span>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Functions & Features -->
		<div class="space-y-6">
			<!-- Functions -->
			<div>
				<h2 class="text-xl font-semibold text-theme-text-primary mb-3">Funktionen</h2>
				<div class="space-y-2">
					{#each functions as func}
						<div class="bg-theme-surface rounded-lg p-3 border border-theme-border-default">
							<h3 class="font-mono font-medium text-theme-text-primary">{func.name}()</h3>
							<p class="text-sm text-theme-text-secondary">{func.description}</p>
						</div>
					{/each}
				</div>
			</div>

			<!-- Key Features -->
			<div>
				<h2 class="text-xl font-semibold text-theme-text-primary mb-3">Haupt-Features</h2>
				<div class="grid grid-cols-2 gap-3">
					<div
						class="text-center p-3 bg-theme-surface rounded-lg border border-theme-border-default"
					>
						<div class="text-lg font-semibold text-theme-primary-600">FTS</div>
						<div class="text-xs text-theme-text-secondary">Full-Text Search</div>
					</div>
					<div
						class="text-center p-3 bg-theme-surface rounded-lg border border-theme-border-default"
					>
						<div class="text-lg font-semibold text-theme-primary-600">RLS</div>
						<div class="text-xs text-theme-text-secondary">Row Level Security</div>
					</div>
					<div
						class="text-center p-3 bg-theme-surface rounded-lg border border-theme-border-default"
					>
						<div class="text-lg font-semibold text-theme-primary-600">AI</div>
						<div class="text-xs text-theme-text-secondary">Integration</div>
					</div>
					<div
						class="text-center p-3 bg-theme-surface rounded-lg border border-theme-border-default"
					>
						<div class="text-lg font-semibold text-theme-primary-600">JSONB</div>
						<div class="text-xs text-theme-text-secondary">Flexible Content</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
