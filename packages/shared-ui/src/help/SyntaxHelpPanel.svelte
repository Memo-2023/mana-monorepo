<script lang="ts">
	import { Hash, At, Calendar, Clock, ArrowFatLineRight } from '@mana/shared-icons';
	import type { SyntaxGroup, SyntaxColor } from './types';

	interface Props {
		/** Syntax groups to display */
		groups: SyntaxGroup[];
		/** Show live example at the bottom */
		showLiveExample?: boolean;
		/** Custom live example */
		liveExample?: {
			text: string;
			highlights: Array<{
				type: 'text' | 'tag' | 'reference' | 'date' | 'time' | 'priority';
				content: string;
			}>;
		};
		/** Intro text shown at the top */
		introText?: string;
		/** Compact mode for smaller displays */
		compact?: boolean;
	}

	let {
		groups,
		showLiveExample = true,
		liveExample,
		introText = 'Erstelle Einträge mit natürlicher Sprache. Schreibe einfach los – die InputBar erkennt automatisch Daten, Zeiten, Tags und mehr.',
		compact = false,
	}: Props = $props();

	// Default icons for common patterns
	const patternIcons: Record<string, typeof Hash> = {
		'#tag': Hash,
		'@name': At,
		Datum: Calendar,
		Uhrzeit: Clock,
		Priorität: ArrowFatLineRight,
	};

	function getPatternIcon(pattern: string) {
		return patternIcons[pattern] || Hash;
	}

	// Default live example if none provided
	const defaultLiveExample = {
		text: 'Meeting mit Team morgen 14:00 @arbeit #wichtig',
		highlights: [
			{ type: 'text' as const, content: 'Meeting mit Team ' },
			{ type: 'date' as const, content: 'morgen' },
			{ type: 'text' as const, content: ' ' },
			{ type: 'time' as const, content: '14:00' },
			{ type: 'text' as const, content: ' ' },
			{ type: 'reference' as const, content: '@arbeit' },
			{ type: 'text' as const, content: ' ' },
			{ type: 'tag' as const, content: '#wichtig' },
		],
	};

	const example = $derived(liveExample ?? defaultLiveExample);
</script>

