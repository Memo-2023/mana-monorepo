<script lang="ts">
  import type { ThemeStore, ThemeVariant } from '@manacore/shared-theme';
  import { THEME_DEFINITIONS } from '@manacore/shared-theme';

  interface Props {
    /** Theme store instance */
    theme: ThemeStore;
    /** Show variant labels */
    showLabels?: boolean;
    /** Show emoji icons */
    showEmoji?: boolean;
    /** Compact mode (smaller buttons) */
    compact?: boolean;
    /** Additional CSS classes */
    class?: string;
  }

  let {
    theme,
    showLabels = true,
    showEmoji = true,
    compact = false,
    class: className = '',
  }: Props = $props();

  /**
   * Get the primary color for a variant based on current mode
   */
  function getVariantColor(variant: ThemeVariant): string {
    const definition = THEME_DEFINITIONS[variant];
    const colors = theme.effectiveMode === 'dark' ? definition.dark : definition.light;
    return `hsl(${colors.primary})`;
  }
</script>

<div class="theme-selector {className}" class:compact>
  {#each theme.variants as variant}
    {@const definition = THEME_DEFINITIONS[variant]}
    {@const isActive = theme.variant === variant}
    <button
      type="button"
      onclick={() => theme.setVariant(variant)}
      class="variant-button"
      class:active={isActive}
      aria-label="Select {definition.label} theme"
      aria-pressed={isActive}
    >
      <span
        class="color-dot"
        style:background-color={getVariantColor(variant)}
      ></span>
      {#if showEmoji && !compact}
        <span class="emoji">{definition.emoji}</span>
      {/if}
      {#if showLabels && !compact}
        <span class="label">{definition.label}</span>
      {/if}
    </button>
  {/each}
</div>

<style>
  .theme-selector {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .variant-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    background: transparent;
    border: 1px solid hsl(var(--color-border));
    cursor: pointer;
    color: hsl(var(--color-foreground));
    font-size: 0.875rem;
    transition: all 0.2s ease;
  }

  .variant-button:hover {
    background-color: hsl(var(--color-surface-hover));
    border-color: hsl(var(--color-border-strong));
  }

  .variant-button.active {
    background-color: hsl(var(--color-surface));
    border-color: hsl(var(--color-primary));
    box-shadow: 0 0 0 1px hsl(var(--color-primary));
  }

  .variant-button:focus-visible {
    outline: 2px solid hsl(var(--color-ring));
    outline-offset: 2px;
  }

  .color-dot {
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    flex-shrink: 0;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .emoji {
    font-size: 1rem;
  }

  .label {
    font-weight: 500;
  }

  /* Compact mode */
  .compact .variant-button {
    padding: 0.375rem;
    border-radius: 0.375rem;
  }

  .compact .color-dot {
    width: 1.25rem;
    height: 1.25rem;
  }
</style>
