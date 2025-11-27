<script lang="ts">
  import { AuthService } from '../../services/AuthService';
  import { createEventDispatcher } from 'svelte';

  // Event-Dispatcher für Kommunikation mit übergeordneten Komponenten
  const dispatch = createEventDispatcher();

  // Formular-Zustände
  let email = '';
  let isLoading = false;
  let errorMessage = '';
  let successMessage = '';

  // Formular absenden
  async function handleSubmit() {
    if (!email) {
      errorMessage = 'Bitte gib deine E-Mail-Adresse ein.';
      return;
    }

    try {
      isLoading = true;
      errorMessage = '';
      
      const success = await AuthService.resetPassword(email);
      
      if (success) {
        successMessage = 'Eine E-Mail zum Zurücksetzen deines Passworts wurde gesendet. Bitte überprüfe deinen Posteingang.';
        // Formular zurücksetzen
        email = '';
      } else {
        errorMessage = 'Fehler beim Senden der E-Mail. Bitte versuche es später erneut.';
      }
    } catch (error) {
      errorMessage = 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.';
      console.error('Password reset error:', error);
    } finally {
      isLoading = false;
    }
  }

  // Zum Login wechseln
  function switchToLogin() {
    dispatch('switchView', 'login');
  }
</script>

<div class="auth-form-container">
  <h2>Passwort zurücksetzen</h2>
  
  {#if errorMessage}
    <div class="error-message">
      {errorMessage}
    </div>
  {/if}
  
  {#if successMessage}
    <div class="success-message">
      {successMessage}
    </div>
  {/if}
  
  <form on:submit|preventDefault={handleSubmit}>
    <div class="form-group">
      <label for="email">E-Mail</label>
      <input 
        type="email" 
        id="email" 
        bind:value={email} 
        placeholder="deine@email.de" 
        disabled={isLoading}
        required
      />
    </div>
    
    <button 
      type="submit" 
      class="auth-button" 
      disabled={isLoading}
    >
      {isLoading ? 'Wird gesendet...' : 'Passwort zurücksetzen'}
    </button>
  </form>
  
  <div class="auth-links">
    <button 
      type="button" 
      class="text-button" 
      on:click={switchToLogin}
      disabled={isLoading}
    >
      Zurück zum Login
    </button>
  </div>
</div>

<style>
  .auth-form-container {
    background-color: rgba(42, 50, 66, 0.9);
    border-radius: 8px;
    padding: 24px;
    width: 100%;
    max-width: 400px;
    min-width: 280px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    box-sizing: border-box;
  }
  
  h2 {
    color: white;
    margin-top: 0;
    margin-bottom: 24px;
    text-align: center;
    font-size: 1.5rem;
  }
  
  .form-group {
    margin-bottom: 16px;
  }
  
  label {
    display: block;
    color: white;
    margin-bottom: 8px;
    font-size: 0.9rem;
  }
  
  input {
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
  
  input:focus {
    border-color: #3182CE;
    box-shadow: 0 0 0 2px rgba(49, 130, 206, 0.3);
  }
  
  input::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
  
  .auth-button {
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
    box-sizing: border-box;
  }
  
  .auth-button:hover {
    background-color: #2B6CB0;
  }
  
  .auth-button:disabled {
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
  
  .auth-links {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  
  .text-button {
    background: none;
    border: none;
    color: #63B3ED;
    cursor: pointer;
    font-size: 0.9rem;
    padding: 0;
    text-decoration: underline;
    transition: color 0.2s;
  }
  
  .text-button:hover {
    color: #90CDF4;
  }
  
  .text-button:disabled {
    color: #64748B;
    cursor: not-allowed;
  }
</style>
