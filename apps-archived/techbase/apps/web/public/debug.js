// Debug-Hilfsfunktionen
console.log('Debug-Tools geladen');

// Listener für fetch-Anfragen
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('Fetch Request:', args[0], args[1]);
  return originalFetch.apply(this, args)
    .then(response => {
      if (!response.ok) {
        console.error('Fetch error:', response.status, response.statusText, response.url);
      }
      return response.clone()
        .text()
        .then(text => {
          try {
            const data = JSON.parse(text);
            console.log('Fetch Response:', data);
          } catch (e) {
            console.log('Fetch Response (nicht-JSON):', text.substring(0, 500));
          }
          return response;
        })
        .catch(err => {
          console.error('Error parsing response:', err);
          return response;
        });
    })
    .catch(error => {
      console.error('Fetch failed:', error);
      throw error;
    });
};