export interface SpeechServiceConfig {
  key: string;
  endpoint: string;
  region: string;
  name: string;
}

export const BATCH_ENDPOINT_BASE = 'https://swedencentral.api.cognitive.microsoft.com/speechtotext';

export function getAvailableSpeechServices(): SpeechServiceConfig[] {
  const region = process.env.AZURE_SPEECH_REGION || 'swedencentral';
  const endpoint = `https://${region}.api.cognitive.microsoft.com/speechtotext/transcriptions:transcribe`;
  const batchBase = `https://${region}.api.cognitive.microsoft.com/speechtotext`;

  const services: SpeechServiceConfig[] = [];

  // Try numbered keys first (AZURE_SPEECH_KEY_1 through AZURE_SPEECH_KEY_4)
  for (let i = 1; i <= 4; i++) {
    const key = process.env[`AZURE_SPEECH_KEY_${i}`];
    if (key) {
      services.push({
        key,
        endpoint,
        region,
        name: `azure-speech-${i}`,
      });
    }
  }

  // Fall back to single key if no numbered keys found
  if (services.length === 0) {
    const key = process.env.AZURE_SPEECH_KEY;
    if (key) {
      services.push({
        key,
        endpoint,
        region,
        name: 'azure-speech-default',
      });
    }
  }

  if (services.length === 0) {
    throw new Error('No Azure Speech credentials configured. Set AZURE_SPEECH_KEY_1..4 or AZURE_SPEECH_KEY.');
  }

  console.log(`[Azure] Available speech services: ${services.map((s) => s.name).join(', ')}`);

  return services;
}

export function pickRandomService(services: SpeechServiceConfig[]): SpeechServiceConfig {
  if (services.length === 0) {
    throw new Error('No speech services available');
  }
  const index = Math.floor(Math.random() * services.length);
  const service = services[index];
  console.log(`[Azure] Selected service: ${service.name} (${index + 1}/${services.length})`);
  return service;
}
