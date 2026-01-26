-- Migration: Add Ollama Gemma 3 4B model
-- Run this on existing databases to add the local Ollama model

-- Insert Ollama model if it doesn't exist
INSERT INTO models (id, name, description, provider, parameters, is_active, is_default, created_at, updated_at)
VALUES (
    '550e8400-e29b-41d4-a716-446655440101',
    'Gemma 3 4B (Lokal)',
    'Schnelles lokales Modell - kostenlos, läuft auf Mac Mini',
    'ollama',
    '{"model": "gemma3:4b", "temperature": 0.7, "max_tokens": 4096}',
    true,
    true,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    provider = EXCLUDED.provider,
    parameters = EXCLUDED.parameters,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Set the new Ollama model as default and unset others
UPDATE models SET is_default = false WHERE id != '550e8400-e29b-41d4-a716-446655440101';
UPDATE models SET is_default = true WHERE id = '550e8400-e29b-41d4-a716-446655440101';

-- Verify
SELECT id, name, provider, is_default FROM models ORDER BY is_default DESC, name;
