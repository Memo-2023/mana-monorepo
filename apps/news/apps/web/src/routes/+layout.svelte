<script lang="ts">
  import '../app.css';
  import { authStore } from '$lib/stores/auth.svelte';

  let { children, data } = $props();

  // Initialize auth store with server data
  $effect(() => {
    if (data.session && data.user) {
      authStore.setSession(data.session, data.user);
    }
  });
</script>

<div class="min-h-screen bg-background-page text-text-primary">
  {@render children()}
</div>
