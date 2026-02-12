<script lang="ts">
  import {
    unifiedBarStore,
    type UnifiedBarLayer,
    type UnifiedBarMode,
  } from '$lib/stores/unified-bar.svelte';
  import { createEventDispatcher } from 'svelte';
  import { slide } from 'svelte/transition';

  interface Props {
    onModeChange?: (mode: UnifiedBarMode) => void;
    onLayerChange?: (layer: UnifiedBarLayer) => void;
    disabled?: boolean;
  }

  let { onModeChange = () => {}, onLayerChange = () => {}, disabled = false }: Props = $props();

  const dispatch = createEventDispatcher();

  // Current state
  let currentMode = $derived(unifiedBarStore.mode);
  let activeLayer = $derived(unifiedBarStore.activeLayer);

  // Handle mode switching
  function switchToMode(mode: UnifiedBarMode) {
    unifiedBarStore.setMode(mode);
    onModeChange(mode);
    dispatch('modeChange', { mode, previousMode: currentMode });
  }

  // Handle layer activation
  function activateLayer(layer: UnifiedBarLayer) {
    unifiedBarStore.expandToLayer(layer);
    onLayerChange(layer);
    dispatch('layerChange', { layer, previousLayer: activeLayer });
  }

  // Quick actions
  function handleQuickAction(action: string) {
    dispatch('quickAction', { action });
  }
</script>

