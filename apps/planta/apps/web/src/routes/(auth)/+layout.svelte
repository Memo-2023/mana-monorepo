<script lang="ts">
	let { children } = $props();
</script>

<div class="flex min-h-screen flex-col items-center justify-center px-4">
	<div class="w-full max-w-md">
		<div class="mb-8 text-center">
			<h1 class="text-3xl font-bold text-foreground">Planta</h1>
			<p class="mt-2 text-muted-foreground">Deine Pflanzen dokumentieren</p>
		</div>
		{@render children()}
	</div>
</div>
