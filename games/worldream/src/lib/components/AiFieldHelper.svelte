<script lang="ts">
	import type { NodeKind } from '$lib/types/content';

	interface Props {
		field: string;
		kind: NodeKind;
		value: string;
		onUpdate: (value: string) => void;
		placeholder?: string;
		rows?: number;
		label: string;
	}

	let {
		field,
		kind,
		value = $bindable(),
		onUpdate,
		placeholder,
		rows = 3,
		label,
	}: Props = $props();

	let generating = $state(false);
	let showSuggestions = $state(false);
	let suggestions = $state<string[]>([]);

	async function generateSuggestions() {
		if (generating) return;

		generating = true;
		showSuggestions = false;

		try {
			const response = await fetch('/api/ai/suggest', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					field,
					context: { kind, existingContent: { [field]: value } },
				}),
			});

			if (response.ok) {
				const data = await response.json();
				suggestions = data.suggestions || [];
				showSuggestions = suggestions.length > 0;
			}
		} catch (err) {
			console.error('Failed to generate suggestions:', err);
		} finally {
			generating = false;
		}
	}

	async function enhanceContent() {
		if (generating || !value.trim()) return;

		generating = true;

		try {
			const response = await fetch('/api/ai/enhance', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					content: { [field]: value },
					kind,
					instruction: `Verbessere und erweitere dieses ${label} Feld. Behalte den Kern bei, aber füge Details und Tiefe hinzu.`,
				}),
			});

			if (response.ok) {
				const data = await response.json();
				if (data.content?.[field]) {
					value = data.content[field];
					onUpdate(value);
				}
			}
		} catch (err) {
			console.error('Failed to enhance content:', err);
		} finally {
			generating = false;
		}
	}

	function applySuggestion(suggestion: string) {
		value = value ? `${value}\n\n${suggestion}` : suggestion;
		onUpdate(value);
		showSuggestions = false;
	}
</script>

<div class="space-y-2">
	<div class="flex items-center justify-between">
		<label for={field} class="block text-sm font-medium text-slate-700">
			{label}
		</label>
		<div class="flex space-x-1">
			<button
				type="button"
				onclick={generateSuggestions}
				disabled={generating}
				title="Vorschläge generieren"
				class="p-1 text-violet-600 hover:text-violet-500 disabled:opacity-50"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
					/>
				</svg>
			</button>
			{#if value}
				<button
					type="button"
					onclick={enhanceContent}
					disabled={generating}
					title="Mit KI verbessern"
					class="p-1 text-violet-600 hover:text-violet-500 disabled:opacity-50"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 10V3L4 14h7v7l9-11h-7z"
						/>
					</svg>
				</button>
			{/if}
		</div>
	</div>

	<textarea
		id={field}
		bind:value
		oninput={() => onUpdate(value)}
		{rows}
		{placeholder}
		disabled={generating}
		class="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-theme-primary-500 focus:ring-theme-primary-500 disabled:opacity-50 sm:text-sm"
	></textarea>

	{#if showSuggestions && suggestions.length > 0}
		<div class="mt-2 rounded-md bg-violet-50 p-3">
			<p class="mb-2 text-xs font-medium text-violet-900">KI-Vorschläge:</p>
			<div class="space-y-2">
				{#each suggestions as suggestion}
					<button
						type="button"
						onclick={() => applySuggestion(suggestion)}
						class="block w-full rounded border border-violet-200 bg-white p-2 text-left text-sm hover:bg-violet-100"
					>
						{suggestion}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	{#if generating}
		<p class="text-xs text-slate-500">KI arbeitet...</p>
	{/if}
</div>
