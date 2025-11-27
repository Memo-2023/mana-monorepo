<script lang="ts">
  import { onMount } from 'svelte';
  import { theme } from '$lib/stores/theme';

  // Settings state
  let language = $state<'de' | 'en'>('de');
  let userName = $state('');

  // Load settings from localStorage on mount
  onMount(() => {
    theme.init();

    const savedLanguage = localStorage.getItem('language');
    const savedUserName = localStorage.getItem('userName');

    if (savedLanguage) language = savedLanguage as 'de' | 'en';
    if (savedUserName) userName = savedUserName;
  });

  // Save settings to localStorage
  function saveSetting(key: string, value: string | boolean) {
    localStorage.setItem(key, String(value));
  }

  function toggleDarkMode() {
    theme.toggle();
  }

  function setLanguageSetting(lang: 'de' | 'en') {
    language = lang;
    saveSetting('language', lang);
  }

  function saveUserName() {
    saveSetting('userName', userName);
  }

  function resetAllData() {
    if (confirm('Möchtest du wirklich ALLE Daten löschen? Dies kann nicht rückgängig gemacht werden!')) {
      localStorage.clear();
      window.location.href = '/';
    }
  }

  const themes = [
    {
      id: 'default' as const,
      name: 'Standard',
      desc: 'Klassisch & elegant',
      gradientDark: ['#1e293b', '#334155'],
      gradientLight: ['#94a3b8', '#cbd5e1'],
      color: '#64748b'
    },
    {
      id: 'colorful' as const,
      name: 'Farbenfroh',
      desc: 'Lebendig & energetisch',
      gradientDark: ['#be185d', '#e11d48'],
      gradientLight: ['#fb7185', '#fbbf24'],
      color: '#e11d48'
    },
    {
      id: 'nature' as const,
      name: 'Natur',
      desc: 'Beruhigend & harmonisch',
      gradientDark: ['#16a34a', '#22c55e'],
      gradientLight: ['#86efac', '#34d399'],
      color: '#16a34a'
    }
  ];
</script>

<svelte:head>
  <title>Einstellungen - Quotes Web App</title>
</svelte:head>

<div class="settings-page">
  <div class="header-container">
    <h1>Einstellungen</h1>
  </div>

  <!-- Personal Section -->
  <section class="settings-section">
    <h2 class="section-title">Persönlich</h2>

    <div class="setting-card">
      <div class="setting-header">
        <h3>Dein Name</h3>
      </div>
      <input
        type="text"
        bind:value={userName}
        onblur={saveUserName}
        placeholder="Name eingeben..."
        class="text-input"
      />
      <p class="setting-description">Wird als Standard-Autor für eigene Zitate verwendet</p>
    </div>
  </section>

  <!-- Appearance Section -->
  <section class="settings-section">
    <h2 class="section-title">Aussehen</h2>

    <!-- Dark Mode Toggle -->
    <div class="setting-card">
      <div class="setting-row">
        <div class="setting-content">
          <h3>Dark Mode</h3>
          <p class="setting-description">Dunkles Farbschema verwenden</p>
        </div>
        <label class="toggle">
          <input type="checkbox" checked={$theme === 'dark'} onchange={toggleDarkMode} />
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>

    <!-- Theme Preview -->
    <div class="setting-card">
      <div class="setting-header">
        <h3>Farbvorschau</h3>
        <p class="setting-description">So sieht die App mit dem aktuellen Theme aus</p>
      </div>

      <div class="theme-preview">
        <div class="preview-colors">
          <div class="color-swatch primary">
            <span>Primary</span>
          </div>
          <div class="color-swatch surface">
            <span>Surface</span>
          </div>
          <div class="color-swatch text">
            <span>Text</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Language Section -->
  <section class="settings-section">
    <h2 class="section-title">Sprache</h2>

    <div class="setting-card">
      <div class="setting-row">
        <div class="setting-content">
          <h3>Sprache</h3>
          <p class="setting-description">Sprache der App und Zitate</p>
        </div>
        <div class="language-toggle">
          <button
            class="lang-btn"
            class:active={language === 'de'}
            onclick={() => setLanguageSetting('de')}
          >
            DE
          </button>
          <button
            class="lang-btn"
            class:active={language === 'en'}
            onclick={() => setLanguageSetting('en')}
          >
            EN
          </button>
        </div>
      </div>
    </div>
  </section>

  <!-- About Section -->
  <section class="settings-section">
    <h2 class="section-title">Über</h2>

    <div class="setting-card">
      <div class="setting-row">
        <span>Version</span>
        <span class="setting-value">1.0.0</span>
      </div>
    </div>
  </section>

  <!-- Data Section -->
  <section class="settings-section">
    <h2 class="section-title">Daten</h2>

    <div class="setting-card danger">
      <button class="danger-btn" onclick={resetAllData}>
        <div>
          <h3 class="danger-title">Alle Daten zurücksetzen</h3>
          <p class="setting-description">Löscht Favoriten, Playlists und Einstellungen</p>
        </div>
        <span class="danger-icon">🗑️</span>
      </button>
    </div>
  </section>
