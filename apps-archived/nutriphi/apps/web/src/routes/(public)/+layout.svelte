<script lang="ts">
	let { children } = $props();
</script>

<div
	class="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800"
>
	{@render children()}
</div>
