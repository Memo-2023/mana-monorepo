<script lang="ts">
  import type { ThemeStore } from '@manacore/shared-theme';
  import { Icon } from '@manacore/shared-icons';

  interface Props {
    /** Theme store instance */
    theme: ThemeStore;
    /** Icon size in pixels */
    size?: number;
    /** Additional CSS classes */
    class?: string;
    /** Show tooltip */
    showTooltip?: boolean;
  }

  let { theme, size = 20, class: className = '', showTooltip = false }: Props = $props();

  function getTooltipText(): string {
    if (theme.mode === 'system') {
      return `System (${theme.effectiveMode})`;
    }
    return theme.effectiveMode === 'dark' ? 'Dark mode' : 'Light mode';
  }
</script>

<button
  type="button"
  onclick={() => theme.toggleMode()}
  class="theme-toggle {className}"
  aria-label="Toggle theme"
  title={showTooltip ? getTooltipText() : undefined}
>
  {#if theme.effectiveMode === 'dark'}
    <Icon name="sun" {size} class="theme-toggle-icon" />
  {:else}
    <Icon name="moon" {size} class="theme-toggle-icon" />
  {/if}
</button>

<style>
  .theme-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    border-radius: 0.5rem;
    background: transparent;
    border: none;
    cursor: pointer;
    color: hsl(var(--color-foreground));
    transition: background-color 0.2s ease, transform 0.1s ease;
  }

  .theme-toggle:hover {
    background-color: hsl(var(--color-surface-hover));
  }

  .theme-toggle:active {
    transform: scale(0.95);
  }

  .theme-toggle:focus-visible {
    outline: 2px solid hsl(var(--color-ring));
    outline-offset: 2px;
  }

  :global(.theme-toggle-icon) {
    transition: transform 0.3s ease;
  }

  .theme-toggle:hover :global(.theme-toggle-icon) {
    transform: rotate(15deg);
  }
</style>