</div>

<style>
  .settings-page {
    max-width: 1200px;
    margin: 0 auto;
    padding-bottom: var(--spacing-2xl);
  }

  .header-container {
    max-width: 700px;
    margin: 0 auto var(--spacing-2xl);
  }

  h1 {
    font-size: 2rem;
    margin: 0;
    color: rgb(var(--color-text-primary));
  }

  .settings-section {
    max-width: 700px;
    margin: 0 auto var(--spacing-2xl);
  }

  .section-title {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgb(var(--color-text-secondary));
    margin-bottom: var(--spacing-md);
  }

  .setting-card {
    background: rgb(var(--color-surface));
    border: 1px solid rgb(var(--color-border));
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-md);
    transition: transform var(--transition-base), box-shadow var(--transition-base);
  }

  .setting-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .setting-header {
    margin-bottom: 1rem;
  }

  .setting-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .setting-content {
    flex: 1;
  }

  h3 {
    font-size: 1rem;
    font-weight: 600;
    color: rgb(var(--color-text-primary));
    margin: 0 0 var(--spacing-xs) 0;
  }

  .setting-description {
    font-size: 0.875rem;
    color: rgb(var(--color-text-secondary));
    margin: 0;
  }

  .setting-value {
    color: rgb(var(--color-text-secondary));
    font-size: 0.95rem;
  }

  /* Text Input */
  .text-input {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-md);
    border: 2px solid rgb(var(--color-border));
    background: rgb(var(--color-background));
    color: rgb(var(--color-text-primary));
    font-size: 1rem;
    margin-bottom: var(--spacing-sm);
    transition: border-color var(--transition-fast);
  }

  .text-input:focus {
    outline: none;
    border-color: rgb(var(--color-primary));
  }

  /* Toggle Switch */
  .toggle {
    position: relative;
    width: 51px;
    height: 31px;
    display: inline-block;
    cursor: pointer;
  }

  .toggle input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgb(var(--color-border));
    transition: var(--transition-base);
    border-radius: 31px;
  }

  .toggle-slider:before {
    position: absolute;
    content: "";
    height: 25px;
    width: 25px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: var(--transition-base);
    border-radius: 50%;
  }

  .toggle input:checked + .toggle-slider {
    background-color: rgb(var(--color-primary));
  }

  .toggle input:checked + .toggle-slider:before {
    transform: translateX(20px);
  }

  /* Theme Preview */
  .theme-preview {
    margin-top: var(--spacing-md);
  }

  .preview-colors {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-md);
  }

  .color-swatch {
    padding: var(--spacing-lg);
    border-radius: var(--radius-md);
    text-align: center;
    font-weight: 500;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 80px;
  }

  .color-swatch.primary {
    background: rgb(var(--color-primary));
    color: white;
  }

  .color-swatch.surface {
    background: rgb(var(--color-surface));
    color: rgb(var(--color-text-primary));
    border: 1px solid rgb(var(--color-border));
  }

  .color-swatch.text {
    background: rgb(var(--color-text-primary));
    color: rgb(var(--color-background));
  }

  /* Language Toggle */
  .language-toggle {
    display: flex;
    border-radius: var(--radius-full);
    overflow: hidden;
    background: rgb(var(--color-surface));
    border: 1px solid rgb(var(--color-border));
  }

  .lang-btn {
    padding: var(--spacing-sm) var(--spacing-md);
    border: none;
    background: transparent;
    color: rgb(var(--color-text-primary));
    font-weight: 500;
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .lang-btn.active {
    background: rgb(var(--color-primary));
    color: white;
  }

  /* Danger Zone */
  .setting-card.danger {
    background: rgba(var(--color-error), 0.1);
    border-color: rgba(var(--color-error), 0.2);
  }

  .danger-btn {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    text-align: left;
  }

  .danger-title {
    color: rgb(var(--color-error));
  }

  .danger-icon {
    font-size: 1.25rem;
  }

  /* Mobile Responsiveness */
  @media (max-width: 768px) {
    .header-container,
    .settings-section {
      max-width: 100%;
    }

    h1 {
      font-size: 1.5rem;
    }

    .section-title {
      font-size: 0.7rem;
    }

    .preview-colors {
      grid-template-columns: 1fr;
      gap: var(--spacing-sm);
    }

    .color-swatch {
      min-height: 60px;
      padding: var(--spacing-md);
    }
  }
</style>
