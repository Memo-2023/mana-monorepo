import { createSignal, onMount, For } from 'solid-js';

interface Model {
  name: string;
  size: string;
  speed: string;
  accuracy: string;
}

const API_URL = 'http://localhost:8000';

export default function Settings() {
  const [models, setModels] = createSignal<Model[]>([]);
  const [selectedModel, setSelectedModel] = createSignal('base');
  const [selectedLanguage, setSelectedLanguage] = createSignal('de');
  const [maxParallelDownloads, setMaxParallelDownloads] = createSignal(3);
  const [maxParallelTranscriptions, setMaxParallelTranscriptions] = createSignal(2);
  const [isSaving, setIsSaving] = createSignal(false);

  onMount(() => {
    fetchModels();
    loadSettings();
  });

  const fetchModels = async () => {
    try {
      const response = await fetch(`${API_URL}/api/models`);
      const data = await response.json();
      setModels(data.models);
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const loadSettings = () => {
    // Load from localStorage
    const saved = localStorage.getItem('transcriber-settings');
    if (saved) {
      const settings = JSON.parse(saved);
      setSelectedModel(settings.model || 'base');
      setSelectedLanguage(settings.language || 'de');
      setMaxParallelDownloads(settings.maxDownloads || 3);
      setMaxParallelTranscriptions(settings.maxTranscriptions || 2);
    }
  };

  const saveSettings = () => {
    setIsSaving(true);
    const settings = {
      model: selectedModel(),
      language: selectedLanguage(),
      maxDownloads: maxParallelDownloads(),
      maxTranscriptions: maxParallelTranscriptions()
    };
    
    localStorage.setItem('transcriber-settings', JSON.stringify(settings));
    
    setTimeout(() => {
      setIsSaving(false);
      alert('Einstellungen gespeichert!');
    }, 500);
  };

  const getModelColor = (name: string) => {
    switch(name) {
      case 'tiny': return 'text-green-400';
      case 'base': return 'text-blue-400';
      case 'small': return 'text-yellow-400';
      case 'medium': return 'text-orange-400';
      case 'large': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div class="max-w-4xl mx-auto space-y-6">
      <h1 class="text-2xl font-bold mb-6">Einstellungen</h1>

      {/* Model Selection */}
      <div class="bg-gray-800 p-6 rounded-lg">
        <h2 class="text-xl font-bold mb-4">Whisper Modell</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <For each={models()}>
            {(model) => (
              <div
                class={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedModel() === model.name
                    ? 'border-blue-500 bg-blue-900/30'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
                onClick={() => setSelectedModel(model.name)}
              >
                <h3 class={`font-bold text-lg mb-2 ${getModelColor(model.name)}`}>
                  {model.name.toUpperCase()}
                </h3>
                <div class="space-y-1 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-400">Größe:</span>
                    <span class="text-white">{model.size}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-400">Speed:</span>
                    <span class="text-white">{model.speed}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-400">Genauigkeit:</span>
                    <span class="text-white">{model.accuracy}</span>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Language Selection */}
      <div class="bg-gray-800 p-6 rounded-lg">
        <h2 class="text-xl font-bold mb-4">Sprache</h2>
        <select
          value={selectedLanguage()}
          onChange={(e) => setSelectedLanguage(e.currentTarget.value)}
          class="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="de">Deutsch</option>
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="it">Italiano</option>
          <option value="pt">Português</option>
          <option value="nl">Nederlands</option>
          <option value="pl">Polski</option>
          <option value="ru">Русский</option>
          <option value="zh">中文</option>
          <option value="ja">日本語</option>
          <option value="ko">한국어</option>
        </select>
      </div>

      {/* Parallel Processing Settings */}
      <div class="bg-gray-800 p-6 rounded-lg">
        <h2 class="text-xl font-bold mb-4">Parallel-Verarbeitung</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-2">
              Max. parallele Downloads: {maxParallelDownloads()}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={maxParallelDownloads()}
              onInput={(e) => setMaxParallelDownloads(parseInt(e.currentTarget.value))}
              class="w-full"
            />
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>1 (Langsam)</span>
              <span>3 (Standard)</span>
              <span>5 (Schnell)</span>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-400 mb-2">
              Max. parallele Transkriptionen: {maxParallelTranscriptions()}
            </label>
            <input
              type="range"
              min="1"
              max="4"
              value={maxParallelTranscriptions()}
              onInput={(e) => setMaxParallelTranscriptions(parseInt(e.currentTarget.value))}
              class="w-full"
            />
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>1 (Wenig RAM)</span>
              <span>2 (Standard)</span>
              <span>4 (Viel RAM)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Tips */}
      <div class="bg-gray-800 p-6 rounded-lg">
        <h2 class="text-xl font-bold mb-4">⚡ Performance-Tipps</h2>
        <ul class="space-y-2 text-sm text-gray-300">
          <li class="flex items-start">
            <span class="mr-2">•</span>
            <span><strong>Tiny:</strong> Perfekt für schnelle Tests und Previews</span>
          </li>
          <li class="flex items-start">
            <span class="mr-2">•</span>
            <span><strong>Base/Small:</strong> Guter Kompromiss für die meisten Videos</span>
          </li>
          <li class="flex items-start">
            <span class="mr-2">•</span>
            <span><strong>Large:</strong> Beste Qualität für wichtige Transkriptionen</span>
          </li>
          <li class="flex items-start">
            <span class="mr-2">•</span>
            <span>Mehr parallele Downloads = Schneller, aber mehr Bandbreite</span>
          </li>
          <li class="flex items-start">
            <span class="mr-2">•</span>
            <span>Mehr parallele Transkriptionen = Schneller, aber mehr RAM-Verbrauch</span>
          </li>
        </ul>
      </div>

      {/* Save Button */}
      <div class="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={isSaving()}
          class="px-8 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-semibold"
        >
          {isSaving() ? 'Speichere...' : 'Einstellungen speichern'}
        </button>
      </div>

      {/* System Info */}
      <div class="bg-gray-800 p-6 rounded-lg">
        <h2 class="text-xl font-bold mb-4">System-Info</h2>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-400">API Server:</span>
            <span class="ml-2 text-green-400">Online</span>
          </div>
          <div>
            <span class="text-gray-400">Version:</span>
            <span class="ml-2 text-white">4.0 Parallel</span>
          </div>
          <div>
            <span class="text-gray-400">Platform:</span>
            <span class="ml-2 text-white">macOS (Apple Silicon)</span>
          </div>
          <div>
            <span class="text-gray-400">API Endpoint:</span>
            <span class="ml-2 text-white">{API_URL}</span>
          </div>
        </div>
      </div>
    </div>
  );
}