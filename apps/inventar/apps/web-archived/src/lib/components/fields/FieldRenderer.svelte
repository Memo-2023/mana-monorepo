<script lang="ts">
	import type { FieldDefinition } from '@inventar/shared';
	import { format } from 'date-fns';
	import { de } from 'date-fns/locale';

	interface Props {
		field: FieldDefinition;
		value: unknown;
	}

	let { field, value }: Props = $props();

	function formatCurrency(val: unknown, code?: string): string {
		const num = Number(val);
		if (isNaN(num)) return String(val || '');
		return new Intl.NumberFormat('de-DE', { style: 'currency', currency: code || 'EUR' }).format(
			num
		);
	}

	function formatDate(val: unknown): string {
		if (!val) return '';
		try {
			return format(new Date(String(val)), 'dd.MM.yyyy', { locale: de });
		} catch {
			return String(val);
		}
	}
</script>

{#if value === undefined || value === null || value === ''}
	<span class="text-[hsl(var(--muted-foreground))] italic">—</span>
{:else if field.type === 'checkbox'}
	{#if value}
		<span class="text-green-500">✓</span>
	{:else}
		<span class="text-[hsl(var(--muted-foreground))]">✗</span>
	{/if}
{:else if field.type === 'currency'}
	<span>{formatCurrency(value, field.currencyCode)}</span>
{:else if field.type === 'date'}
	<span>{formatDate(value)}</span>
{:else if field.type === 'url'}
	<a
		href={String(value)}
		target="_blank"
		rel="noopener noreferrer"
		class="text-[hsl(var(--primary))] underline hover:no-underline"
	>
		{String(value)
			.replace(/^https?:\/\//, '')
			.slice(0, 40)}
	</a>
{:else if field.type === 'select'}
	<span
		class="inline-block rounded-full bg-[hsl(var(--accent)/0.15)] px-2 py-0.5 text-xs font-medium text-[hsl(var(--accent-foreground))]"
	>
		{String(value)}
	</span>
{:else if field.type === 'tags'}
	<div class="flex flex-wrap gap-1">
		{#each Array.isArray(value) ? value : [] as tag}
			<span class="rounded-full bg-[hsl(var(--muted))] px-2 py-0.5 text-xs">{tag}</span>
		{/each}
	</div>
{:else if field.type === 'number'}
	<span>{Number(value).toLocaleString('de-DE')}</span>
{:else}
	<span>{String(value)}</span>
{/if}
