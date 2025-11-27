<script lang="ts">
  interface Props {
    value: string;
    placeholder?: string;
    onInput?: (value: string) => void;
  }

  let { value = $bindable(''), placeholder = 'Suchen...', onInput }: Props = $props();

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    value = target.value;
    if (onInput) {
      onInput(target.value);
    }
  }
</script>

<div class="search-box">
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
  <input
    type="text"
    value={value}
    oninput={handleInput}
    placeholder={placeholder}
  />
</div>

<style>
  .search-box {
    position: relative;
    margin-bottom: var(--spacing-lg);
  }

  .search-box svg {
    position: absolute;
    left: var(--spacing-md);
    top: 50%;
    transform: translateY(-50%);
    color: rgb(var(--color-text-tertiary));
    pointer-events: none;
  }

  .search-box input {
    width: 100%;
    padding: var(--spacing-md) var(--spacing-md) var(--spacing-md) calc(var(--spacing-md) * 3);
    border: 2px solid rgb(var(--color-border));
    border-radius: var(--radius-lg);
    font-size: 1rem;
    background-color: rgb(var(--color-background));
    color: rgb(var(--color-text-primary));
    transition: border-color var(--transition-base);
  }

  .search-box input:focus {
    outline: none;
    border-color: rgb(var(--color-primary));
  }

  .search-box input::placeholder {
    color: rgb(var(--color-text-tertiary));
  }
</style>
