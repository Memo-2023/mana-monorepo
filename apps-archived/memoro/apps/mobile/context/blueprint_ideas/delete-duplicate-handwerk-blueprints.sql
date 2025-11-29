-- SQL Befehl zum Löschen der fehlerhaft angelegten Handwerk-Blueprints
-- (mit den mehrfachen Kategorie-IDs)

DO $$
DECLARE
    deleted_count INTEGER := 0;
    deleted_prompts_count INTEGER := 0;
BEGIN
    -- Zuerst die verknüpften Prompts löschen
    DELETE FROM prompt_blueprints
    WHERE blueprint_id IN (
        SELECT id 
        FROM blueprints 
        WHERE category->'name'->>'de' = 'Handwerk'
        AND category->>'id' != 'a1b2c3d4-5678-90ab-cdef-123456789012'
    );
    
    GET DIAGNOSTICS deleted_prompts_count = ROW_COUNT;
    
    -- Dann die Blueprints selbst löschen
    DELETE FROM blueprints
    WHERE category->'name'->>'de' = 'Handwerk'
    AND category->>'id' != 'a1b2c3d4-5678-90ab-cdef-123456789012';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Erfolgsmeldung
    RAISE NOTICE 'Gelöscht: % fehlerhafte Handwerk-Blueprints', deleted_count;
    RAISE NOTICE 'Gelöscht: % verknüpfte Prompt-Einträge', deleted_prompts_count;
    
END $$;

-- ============================================
-- ALTERNATIVE: Falls du ALLE Handwerk-Blueprints löschen möchtest
-- (auch die mit der korrekten Kategorie-ID)
-- ============================================
/*
DO $$
DECLARE
    deleted_count INTEGER := 0;
    deleted_prompts_count INTEGER := 0;
BEGIN
    -- Zuerst die verknüpften Prompts löschen
    DELETE FROM prompt_blueprints
    WHERE blueprint_id IN (
        SELECT id 
        FROM blueprints 
        WHERE category->'name'->>'de' = 'Handwerk'
    );
    
    GET DIAGNOSTICS deleted_prompts_count = ROW_COUNT;
    
    -- Dann die Blueprints selbst löschen
    DELETE FROM blueprints
    WHERE category->'name'->>'de' = 'Handwerk';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Erfolgsmeldung
    RAISE NOTICE 'Gelöscht: % Handwerk-Blueprints', deleted_count;
    RAISE NOTICE 'Gelöscht: % verknüpfte Prompt-Einträge', deleted_prompts_count;
    
END $$;
*/

-- ============================================
-- VERIFIKATION - Zeige verbleibende Handwerk-Blueprints
-- ============================================
SELECT 
    b.id,
    b.name->>'de' as name_de,
    b.category->>'id' as category_id,
    b.category->'name'->>'de' as category_name,
    COUNT(pb.prompt_id) as prompt_count,
    b.created_at
FROM blueprints b
LEFT JOIN prompt_blueprints pb ON b.id = pb.blueprint_id
WHERE b.category->'name'->>'de' = 'Handwerk'
GROUP BY b.id, b.name, b.category, b.created_at
ORDER BY b.created_at DESC;