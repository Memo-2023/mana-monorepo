// Simple Azure OpenAI API Test
const fetch = require('node-fetch');

async function testAzureOpenAI() {
  const apiKey = '3082103c9b0d4270a795686ccaa89921';
  const endpoint = 'https://memoroseopenai.openai.azure.com';
  const deployment = 'gpt-o3-mini-se';
  const apiVersion = '2024-12-01-preview';

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
  
  const messages = [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Hello, who are you?" }
  ];
  
  try {
    console.log("Sending request to:", url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        messages: messages,
        max_completion_tokens: 800
      })
    });
    
    const status = response.status;
    console.log("Response status:", status);
    
    const data = await response.text();
    console.log("Response data:", data);
    
    if (!response.ok) {
      console.error("Error:", data);
    } else {
      const jsonData = JSON.parse(data);
      console.log("Content:", jsonData.choices[0].message.content);
    }
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

// Run the test
testAzureOpenAI().catch(console.error);