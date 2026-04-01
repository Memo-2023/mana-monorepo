<script lang="ts">
	/**
	 * QuickActionsWidget — Schnellzugriff-Buttons für häufige Aktionen.
	 *
	 * Navigiert direkt zu den jeweiligen App-Routen innerhalb der Unified App.
	 */

	const actions = [
		{
			href: '/todo',
			icon: '&#9989;',
			label: 'Neue Aufgabe',
			description: 'Aufgabe erstellen',
		},
		{
			href: '/calendar',
			icon: '&#128197;',
			label: 'Neuer Termin',
			description: 'Termin erstellen',
		},
		{
			href: '/contacts',
			icon: '&#128100;',
			label: 'Neuer Kontakt',
			description: 'Kontakt anlegen',
		},
		{
			href: '/context',
			icon: '&#128221;',
			label: 'Neue Notiz',
			description: 'Dokument erstellen',
		},
		{
			href: '/times',
			icon: '&#9201;',
			label: 'Timer starten',
			description: 'Zeiterfassung starten',
		},
	];
</script>

<div>
	<div class="mb-3">
		<h3 class="flex items-center gap-2 text-lg font-semibold">Schnellzugriff</h3>
	</div>

	<div class="space-y-1">
		{#each actions as action}
			<a
				href={action.href}
				class="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-surface-hover"
			>
				<span class="text-xl">{@html action.icon}</span>
				<div>
					<p class="text-sm font-medium">{action.label}</p>
					<p class="text-xs text-muted-foreground">{action.description}</p>
				</div>
			</a>
		{/each}
	</div>
</div>
