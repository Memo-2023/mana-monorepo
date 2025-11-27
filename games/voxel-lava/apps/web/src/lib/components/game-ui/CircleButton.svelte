<script lang="ts">
  // Props für den Button
  export let icon: string; // Icon-Name (z.B. 'play', 'info')
  export let onClick: () => void; // Callback-Funktion für Klick-Event
  export let color: string = '#4A5568'; // Standardfarbe
  export let size: number = 50; // Größe in Pixeln
  export let tooltip: string = ''; // Tooltip-Text (optional)
  export let visible: boolean = true; // Sichtbarkeit des Buttons
</script>

<style>
  .circle-button {
    width: var(--size);
    height: var(--size);
    border-radius: 50%;
    background-color: var(--color);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    transition: transform 0.2s, background-color 0.2s;
    position: relative;
    border: none;
    outline: none;
  }

  .circle-button:hover {
    transform: translateY(-2px);
    filter: brightness(1.1);
  }

  .circle-button:active {
    transform: translateY(0);
  }

  .icon {
    width: 50%;
    height: 50%;
    color: white;
    fill: currentColor;
  }

  .tooltip {
    position: absolute;
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s;
    z-index: 1000;
  }

  .circle-button:hover .tooltip {
    opacity: 1;
  }

  /* Tooltip-Positionen je nach Icon */
  .tooltip.play {
    bottom: calc(100% + 10px);
    left: 50%;
    transform: translateX(-50%);
  }

  .tooltip.info {
    top: calc(100% + 10px);
    right: 0;
  }
</style>

{#if visible}
  <button 
    class="circle-button" 
    on:click={onClick}
    style="--size: {size}px; --color: {color};"
    aria-label={tooltip}
  >
    {#if icon === 'play'}
      <svg class="icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 5v14l11-7z" />
      </svg>
    {:else if icon === 'stop'}
      <svg class="icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 6h12v12H6z" />
      </svg>
    {:else if icon === 'info'}
      <svg class="icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
      </svg>
    {/if}
    
    {#if tooltip}
      <span class="tooltip {icon}">{tooltip}</span>
    {/if}
  </button>
{/if}
