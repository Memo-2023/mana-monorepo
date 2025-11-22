-- SQL Statement zum Anlegen der 4 University Student Blueprints
-- KORRIGIERTE VERSION - Nur mit tatsächlich existierenden Prompts
-- Ausführung in Supabase SQL Editor
-- Datum: Januar 2025

DO $$
DECLARE
    blueprint_id_1 UUID;
    blueprint_id_2 UUID;
    blueprint_id_3 UUID;
    blueprint_id_4 UUID;
    system_user_id UUID;
BEGIN
    -- System User ID holen oder aktuellen User verwenden
    SELECT id INTO system_user_id FROM auth.users WHERE email = 'system@memoro.app' LIMIT 1;
    
    IF system_user_id IS NULL THEN
        system_user_id := auth.uid();
    END IF;

    -- ============================================
    -- 1. VORLESUNGSANALYSE / LECTURE ANALYSIS
    -- ============================================
    INSERT INTO blueprints (
        name,
        description,
        is_public,
        user_id,
        category
    ) VALUES (
        jsonb_build_object(
            'de', 'Vorlesungsanalyse',
            'en', 'Lecture Analysis',
            'it', 'Analisi delle Lezioni',
            'fr', 'Analyse de Cours',
            'es', 'Análisis de Clases'
        ),
        jsonb_build_object(
            'de', 'Umfassende Analyse von Vorlesungen mit automatischer Erstellung von Zusammenfassungen und offenen Fragen für die Prüfungsvorbereitung.',
            'en', 'Comprehensive analysis of lectures with automatic creation of summaries and open questions for exam preparation.',
            'it', 'Analisi completa delle lezioni con creazione automatica di riassunti e domande aperte per la preparazione agli esami.',
            'fr', 'Analyse complète des cours avec création automatique de résumés et questions ouvertes pour la préparation aux examens.',
            'es', 'Análisis integral de clases con creación automática de resúmenes y preguntas abiertas para la preparación de exámenes.'
        ),
        true,
        system_user_id,
        jsonb_build_object('id', 'b26c7a49-187d-4429-9dc6-ba55de512a8d', 'name', jsonb_build_object('de', 'Universität', 'en', 'University'))
    ) RETURNING id INTO blueprint_id_1;

    -- Verknüpfung der Prompts für Vorlesungsanalyse
    INSERT INTO prompt_blueprints (blueprint_id, prompt_id, sort_order) VALUES
        (blueprint_id_1, 'c4009bef-4504-4af7-86f5-f896a2412a0a', 1), -- Kurzzusammenfassung
        (blueprint_id_1, '4370cb68-d676-4b93-8afd-2fb7c4ad78c4', 2), -- Ausführliche Zusammenfassung
        (blueprint_id_1, 'c576e875-5a52-4f6a-abb7-0c62c945af78', 3), -- Offene Fragen
        (blueprint_id_1, '47ce3340-e8c6-437c-928d-854c55589491', 4); -- Beantwortete Fragen & Antworten

    -- ============================================
    -- 2. SEMINAR & GRUPPENARBEIT
    -- ============================================
    INSERT INTO blueprints (
        name,
        description,
        is_public,
        user_id,
        category
    ) VALUES (
        jsonb_build_object(
            'de', 'Seminar & Gruppenarbeit',
            'en', 'Seminar & Group Work',
            'it', 'Seminario e Lavoro di Gruppo',
            'fr', 'Séminaire et Travail de Groupe',
            'es', 'Seminario y Trabajo en Grupo'
        ),
        jsonb_build_object(
            'de', 'Perfekt für Seminardiskussionen und Gruppenarbeiten - erfasst Aufgaben, Ideen und erstellt strukturierte Dokumentation.',
            'en', 'Perfect for seminar discussions and group work - captures tasks, ideas, and creates structured documentation.',
            'it', 'Perfetto per discussioni di seminario e lavori di gruppo - cattura compiti, idee e crea documentazione strutturata.',
            'fr', 'Parfait pour les discussions de séminaire et le travail de groupe - capture les tâches, les idées et crée une documentation structurée.',
            'es', 'Perfecto para discusiones de seminario y trabajo en grupo - captura tareas, ideas y crea documentación estructurada.'
        ),
        true,
        system_user_id,
        jsonb_build_object('id', 'b26c7a49-187d-4429-9dc6-ba55de512a8d', 'name', jsonb_build_object('de', 'Universität', 'en', 'University'))
    ) RETURNING id INTO blueprint_id_2;

    -- Verknüpfung der Prompts für Seminar & Gruppenarbeit
    INSERT INTO prompt_blueprints (blueprint_id, prompt_id, sort_order) VALUES
        (blueprint_id_2, '7a6cac9a-5a34-4fe5-a8f6-23f8165b0e48', 1), -- Aufgaben & Termine
        (blueprint_id_2, '8cdc89a5-2f76-4d50-a93d-0c177c3e73ab', 2), -- Gesammelte Ideen & Vorschläge
        (blueprint_id_2, 'c4009bef-4504-4af7-86f5-f896a2412a0a', 3), -- Kurzzusammenfassung
        (blueprint_id_2, 'c576e875-5a52-4f6a-abb7-0c62c945af78', 4); -- Offene Fragen

    -- ============================================
    -- 3. PRÜFUNGSVORBEREITUNG
    -- ============================================
    INSERT INTO blueprints (
        name,
        description,
        is_public,
        user_id,
        category
    ) VALUES (
        jsonb_build_object(
            'de', 'Prüfungsvorbereitung',
            'en', 'Exam Preparation',
            'it', 'Preparazione agli Esami',
            'fr', 'Préparation aux Examens',
            'es', 'Preparación para Exámenes'
        ),
        jsonb_build_object(
            'de', 'Speziell für die intensive Prüfungsvorbereitung - verwandelt Lernmaterial in strukturierte Lernhilfen mit Q&A und Zusammenfassungen.',
            'en', 'Specifically for intensive exam preparation - transforms study material into structured learning aids with Q&A and summaries.',
            'it', 'Specificamente per la preparazione intensiva agli esami - trasforma il materiale di studio in ausili di apprendimento strutturati con Q&A e riassunti.',
            'fr', 'Spécifiquement pour la préparation intensive aux examens - transforme le matériel d''étude en aides d''apprentissage structurées avec Q&R et résumés.',
            'es', 'Específicamente para la preparación intensiva de exámenes - transforma el material de estudio en ayudas de aprendizaje estructuradas con preguntas y respuestas y resúmenes.'
        ),
        true,
        system_user_id,
        jsonb_build_object('id', 'b26c7a49-187d-4429-9dc6-ba55de512a8d', 'name', jsonb_build_object('de', 'Universität', 'en', 'University'))
    ) RETURNING id INTO blueprint_id_3;

    -- Verknüpfung der Prompts für Prüfungsvorbereitung
    INSERT INTO prompt_blueprints (blueprint_id, prompt_id, sort_order) VALUES
        (blueprint_id_3, '47ce3340-e8c6-437c-928d-854c55589491', 1), -- Beantwortete Fragen & Antworten (Q&A für Lernkarten)
        (blueprint_id_3, 'c4009bef-4504-4af7-86f5-f896a2412a0a', 2), -- Kurzzusammenfassung
        (blueprint_id_3, '4370cb68-d676-4b93-8afd-2fb7c4ad78c4', 3), -- Ausführliche Zusammenfassung
        (blueprint_id_3, 'c576e875-5a52-4f6a-abb7-0c62c945af78', 4); -- Offene Fragen (Wissenslücken identifizieren)

    -- ============================================
    -- 4. CONTENT-ERSTELLUNG FÜR STUDIENARBEITEN
    -- ============================================
    INSERT INTO blueprints (
        name,
        description,
        is_public,
        user_id,
        category
    ) VALUES (
        jsonb_build_object(
            'de', 'Content-Erstellung für Studienarbeiten',
            'en', 'Academic Content Creation',
            'it', 'Creazione di Contenuti Accademici',
            'fr', 'Création de Contenu Académique',
            'es', 'Creación de Contenido Académico'
        ),
        jsonb_build_object(
            'de', 'Verwandelt Recherche und Diskussionen in strukturierte Inhalte für Hausarbeiten, Präsentationen und wissenschaftliche Blogs.',
            'en', 'Transforms research and discussions into structured content for term papers, presentations, and academic blogs.',
            'it', 'Trasforma ricerca e discussioni in contenuti strutturati per tesine, presentazioni e blog accademici.',
            'fr', 'Transforme la recherche et les discussions en contenu structuré pour les travaux, présentations et blogs académiques.',
            'es', 'Transforma investigación y discusiones en contenido estructurado para trabajos, presentaciones y blogs académicos.'
        ),
        true,
        system_user_id,
        jsonb_build_object('id', 'b26c7a49-187d-4429-9dc6-ba55de512a8d', 'name', jsonb_build_object('de', 'Universität', 'en', 'University'))
    ) RETURNING id INTO blueprint_id_4;

    -- Verknüpfung der Prompts für Content-Erstellung
    INSERT INTO prompt_blueprints (blueprint_id, prompt_id, sort_order) VALUES
        (blueprint_id_4, '4370cb68-d676-4b93-8afd-2fb7c4ad78c4', 1), -- Ausführliche Zusammenfassung
        (blueprint_id_4, '2c6a6e47-1d0c-441f-9449-b5d908bffba2', 2), -- Blogbeitrag
        (blueprint_id_4, 'b2e39e0a-ec1f-4d0e-813d-f1a08493332b', 3), -- Social Media Posts
        (blueprint_id_4, '8cdc89a5-2f76-4d50-a93d-0c177c3e73ab', 4); -- Gesammelte Ideen & Vorschläge

    -- Erfolgsmeldung
    RAISE NOTICE 'Erfolgreich 4 University Student Blueprints erstellt';
    RAISE NOTICE 'Blueprint 1 (Vorlesungsanalyse): %', blueprint_id_1;
    RAISE NOTICE 'Blueprint 2 (Seminar & Gruppenarbeit): %', blueprint_id_2;
    RAISE NOTICE 'Blueprint 3 (Prüfungsvorbereitung): %', blueprint_id_3;
    RAISE NOTICE 'Blueprint 4 (Content-Erstellung): %', blueprint_id_4;

