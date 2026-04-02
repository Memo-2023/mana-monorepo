<script lang="ts">
	let { children } = $props();
</script>

<div class="min-h-screen flex items-center justify-center p-4 bg-background">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-foreground">Zitare</h1>
			<p class="text-foreground-secondary mt-2">Inspirierende Zitate jeden Tag</p>
		</div>
		{@render children()}
	</div>
</div>
