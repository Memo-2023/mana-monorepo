// Einfaches Skript zum Testen der Azure OpenAI API
const fetch = require('node-fetch');

async function testAzureOpenAI() {
  const config = {
    endpoint: 'https://memoroseopenai.openai.azure.com',
    deployment: 'gpt-o3-mini-se',
    apiVersion: '2024-12-01-preview',
    apiKey: '3082103c9b0d4270a795686ccaa89921',
  };

  const url = `${config.endpoint}/openai/deployments/${config.deployment}/chat/completions?api-version=${config.apiVersion}`;
  
  console.log('Sende Anfrage an:', url);
  console.log('API-Key (gekürzt):', config.apiKey.substring(0, 5) + '...' + config.apiKey.substring(config.apiKey.length - 5));
  
  const requestBody = {
    messages: [
      { role: 'system', content: 'Du bist ein hilfreicher Assistent.' },
      { role: 'user', content: 'Hallo, wie geht es dir?' }
    ],
    max_completion_tokens: 800,
  };
  
  console.log('Request Body:', JSON.stringify(requestBody, null, 2));
  
  try {
    console.log('Sende Anfrage...');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Antwort-Status:', response.status, response.statusText);
    console.log('Antwort-Headers:', JSON.stringify(Object.fromEntries([...response.headers.entries()]), null, 2));
    
    const responseText = await response.text();
    console.log('Antwort-Text-Länge:', responseText.length);
    console.log('Antwort-Text (gekürzt):', responseText.length > 1000 ? 
      responseText.substring(0, 500) + '\n...\n' + responseText.substring(responseText.length - 500) : 
      responseText);
    
    try {
      const data = JSON.parse(responseText);
      console.log('Geparste Antwort:', JSON.stringify(data, null, 2));
      
      if (data.choices && data.choices.length > 0) {
        const message = data.choices[0].message;
        if (message && message.content) {
          console.log('Antwort des Assistenten:', message.content);
        } else {
          console.error('Unerwartetes Antwortformat:', data.choices[0]);
        }
      } else {
        console.error('Keine choices in der Antwort gefunden');
      }
    } catch (parseError) {
      console.error('Fehler beim Parsen der Antwort:', parseError);
    }
  } catch (error) {
    console.error('Fehler bei der API-Anfrage:', error);
    if (error.response) {
      console.error('Fehler-Response:', await error.response.text());
    }
    console.error('Stack:', error.stack);
  }
}

// Führe den Test aus
testAzureOpenAI().then(() => {
  console.log('Test abgeschlossen');
}).catch(err => {
  console.error('Unbehandelter Fehler:', err);
});

testAzureOpenAI();
