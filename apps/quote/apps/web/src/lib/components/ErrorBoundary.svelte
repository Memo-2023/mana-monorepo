<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    children?: any;
  }

  let { children }: Props = $props();

  let hasError = $state(false);
  let errorMessage = $state('');

  onMount(() => {
    // Global error handler
    const handleError = (event: ErrorEvent) => {
      console.error('Error caught:', event.error);
      hasError = true;
      errorMessage = event.error?.message || 'Ein unerwarteter Fehler ist aufgetreten';
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      hasError = true;
      errorMessage = event.reason?.message || 'Ein unerwarteter Fehler ist aufgetreten';
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  });

  function handleReset() {
    hasError = false;
    errorMessage = '';
    window.location.reload();
  }
</script>

{#if hasError}
  <div class="error-boundary">
    <div class="error-container">
      <div class="error-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h2>Etwas ist schiefgelaufen</h2>
      <p class="error-message">{errorMessage}</p>
      <div class="error-actions">
        <button class="btn btn-primary" onclick={handleReset}>
          Seite neu laden
        </button>
        <a href="/" class="btn btn-secondary">
          Zur Startseite
        </a>
      </div>
    </div>
  </div>
{:else}
  {@render children?.()}
{/if}

<style>
  .error-boundary {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl);
    background: rgb(var(--color-background));
  }

  .error-container {
    max-width: 500px;
    text-align: center;
  }

  .error-icon {
    margin: 0 auto var(--spacing-lg);
    color: rgb(var(--color-error));
  }

  h2 {
    font-size: 1.75rem;
    color: rgb(var(--color-text-primary));
    margin: 0 0 var(--spacing-md) 0;
  }

  .error-message {
    font-size: 1rem;
    color: rgb(var(--color-text-secondary));
    margin: 0 0 var(--spacing-xl) 0;
    line-height: 1.6;
  }

  .error-actions {
    display: flex;
    gap: var(--spacing-md);
    justify-content: center;
    flex-wrap: wrap;
  }

  .btn {
    padding: var(--spacing-sm) var(--spacing-xl);
    border-radius: var(--radius-md);
    font-weight: 500;
    font-size: 1rem;
    cursor: pointer;
    transition: all var(--transition-base);
    text-decoration: none;
    display: inline-block;
  }

  .btn-primary {
    background: rgb(var(--color-primary));
    color: white;
    border: none;
  }

  .btn-primary:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }

  .btn-secondary {
    background: rgb(var(--color-surface));
    color: rgb(var(--color-text-primary));
    border: 1px solid rgb(var(--color-border));
  }

  .btn-secondary:hover {
    background: rgb(var(--color-background));
  }

  @media (max-width: 768px) {
    .error-boundary {
      padding: var(--spacing-lg);
    }

    h2 {
      font-size: 1.5rem;
    }

    .error-actions {
      flex-direction: column;
      width: 100%;
    }

    .btn {
      width: 100%;
    }
  }
</style>
