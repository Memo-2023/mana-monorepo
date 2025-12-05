// Zentraler Daten-Store für Software-Informationen
document.addEventListener('alpine:init', () => {
  Alpine.store('software', {
    // Aktuelle Software, die im Detail angezeigt wird (aus MD-Datei geladen)
    current: null,
    
    // Software zum Vergleich (über API geladen)
    comparison: null,
    
    // Ähnliche Software-Optionen
    similar: [],
    
    // Status-Flags
    loading: false,
    error: null,
    
    // Modus-Flags
    compareMode: false,
    
    // Lädt Vergleichssoftware über API
    async loadComparisonSoftware(id, locale) {
      if (!id) return;
      
      this.loading = true;
      this.error = null;
      
      try {
        console.log(`Loading software data for ${id} in locale ${locale}`);
        const response = await fetch(`/api/software/${id}.json?lang=${locale}`);
        
        if (!response.ok) {
          throw new Error(`Error loading software: ${response.status}`);
        }
        
        const data = await response.json();
        this.comparison = data;
        console.log("Software data loaded:", data);
        
        return data;
      } catch (error) {
        console.error('Error loading comparison software:', error);
        this.error = 'Failed to load software data. Please try again.';
      } finally {
        this.loading = false;
      }
    },
    
    // Setzt den aktuellen Vergleichsmodus
    setCompareMode(mode) {
      console.log(`Setting compare mode to: ${mode}`);
      this.compareMode = mode;
      
      if (!mode) {
        // Bei Beenden des Vergleichsmodus Daten zurücksetzen
        this.comparison = null;
      }
    },
    
    // Initialisiert ähnliche Software-Optionen
    initSimilarSoftware(similarOptions) {
      this.similar = similarOptions || [];
      console.log(`Initialized ${this.similar.length} similar software options`);
    },
    
    // Initialisiert die aktuelle Software
    initCurrentSoftware(software) {
      this.current = software;
      console.log("Current software initialized:", software.name);
    }
  });
  
  // Debugging-Hilfsfunktion - nach Alpine-Initialisierung verfügbar
  window.debugAlpine = function() {
    console.log("Alpine Software Store:", Alpine.store('software'));
  };
});