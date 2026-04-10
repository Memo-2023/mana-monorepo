<!--
  Calc — Workbench ListView
  Simple calculator with expression input and history.
-->
<script lang="ts">
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import { db } from '$lib/data/database';
	import type { LocalCalculation } from './types';

	const calcQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalCalculation>('calculations').toArray();
		return all.filter((c) => !c.deletedAt);
	}, [] as LocalCalculation[]);

	let expression = $state('');
	let result = $state('');
	let hasError = $state(false);

	const calculations = $derived(calcQuery.value);

	const recent = $derived(
		[...calculations]
			.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
			.slice(0, 10)
	);

	// Live evaluation — update result preview as user types
	$effect(() => {
		if (!expression.trim()) {
			result = '0';
			hasError = false;
			return;
		}
		try {
			const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, '');
			const evalResult = Function('"use strict"; return (' + sanitized + ')')();
			if (evalResult === undefined || evalResult === null || isNaN(evalResult)) {
				result = expression;
				hasError = false;
			} else {
				result = String(evalResult);
				hasError = false;
			}
		} catch {
			// Incomplete expression — don't show error while typing
			hasError = false;
		}
	});

	function evaluate() {
		if (!expression.trim()) return;
		try {
			const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, '');
			const evalResult = Function('"use strict"; return (' + sanitized + ')')();
			result = String(evalResult);
			hasError = false;
		} catch {
			result = 'Fehler';
			hasError = true;
		}
	}

	function press(key: string) {
		if (key === '=') {
			evaluate();
		} else if (key === 'C') {
			expression = '';
			result = '0';
			hasError = false;
		} else if (key === '⌫') {
			expression = expression.slice(0, -1);
		} else {
			expression += key;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			evaluate();
		}
	}

	const keys = [
		{ label: 'C', style: 'fn' },
		{ label: '⌫', style: 'fn' },
		{ label: '%', style: 'op' },
		{ label: '/', style: 'op' },
		{ label: '7', style: '' },
		{ label: '8', style: '' },
		{ label: '9', style: '' },
		{ label: '*', style: 'op' },
		{ label: '4', style: '' },
		{ label: '5', style: '' },
		{ label: '6', style: '' },
		{ label: '-', style: 'op' },
		{ label: '1', style: '' },
		{ label: '2', style: '' },
		{ label: '3', style: '' },
		{ label: '+', style: 'op' },
		{ label: '0', style: '' },
		{ label: '.', style: '' },
		{ label: '(', style: 'op' },
		{ label: ')', style: 'op' },
	];
</script>

<div class="calc">
	<!-- Display -->
	<div class="display">
		<p class="expression">{expression || ' '}</p>
		<p class="result" class:error={hasError}>{result || '0'}</p>
	</div>

	<!-- Input (hidden but accessible for keyboard) -->
	<input
		bind:value={expression}
		onkeydown={handleKeydown}
		placeholder="Ausdruck eingeben..."
		class="kbd-input"
	/>

	<!-- Button grid -->
	<div class="grid">
		{#each keys as key}
			<button
				onclick={() => press(key.label)}
				class="key"
				class:fn={key.style === 'fn'}
				class:op={key.style === 'op'}
			>
				{key.label}
			</button>
		{/each}
		<button onclick={() => press('=')} class="key eq"> = </button>
	</div>

	<!-- History -->
	{#if recent.length > 0}
		<div class="history">
			<h3 class="history-title">Verlauf</h3>
			{#each recent as calc (calc.id)}
				<button
					class="history-item"
					onclick={() => {
						expression = calc.expression ?? '';
					}}
				>
					<span class="history-expr">{calc.expression}</span>
					<span class="history-result">= {calc.result}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.calc {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem;
		height: 100%;
	}

	.display {
		border-radius: 0.375rem;
		background: hsl(var(--color-muted) / 0.3);
		padding: 0.625rem 0.75rem;
		text-align: right;
		min-height: 3.5rem;
	}
	.expression {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0;
		min-height: 1rem;
		word-break: break-all;
	}
	.result {
		font-size: 1.5rem;
		font-weight: 300;
		color: hsl(var(--color-foreground));
		margin: 0;
		line-height: 1.2;
	}
	.result.error {
		color: hsl(var(--color-error));
		font-size: 1rem;
	}

	.kbd-input {
		width: 100%;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		background: transparent;
		padding: 0.375rem 0.5rem;
		text-align: right;
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
		outline: none;
	}
	.kbd-input::placeholder {
		color: hsl(var(--color-muted-foreground));
	}
	.kbd-input:focus {
		border-color: hsl(var(--color-border-strong));
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.25rem;
	}

	.key {
		padding: 0.5rem 0;
		border: none;
		border-radius: 0.375rem;
		background: hsl(var(--color-muted) / 0.3);
		color: hsl(var(--color-foreground) / 0.8);
		font-size: 0.875rem;
		cursor: pointer;
		transition: background 0.1s;
		min-height: 36px;
	}
	.key:active {
		background: hsl(var(--color-muted) / 0.6);
	}
	.key.op {
		color: hsl(var(--color-primary));
	}
	.key.fn {
		background: hsl(var(--color-muted) / 0.15);
		color: hsl(var(--color-muted-foreground));
	}
	.key.eq {
		grid-column: 1 / -1;
		background: hsl(var(--color-primary) / 0.15);
		color: hsl(var(--color-primary));
		font-weight: 600;
	}
	.key:hover {
		background: hsl(var(--color-muted) / 0.5);
	}
	.key.eq:hover {
		background: hsl(var(--color-primary) / 0.25);
	}

	.history {
		flex: 1;
		overflow-y: auto;
		min-height: 0;
	}
	.history-title {
		font-size: 0.6875rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
		margin: 0 0 0.25rem 0;
	}
	.history-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 0.25rem 0.25rem;
		border: none;
		border-radius: 0.25rem;
		background: transparent;
		cursor: pointer;
		text-align: left;
		transition: background 0.1s;
	}
	.history-item:hover {
		background: hsl(var(--color-surface-hover));
	}
	.history-expr {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}
	.history-result {
		font-size: 0.6875rem;
		color: hsl(var(--color-foreground) / 0.7);
	}
</style>
