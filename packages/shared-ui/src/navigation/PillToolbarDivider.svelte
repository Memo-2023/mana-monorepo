<script lang="ts">
	// No props needed - simple divider component
</script>

<div class="toolbar-divider"></div>

<style>
	.toolbar-divider {
		width: 1px;
		height: 1.25rem;
		background: rgba(0, 0, 0, 0.1);
		flex-shrink: 0;
	}

	:global(.dark) .toolbar-divider {
		background: rgba(255, 255, 255, 0.15);
	}
</style>
