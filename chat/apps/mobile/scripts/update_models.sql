-- Löschen der vorhandenen Modelle (optional)
-- DELETE FROM models;

-- Einfügen der neuen Modelle mit UUIDs
INSERT INTO models (id, name, description, parameters)
VALUES
  (
    '550e8400-e29b-41d4-a716-446655440000',
    'GPT-O3-Mini',
    'Azure OpenAI O3-Mini: Effizientes Modell für schnelle Antworten.',
    '{"temperature": 0.7, "max_tokens": 800, "provider": "azure", "deployment": "gpt-o3-mini-se", "endpoint": "https://memoroseopenai.openai.azure.com", "api_version": "2024-12-01-preview"}'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440004',
    'GPT-4o-Mini',
    'Azure OpenAI GPT-4o-Mini: Kompaktes, leistungsstarkes KI-Modell.',
    '{"temperature": 0.7, "max_tokens": 1000, "provider": "azure", "deployment": "gpt-4o-mini-se", "endpoint": "https://memoroseopenai.openai.azure.com", "api_version": "2024-12-01-preview"}'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440005',
    'GPT-4o',
    'Azure OpenAI GPT-4o: Das fortschrittlichste multimodale KI-Modell.',
    '{"temperature": 0.7, "max_tokens": 1200, "provider": "azure", "deployment": "gpt-4o-se", "endpoint": "https://memoroseopenai.openai.azure.com", "api_version": "2024-12-01-preview"}'
  )
ON CONFLICT (id) 
DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  parameters = EXCLUDED.parameters;
