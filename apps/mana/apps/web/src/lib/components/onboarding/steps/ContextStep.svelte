<!--
  Onboarding Context Step — 5 key questions to populate the user context.
  Uses the same ContextInterview component in compact mode.
-->
<script lang="ts">
	import ContextInterview from '$lib/modules/profile/ContextInterview.svelte';
</script>

<div class="context-step">
	<div class="step-header">
		<h2 class="step-title">Erzähl Mana über dich</h2>
		<p class="step-subtitle">
			Je besser Mana dich kennt, desto relevanter werden Vorschläge und Automatisierungen. Du kannst
			alles jederzeit im Profil ändern oder ergänzen.
		</p>
	</div>

	<div class="interview-area">
		<ContextInterview
			compact
			limitCategories={['about', 'routine', 'leisure', 'nutrition', 'goals']}
		/>
	</div>
</div>

<style>
	.context-step {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		height: 100%;
	}

	.step-header {
		text-align: center;
	}
	.step-title {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
	}
	.step-subtitle {
		margin: 0.5rem 0 0;
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		max-width: 32rem;
		margin-inline: auto;
	}

	.interview-area {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
	}
</style>
