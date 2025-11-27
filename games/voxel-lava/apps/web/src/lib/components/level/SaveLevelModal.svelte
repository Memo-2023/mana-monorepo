<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { LevelService } from '../../services/LevelService';
  import { AuthService } from '../../services/AuthService';

  // Event-Dispatcher für Kommunikation mit übergeordneten Komponenten
  const dispatch = createEventDispatcher();
  
  // Props
  export let isOpen = false;
  export let blocks: { x: number, y: number, z: number, type: string, isSpawnPoint: boolean, isGoal: boolean }[] = [];
  export let spawnPoint: { x: number, y: number, z: number } | null = null;
  export let worldSize: { width: number, height: number, depth: number } = { width: 20, height: 10, depth: 20 };
  export let currentLevelId: string | null = null;
  export let currentLevelName = "Neues Level";
  
  // Formular-Zustände
  let levelName = currentLevelName;
  let levelDescription = "";
  let isPublic = false;
  let difficulty = "normal";
  let tags = "";
  let isLoading = false;
  let errorMessage = "";
  let successMessage = "";
  let isLoggedIn = false;
  
  // Beim Öffnen des Modals die Formularfelder aktualisieren
  $: if (isOpen) {
    levelName = currentLevelName;
    checkAuthStatus();
  }
  
  // Prüfen, ob der Benutzer angemeldet ist
  async function checkAuthStatus() {
    const user = await AuthService.getCurrentUser();
    isLoggedIn = !!user;
    
    if (!isLoggedIn) {
      errorMessage = "Du musst angemeldet sein, um ein Level zu speichern.";
    } else {
      errorMessage = "";
    }
  }
  
  // Formular absenden
  async function handleSubmit() {
    if (!levelName.trim()) {
      errorMessage = "Bitte gib einen Namen für das Level ein.";
      return;
    }
    
    if (!isLoggedIn) {
      errorMessage = "Du musst angemeldet sein, um ein Level zu speichern.";
      return;
    }
    
    if (!spawnPoint) {
      errorMessage = "Das Level muss einen Spawn-Punkt haben.";
      return;
    }
    
    try {
      isLoading = true;
      errorMessage = "";
      
      // Die Blöcke sind bereits im richtigen Format, da sie vom BlockManager.getSerializableBlocks() kommen
      console.log('Blöcke zum Speichern:', blocks);
      console.log('Anzahl der Blöcke:', blocks.length);
      
      // Detaillierte Debugging-Ausgaben
      if (blocks.length > 0) {
        console.log('Erster Block:', blocks[0]);
      } else {
        console.warn('Keine Blöcke zum Speichern gefunden!');
      }
      
      if (blocks.length === 0) {
        errorMessage = "Keine Blöcke gefunden. Das Level kann nicht gespeichert werden.";
        isLoading = false;
        return;
      }
      
      // Level-Objekt erstellen
      const level = {
        id: currentLevelId,
        name: levelName.trim(),
        description: levelDescription.trim(),
        blocks: blocks,
        spawnPoint: spawnPoint,
        worldSize: worldSize,
        isPublic: isPublic,
        difficulty: difficulty,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      
      // Level speichern
      // @ts-ignore - Typprobleme ignorieren, da wir die Struktur kennen
      const levelId = await LevelService.saveLevel(level);
      
      if (levelId) {
        successMessage = `Level "${levelName}" erfolgreich gespeichert!`;
        currentLevelName = levelName;
        currentLevelId = levelId;
        
        // Event auslösen
        dispatch('save', { levelId, levelName });
        
        // Modal nach kurzer Verzögerung schließen
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        errorMessage = "Fehler beim Speichern des Levels.";
      }
    } catch (error) {
      console.error('Error saving level:', error);
      errorMessage = "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.";
    } finally {
      isLoading = false;
    }
  }
  
  // Modal schließen
  function closeModal() {
    isOpen = false;
    errorMessage = "";
    successMessage = "";
    dispatch('close');
  }
  
  // Klick außerhalb des Modals abfangen
  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }
  
  // Tastendruck abfangen (Escape zum Schließen)
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div 
    class="modal-backdrop" 
    on:click={handleBackdropClick}
    on:keydown={(e) => e.key === 'Enter' && handleSubmit()}
    role="dialog"
    aria-modal="true"
    aria-labelledby="save-level-title"
    tabindex="-1"
  >
    <div class="modal-content">
      <button 
        class="close-button" 
        on:click={closeModal}
        aria-label="Schließen"
      >
        ×
      </button>
      
      <h2 id="save-level-title">Level speichern</h2>
      
      {#if errorMessage}
        <div class="error-message">
          {errorMessage}
          
          {#if !isLoggedIn}
            <div class="login-prompt">
              <p>Bitte melde dich an, um dein Level zu speichern.</p>
            </div>
          {/if}
        </div>
      {/if}
      
      {#if successMessage}
        <div class="success-message">
          {successMessage}
        </div>
      {/if}
      
      <form on:submit|preventDefault={handleSubmit}>
        <div class="form-group">
          <label for="levelName">Level-Name *</label>
          <input 
            type="text" 
            id="levelName" 
            bind:value={levelName} 
            placeholder="Gib deinem Level einen Namen" 
            disabled={isLoading || !isLoggedIn}
            required
          />
        </div>
        
        <div class="form-group">
          <label for="levelDescription">Beschreibung</label>
          <textarea 
            id="levelDescription" 
            bind:value={levelDescription} 
            placeholder="Beschreibe dein Level (optional)" 
            rows="3"
            disabled={isLoading || !isLoggedIn}
          ></textarea>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="difficulty">Schwierigkeit</label>
            <select 
              id="difficulty" 
              bind:value={difficulty}
              disabled={isLoading || !isLoggedIn}
            >
              <option value="easy">Leicht</option>
              <option value="normal">Normal</option>
              <option value="hard">Schwer</option>
              <option value="expert">Experte</option>
            </select>
          </div>
          
          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                bind:checked={isPublic}
                disabled={isLoading || !isLoggedIn}
              />
              <span>Öffentlich teilen</span>
            </label>
          </div>
        </div>
        
        <div class="form-group">
          <label for="tags">Tags</label>
          <input 
            type="text" 
            id="tags" 
            bind:value={tags} 
            placeholder="z.B. parkour, puzzle, speedrun (durch Kommas getrennt)" 
            disabled={isLoading || !isLoggedIn}
          />
        </div>
        
        <button 
          type="submit" 
          class="save-button" 
          disabled={isLoading || !isLoggedIn}
        >
          {isLoading ? 'Wird gespeichert...' : 'Level speichern'}
        </button>
      </form>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }
  
  .modal-content {
    position: relative;
    background-color: rgba(42, 50, 66, 0.95);
    border-radius: 8px;
    padding: 24px;
    width: 100%;
    max-width: 500px;
    min-width: 280px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    color: white;
    animation: fadeIn 0.3s ease-out;
    box-sizing: border-box;
  }
  
  .close-button {
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    z-index: 10;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background-color: rgba(0, 0, 0, 0.3);
    transition: background-color 0.2s;
  }
  
  .close-button:hover {
    background-color: rgba(0, 0, 0, 0.5);
  }
  
  h2 {
    margin-top: 0;
    margin-bottom: 24px;
    text-align: center;
    font-size: 1.5rem;
  }
  
  .form-group {
    margin-bottom: 16px;
  }
  
  .form-row {
    display: flex;
    flex-direction: row;
    gap: 16px;
    margin-bottom: 16px;
  }
  
  @media (max-width: 480px) {
    .form-row {
      flex-direction: column;
      gap: 8px;
    }
  }
  
  .form-row .form-group {
    flex: 1;
    margin-bottom: 0;
  }
  
  label {
    display: block;
    margin-bottom: 8px;
    font-size: 0.9rem;
  }
  
  input, textarea, select {
    width: 100%;
    padding: 10px 12px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background-color: rgba(30, 36, 48, 0.8);
    color: white;
    font-size: 1rem;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
  }
  
  input:focus, textarea:focus, select:focus {
    border-color: #3182CE;
    box-shadow: 0 0 0 2px rgba(49, 130, 206, 0.3);
  }
  
  input::placeholder, textarea::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
  
  textarea {
    resize: vertical;
    min-height: 80px;
  }
  
  .checkbox-group {
    display: flex;
    align-items: center;
  }
  
  .checkbox-label {
    display: flex;
    align-items: center;
    cursor: pointer;
    user-select: none;
  }
  
  .checkbox-label input {
    width: auto;
    margin-right: 8px;
  }
  
  .save-button {
    width: 100%;
    padding: 12px;
    background-color: #3182CE;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
    margin-top: 8px;
  }
  
  .save-button:hover {
    background-color: #2B6CB0;
  }
  
  .save-button:disabled {
    background-color: #64748B;
    cursor: not-allowed;
  }
  
  .error-message {
    background-color: rgba(220, 38, 38, 0.2);
    color: #FCA5A5;
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 16px;
    font-size: 0.9rem;
  }
  
  .success-message {
    background-color: rgba(16, 185, 129, 0.2);
    color: #6EE7B7;
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 16px;
    font-size: 0.9rem;
  }
  
  .login-prompt {
    margin-top: 8px;
    font-style: italic;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
