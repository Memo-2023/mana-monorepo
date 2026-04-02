<script lang="ts">
	let { children }: { children: any } = $props();
</script>

<!-- Chat pages handle their own layout via ChatLayout component -->
{@render children()}