<div class="syntax-panel" class:compact>
	{#if introText && !compact}
		<p class="intro-text">{introText}</p>
	{/if}

	{#each groups as group}
		<div class="syntax-group">
			<h3 class="group-title">{group.title}</h3>
			<div class="group-items">
				{#each group.items as item}
					{@const Icon = item.icon ?? getPatternIcon(item.pattern)}
					<div class="syntax-item">
						<div class="syntax-icon" data-color={item.color}>
							<Icon size={compact ? 16 : 20} weight="bold" />
						</div>
						<div class="syntax-content">
							<div class="syntax-header">
								<code class="pattern" data-color={item.color}>{item.pattern}</code>
								<span class="syntax-desc">{item.description}</span>
							</div>
							<div class="syntax-examples">
								{#each item.examples as ex}
									{#if typeof ex === 'string'}
										<span class="example-tag" data-color={item.color}>{ex}</span>
									{:else}
										<span class="example-tag" data-color={ex.color ?? item.color}>
											{ex.text}
											{#if ex.label}
												<span class="example-label">{ex.label}</span>
											{/if}
										</span>
									{/if}
								{/each}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/each}

	{#if showLiveExample && !compact}
		<div class="live-example">
			<div class="live-label">Beispiel-Eingabe</div>
			<div class="live-input">
				{#each example.highlights as hl}
					<span class="hl-{hl.type}">{hl.content}</span>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.syntax-panel {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.intro-text {
		font-size: 0.9375rem;
		line-height: 1.5;
		color: hsl(var(--color-muted-foreground));
		margin: 0;
	}

	.syntax-group {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}

	.group-title {
		font-size: 0.8125rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
		margin: 0;
	}

	.group-items {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.syntax-item {
		display: flex;
		gap: 0.75rem;
		padding: 0.75rem;
		background: hsl(var(--color-muted) / 0.3);
		border-radius: var(--radius-md);
		transition: background 0.15s ease;
	}

	.syntax-item:hover {
		background: hsl(var(--color-muted) / 0.5);
	}

	.syntax-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: var(--radius-sm);
		flex-shrink: 0;
	}

	.syntax-icon[data-color='primary'] {
		background: hsl(var(--color-primary) / 0.15);
		color: hsl(var(--color-primary));
	}

	.syntax-icon[data-color='success'] {
		background: hsl(var(--color-success) / 0.15);
		color: hsl(var(--color-success));
	}

	.syntax-icon[data-color='accent'] {
		background: hsl(var(--color-accent, 262 83% 58%) / 0.15);
		color: hsl(var(--color-accent, 262 83% 58%));
	}

	.syntax-icon[data-color='error'] {
		background: hsl(var(--color-error) / 0.15);
		color: hsl(var(--color-error));
	}

	.syntax-icon[data-color='warning'] {
		background: hsl(var(--color-warning, 25 95% 53%) / 0.15);
		color: hsl(var(--color-warning, 25 95% 53%));
	}

	.syntax-icon[data-color='warning-soft'] {
		background: hsl(var(--color-warning, 48 96% 53%) / 0.15);
		color: hsl(var(--color-warning, 48 96% 53%));
	}

	.syntax-content {
		flex: 1;
		min-width: 0;
	}

	.syntax-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.375rem;
	}

	.pattern {
		font-size: 0.9375rem;
		font-weight: 600;
		padding: 0.1875rem 0.5rem;
		border-radius: var(--radius-sm);
		background: transparent;
	}

	.pattern[data-color='primary'] {
		color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.15);
	}

	.pattern[data-color='success'] {
		color: hsl(var(--color-success));
		background: hsl(var(--color-success) / 0.15);
	}

	.pattern[data-color='accent'] {
		color: hsl(var(--color-accent, 262 83% 58%));
		background: hsl(var(--color-accent, 262 83% 58%) / 0.15);
	}

	.pattern[data-color='error'] {
		color: hsl(var(--color-error));
		background: hsl(var(--color-error) / 0.15);
	}

	.pattern[data-color='warning'] {
		color: hsl(var(--color-warning, 25 95% 53%));
		background: hsl(var(--color-warning, 25 95% 53%) / 0.15);
	}

	.pattern[data-color='warning-soft'] {
		color: hsl(var(--color-warning, 48 96% 53%));
		background: hsl(var(--color-warning, 48 96% 53%) / 0.15);
	}

	.syntax-desc {
		font-size: 0.9375rem;
		color: hsl(var(--color-muted-foreground));
	}

	.syntax-examples {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.example-tag {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		font-weight: 500;
		padding: 0.25rem 0.625rem;
		border-radius: 9999px;
	}

	.example-tag[data-color='primary'] {
		color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.1);
	}

	.example-tag[data-color='success'] {
		color: hsl(var(--color-success));
		background: hsl(var(--color-success) / 0.1);
	}

	.example-tag[data-color='accent'] {
		color: hsl(var(--color-accent, 262 83% 58%));
		background: hsl(var(--color-accent, 262 83% 58%) / 0.1);
	}

	.example-tag[data-color='error'] {
		color: hsl(var(--color-error));
		background: hsl(var(--color-error) / 0.1);
	}

	.example-tag[data-color='warning'] {
		color: hsl(var(--color-warning, 25 95% 53%));
		background: hsl(var(--color-warning, 25 95% 53%) / 0.1);
	}

	.example-tag[data-color='warning-soft'] {
		color: hsl(var(--color-warning, 48 96% 53%));
		background: hsl(var(--color-warning, 48 96% 53%) / 0.1);
	}

	.example-label {
		font-size: 0.625rem;
		opacity: 0.7;
	}

	/* Live Example */
	.live-example {
		padding: 1rem;
		background: hsl(var(--color-muted) / 0.5);
		border-radius: var(--radius-lg);
		border: 1px dashed hsl(var(--color-border));
	}

	.live-label {
		font-size: 0.6875rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
		margin-bottom: 0.625rem;
	}

	.live-input {
		font-size: 0.9375rem;
		font-weight: 500;
		line-height: 1.6;
		color: hsl(var(--color-foreground));
	}

	.live-input :global(.hl-text) {
		color: hsl(var(--color-foreground));
	}

	.live-input :global(.hl-tag) {
		color: hsl(var(--color-primary));
		font-weight: 600;
	}

	.live-input :global(.hl-reference) {
		color: hsl(var(--color-success));
		font-weight: 600;
	}

	.live-input :global(.hl-date),
	.live-input :global(.hl-time) {
		color: hsl(var(--color-accent, 262 83% 58%));
		font-weight: 600;
	}

	.live-input :global(.hl-priority) {
		color: hsl(var(--color-error));
		font-weight: 600;
	}

	/* Compact mode */
	.syntax-panel.compact {
		gap: 1rem;
	}

	.syntax-panel.compact .syntax-item {
		padding: 0.5rem 0.625rem;
		gap: 0.5rem;
	}

	.syntax-panel.compact .syntax-icon {
		width: 28px;
		height: 28px;
	}

	.syntax-panel.compact .syntax-header {
		margin-bottom: 0.25rem;
	}

	.syntax-panel.compact .pattern {
		font-size: 0.6875rem;
	}

	.syntax-panel.compact .syntax-desc {
		font-size: 0.75rem;
	}

	.syntax-panel.compact .example-tag {
		font-size: 0.625rem;
		padding: 0.125rem 0.375rem;
	}

	/* Responsive */
	@media (max-width: 480px) {
		.syntax-item {
			flex-direction: column;
			gap: 0.5rem;
		}

		.syntax-icon {
			width: 28px;
			height: 28px;
		}

		.syntax-header {
			flex-wrap: wrap;
		}

		.live-example {
			padding: 0.75rem;
		}

		.live-input {
			font-size: 0.875rem;
		}
	}
</style>
