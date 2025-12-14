<script lang="ts">
	import { Modal } from '../organisms';
	import { Keyboard, Hash, At, Calendar, Clock, ArrowFatLineRight } from '@manacore/shared-icons';

	interface Props {
		open: boolean;
		onClose: () => void;
		mode?: 'shortcuts' | 'syntax';
	}

	let { open, onClose, mode = 'shortcuts' }: Props = $props();

	const shortcuts = [
		{ keys: 'Enter', description: 'Ausgewähltes Item auswählen oder erstellen' },
		{ keys: '⌘/Ctrl + Enter', description: 'Direkt erstellen (ohne Auswahl)' },
		{ keys: 'Esc', description: 'Eingabe löschen und schließen' },
		{ keys: '↑ / ↓', description: 'In Ergebnissen navigieren' },
		{ keys: 'Rechtsklick', description: 'Einstellungen öffnen' },
	];

	const syntaxExamples = [
		{ icon: Hash, pattern: '#tag', description: 'Tag hinzufügen', example: '#arbeit #wichtig' },
		{
			icon: At,
			pattern: '@referenz',
			description: 'Kalender/Projekt zuweisen',
			example: '@privat @team',
		},
		{
			icon: Calendar,
			pattern: 'Datum',
			description: 'Datum festlegen',
			example: 'heute, morgen, montag, in 3 tagen',
		},
		{ icon: Clock, pattern: 'Zeit', description: 'Uhrzeit festlegen', example: '14:00, 9 uhr' },
		{
			icon: ArrowFatLineRight,
			pattern: 'Priorität',
			description: 'Priorität setzen',
			example: '!!! dringend, !! wichtig',
		},
	];
</script>

<Modal visible={open} {onClose} title={mode === 'shortcuts' ? 'Tastenkürzel' : 'Syntax-Hilfe'}>
	{#if mode === 'shortcuts'}
		<div class="help-content">
			<div class="shortcuts-list">
				{#each shortcuts as { keys, description }}
					<div class="shortcut-row">
						<kbd class="shortcut-keys">{keys}</kbd>
						<span class="shortcut-desc">{description}</span>
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<div class="help-content">
			<p class="help-intro">
				Du kannst natürliche Sprache verwenden, um schnell Einträge zu erstellen. Die InputBar
				erkennt automatisch Daten, Zeiten, Tags und mehr.
			</p>

			<div class="syntax-list">
				{#each syntaxExamples as { icon: Icon, pattern, description, example }}
					<div class="syntax-row">
						<div class="syntax-icon">
							<Icon size={18} />
						</div>
						<div class="syntax-info">
							<div class="syntax-pattern">
								<code>{pattern}</code>
								<span class="syntax-desc">{description}</span>
							</div>
							<div class="syntax-example">{example}</div>
						</div>
					</div>
				{/each}
			</div>

			<div class="help-example">
				<p class="example-label">Beispiel:</p>
				<code class="example-text">Meeting mit Team morgen 14:00 @arbeit #wichtig</code>
			</div>
		</div>
	{/if}
</Modal>

<style>
	.help-content {
		padding: 0.5rem 0;
	}

	.help-intro {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		margin-bottom: 1.25rem;
		line-height: 1.5;
	}

	.shortcuts-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.shortcut-row {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.shortcut-keys {
		min-width: 140px;
		padding: 0.375rem 0.625rem;
		font-size: 0.75rem;
		font-family: inherit;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
		border-radius: var(--radius-sm);
		color: hsl(var(--color-foreground));
		text-align: center;
	}

	.shortcut-desc {
		font-size: 0.875rem;
		color: hsl(var(--color-foreground));
	}

	.syntax-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.syntax-row {
		display: flex;
		gap: 0.75rem;
		align-items: flex-start;
	}

	.syntax-icon {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
		border-radius: var(--radius-md);
		flex-shrink: 0;
	}

	.syntax-info {
		flex: 1;
	}

	.syntax-pattern {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
	}

	.syntax-pattern code {
		font-size: 0.8125rem;
		font-weight: 600;
		color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.1);
		padding: 0.125rem 0.375rem;
		border-radius: var(--radius-sm);
	}

	.syntax-desc {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}

	.syntax-example {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		font-style: italic;
	}

	.help-example {
		margin-top: 1.5rem;
		padding: 1rem;
		background: hsl(var(--color-muted) / 0.5);
		border-radius: var(--radius-md);
	}

	.example-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
		margin-bottom: 0.5rem;
	}

	.example-text {
		display: block;
		font-size: 0.875rem;
		color: hsl(var(--color-foreground));
		background: transparent;
	}
</style>
