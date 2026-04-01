<!--
  Calc — Split-Screen AppView
  Simple calculator with expression input and history.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import type { LocalCalculation } from './types';

	let calculations = $state<LocalCalculation[]>([]);
	let expression = $state('');
	let result = $state('');

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalCalculation>('calculations')
				.toArray()
				.then((all) => all.filter((c) => !c.deletedAt));
		}).subscribe((val) => {
			calculations = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	const recent = $derived(
		[...calculations]
			.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
			.slice(0, 10)
	);

	function evaluate() {
		if (!expression.trim()) return;
		try {
			// Basic safe eval for simple math expressions
			const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, '');
			const evalResult = Function('"use strict"; return (' + sanitized + ')')();
			result = String(evalResult);
		} catch {
			result = 'Fehler';
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			evaluate();
		}
	}
</script>

<div class="flex h-full flex-col gap-4 p-4">
	<!-- Display -->
	<div class="rounded-md bg-white/5 p-3 text-right">
		<p class="text-xs text-white/40">{expression || ' '}</p>
		<p class="text-2xl font-light text-white/90">{result || '0'}</p>
	</div>

	<!-- Input -->
	<input
		bind:value={expression}
		onkeydown={handleKeydown}
		placeholder="Ausdruck eingeben..."
		class="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-right text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
	/>

	<!-- Quick buttons -->
	<div class="grid grid-cols-4 gap-1">
		{#each ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+'] as key}
			<button
				onclick={() => {
					if (key === '=') evaluate();
					else expression += key;
				}}
				class="rounded-md bg-white/5 py-2 text-sm text-white/70 transition-colors hover:bg-white/10
					{key === '=' ? 'bg-blue-500/20 text-blue-300' : ''}"
			>
				{key}
			</button>
		{/each}
	</div>

	<!-- History -->
	{#if recent.length > 0}
		<div class="flex-1 overflow-auto">
			<h3 class="mb-1 text-xs font-medium text-white/50">Verlauf</h3>
			{#each recent as calc (calc.id)}
				<div class="flex items-center justify-between py-1 text-xs">
					<span class="text-white/40">{calc.expression}</span>
					<span class="text-white/60">= {calc.result}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>
