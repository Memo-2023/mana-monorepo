<script lang="ts">
	import { setContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import { useAllTransactions, useAllCategories } from '$lib/modules/finance/queries';

	let { children }: { children: Snippet } = $props();

	const allTransactions = useAllTransactions();
	const allCategories = useAllCategories();

	setContext('transactions', allTransactions);
	setContext('financeCategories', allCategories);
</script>

{@render children()}