END $$;

-- ============================================
-- VERIFIKATION
-- ============================================
-- Nach dem Ausführen kannst du mit diesem Query prüfen:

SELECT 
    b.id,
    b.name->>'de' as name_de,
    b.name->>'en' as name_en,
    b.description->>'de' as description_de,
    COUNT(pb.prompt_id) as prompt_count,
    b.created_at
FROM blueprints b
LEFT JOIN prompt_blueprints pb ON b.id = pb.blueprint_id
WHERE b.category->>'id' = 'b26c7a49-187d-4429-9dc6-ba55de512a8d'
GROUP BY b.id, b.name, b.description, b.created_at
ORDER BY b.created_at DESC
LIMIT 4;

-- Details zu den verknüpften Prompts anzeigen:
/*
SELECT 
    b.name->>'de' as blueprint_name,
    p.memory_title->>'de' as prompt_name,
    pb.sort_order
FROM blueprints b
JOIN prompt_blueprints pb ON b.id = pb.blueprint_id
JOIN prompts p ON pb.prompt_id = p.id
WHERE b.category->>'id' = 'b26c7a49-187d-4429-9dc6-ba55de512a8d'
ORDER BY b.created_at DESC, pb.sort_order;
*/

-- ============================================
-- HINWEIS ZU DEN VERFÜGBAREN PROMPTS
-- ============================================
-- In der Datenbank sind nur 8 Prompts verfügbar:
-- 1. c4009bef-4504-4af7-86f5-f896a2412a0a - Kurzzusammenfassung
-- 2. 4370cb68-d676-4b93-8afd-2fb7c4ad78c4 - Ausführliche Zusammenfassung
-- 3. 7a6cac9a-5a34-4fe5-a8f6-23f8165b0e48 - Aufgaben & Termine
-- 4. c576e875-5a52-4f6a-abb7-0c62c945af78 - Offene Fragen
-- 5. 47ce3340-e8c6-437c-928d-854c55589491 - Beantwortete Fragen & Antworten
-- 6. 2c6a6e47-1d0c-441f-9449-b5d908bffba2 - Blogbeitrag
-- 7. b2e39e0a-ec1f-4d0e-813d-f1a08493332b - Social Media Posts
-- 8. 8cdc89a5-2f76-4d50-a93d-0c177c3e73ab - Gesammelte Ideen & Vorschläge
--
-- Der Prompt "Schlüsselpunkte" (9b411221-6f52-4534-9ea9-dd1904259e8c) existiert NICHT!