<!-- Unified Bar Controls -->
<div class="unified-bar-controls" class:disabled>
  <!-- Mode Selector -->
  <div class="mode-selector">
    <button
      class="mode-btn"
      class:active={currentMode === 'collapsed'}
      onmousedown={() => switchToMode('collapsed')}
      title="Zusammengeklappt"
    >
      <span class="icon-minimize-2"></span>
    </button>

    <button
      class="mode-btn"
      class:active={currentMode === 'expanded'}
      onmousedown={() => switchToMode('expanded')}
      title="Erweitert"
    >
      <span class="icon-maximize-2"></span>
    </button>

    <button
      class="mode-btn"
      class:active={currentMode === 'overlay'}
      onmousedown={() => unifiedBarStore.toggleOverlay()}
      title="Menü"
    >
      <span class="icon-menu"></span>
    </button>
  </div>

  <!-- Layer Controls (only visible in expanded mode) -->
  {#if currentMode === 'expanded'}
    <div class="layer-controls" transition:slide={{ duration: 200 }}>
      <div class="layer-btn-group">
        <button
          class="layer-btn"
          class:active={activeLayer === 'input' || unifiedBarStore.showQuickInput}
          onmousedown={() => activateLayer('input')}
          title="Schnelleingabe"
        >
          <span class="icon-edit"></span>
          <span class="label">Eingabe</span>
        </button>

        <button
          class="layer-btn"
          class:active={activeLayer === 'date' || unifiedBarStore.showDateStrip}
          onmousedown={() => activateLayer('date')}
          title="Datum-Leiste"
        >
          <span class="icon-calendar"></span>
          <span class="label">Datum</span>
        </button>

        <button
          class="layer-btn"
          class:active={activeLayer === 'tag' || unifiedBarStore.showTagStrip}
          onmousedown={() => activateLayer('tag')}
          title="Tag-Filter"
        >
          <span class="icon-tag"></span>
          <span class="label">Tags</span>
        </button>

        <button
          class="layer-btn"
          class:active={activeLayer === 'toolbar' || unifiedBarStore.showCalendarToolbar}
          onmousedown={() => activateLayer('toolbar')}
          title="Kalender-Toolbar"
        >
          <span class="icon-settings"></span>
          <span class="label">Tools</span>
        </button>
      </div>

      <div class="quick-actions">
        <button
          class="quick-action-btn"
          onmousedown={() => handleQuickAction('new-event')}
          title="Neuer Termin"
        >
          <span class="icon-plus"></span>
        </button>

        <button
          class="quick-action-btn"
          onmousedown={() => handleQuickAction('today')}
          title="Heute"
        >
          <span class="icon-navigation"></span>
        </button>

        <button
          class="quick-action-btn"
          onmousedown={() => unifiedBarStore.collapseAll()}
          title="Alle einklappen"
        >
          <span class="icon-chevron-down"></span>
        </button>
      </div>
    </div>
  {/if}

  <!-- Status Indicator -->
  <div class="status-indicator">
    <div class="status-dots">
      <div class="status-dot" class:active={unifiedBarStore.showQuickInput} title="Eingabe"></div>
      <div
        class="status-dot"
        class:active={unifiedBarStore.showDateStrip}
        title="Datum-Leiste"
      ></div>
      <div class="status-dot" class:active={unifiedBarStore.showTagStrip} title="Tag-Filter"></div>
      <div
        class="status-dot"
        class:active={unifiedBarStore.showCalendarToolbar}
        title="Kalender-Toolbar"
      ></div>
    </div>

    <span class="mode-text">
      {#if currentMode === 'collapsed'}
        Zusammengklappt
      {:else if currentMode === 'expanded'}
        Erweitert
      {:else if currentMode === 'overlay'}
        Menü offen
      {/if}
    </span>
  </div>
</div>

<style>
  .unified-bar-controls {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    user-select: none;
  }

  .unified-bar-controls.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  /* Mode Selector */
  .mode-selector {
    display: flex;
    gap: var(--spacing-xs);
    background: var(--color-background);
    border-radius: var(--radius-md);
    padding: var(--spacing-xs);
  }

  .mode-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all var(--transition-fast);
    color: var(--color-muted-foreground);
    font-size: 16px;
  }

  .mode-btn:hover {
    background: var(--color-muted);
    color: var(--color-foreground);
    transform: translateY(-1px);
  }

  .mode-btn.active {
    background: var(--color-primary);
    color: var(--color-primary-foreground);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  /* Layer Controls */
  .layer-controls {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: 0 var(--spacing-md);
  }

  .layer-btn-group {
    display: flex;
    gap: var(--spacing-xs);
    background: var(--color-background);
    border-radius: var(--radius-md);
    padding: var(--spacing-xs);
  }

  .layer-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-md);
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all var(--transition-fast);
    color: var(--color-muted-foreground);
    min-width: 60px;
  }

  .layer-btn:hover {
    background: var(--color-muted);
    color: var(--color-foreground);
    transform: translateY(-1px);
  }

  .layer-btn.active {
    background: color-mix(in srgb, var(--color-primary) 20%, transparent);
    color: var(--color-primary);
    border: 1px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
  }

  .layer-btn .label {
    font-size: 0.625rem;
    font-weight: 500;
    text-align: center;
    line-height: 1;
  }

  .layer-btn .icon {
    font-size: 16px;
  }

  /* Quick Actions */
  .quick-actions {
    display: flex;
    gap: var(--spacing-xs);
  }

  .quick-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all var(--transition-fast);
    color: var(--color-muted-foreground);
    font-size: 14px;
  }

  .quick-action-btn:hover {
    background: var(--color-muted);
    border-color: var(--color-primary);
    color: var(--color-primary);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  /* Status Indicator */
  .status-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-xs);
    margin-left: auto;
  }

  .status-dots {
    display: flex;
    gap: var(--spacing-xs);
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-border);
    transition: all var(--transition-fast);
  }

  .status-dot.active {
    background: var(--color-success);
    box-shadow: 0 0 8px color-mix(in srgb, var(--color-success) 50%, transparent);
  }

  .status-dot:hover {
    transform: scale(1.2);
  }

  .mode-text {
    font-size: 0.75rem;
    color: var(--color-muted-foreground);
    font-weight: 500;
    text-align: center;
    white-space: nowrap;
  }

  /* Icons (placeholder - replace with actual icon components) */
  .icon-minimize-2::before {
    content: '⬇️';
  }
  .icon-maximize-2::before {
    content: '⬆️';
  }
  .icon-menu::before {
    content: '☰';
  }
  .icon-edit::before {
    content: '✏️';
  }
  .icon-calendar::before {
    content: '📅';
  }
  .icon-tag::before {
    content: '🏷️';
  }
  .icon-settings::before {
    content: '⚙️';
  }
  .icon-plus::before {
    content: '+';
  }
  .icon-navigation::before {
    content: '🧭';
  }
  .icon-chevron-down::before {
    content: '⬇️';
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .unified-bar-controls {
      flex-wrap: wrap;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm);
    }

    .layer-controls {
      width: 100%;
      justify-content: space-between;
      padding: var(--spacing-sm) 0;
    }

    .layer-btn {
      min-width: 50px;
      padding: var(--spacing-sm);
    }

    .layer-btn .label {
      font-size: 0.5rem;
    }

    .status-indicator {
      margin-left: 0;
      width: 100%;
    }

    .mode-text {
      display: none;
    }

    .status-dots {
      justify-content: center;
    }
  }
</style>
