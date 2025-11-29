-- SQL Befehl zum Anlegen der Office/Büro-Blueprints
-- Unterstützte Sprachen: de, en, it, fr, es
-- Mit einheitlicher Kategorie-ID für alle Office-Blueprints

DO $$
DECLARE
    blueprint_id_1 UUID;
    blueprint_id_2 UUID;
    blueprint_id_3 UUID;
    blueprint_id_4 UUID;
    system_user_id UUID;
    office_category_id UUID := '5ebf0443-7434-4624-949f-a69b019beb7a'; -- Feste ID für Office-Kategorie (aus existierenden Daten)
BEGIN
    -- System User ID holen oder NULL verwenden
    SELECT id INTO system_user_id FROM auth.users WHERE email = 'system@memoro.app' LIMIT 1;
    
    -- ============================================
    -- 1. MEETING-PROTOKOLL & FOLLOW-UP
    -- ============================================
    INSERT INTO blueprints (
        name,
        description,
        is_public,
        user_id,
        category
    ) VALUES (
        jsonb_build_object(
            'de', 'Meeting-Protokoll & Follow-Up',
            'en', 'Meeting Minutes & Follow-Up',
            'it', 'Verbale di riunione e follow-up',
            'fr', 'Compte-rendu de réunion et suivi',
            'es', 'Acta de reunión y seguimiento'
        ),
        jsonb_build_object(
            'de', 'Erstellt strukturierte Meeting-Protokolle mit Entscheidungen, Aufgaben und Terminen. Perfekt für effiziente Nachbereitung und klare Verantwortlichkeiten.',
            'en', 'Creates structured meeting minutes with decisions, tasks, and deadlines. Perfect for efficient follow-up and clear responsibilities.',
            'it', 'Crea verbali di riunione strutturati con decisioni, compiti e scadenze. Perfetto per un follow-up efficiente e responsabilità chiare.',
            'fr', 'Crée des comptes-rendus de réunion structurés avec décisions, tâches et échéances. Parfait pour un suivi efficace et des responsabilités claires.',
            'es', 'Crea actas de reunión estructuradas con decisiones, tareas y plazos. Perfecto para un seguimiento eficiente y responsabilidades claras.'
        ),
        true,
        system_user_id,
        jsonb_build_object(
            'id', office_category_id,
            'name', jsonb_build_object(
                'de', 'Büro',
                'en', 'Office'
            )
        )
    ) RETURNING id INTO blueprint_id_1;

    -- Verknüpfung der Prompts für Meeting-Protokoll
    INSERT INTO prompt_blueprints (blueprint_id, prompt_id, sort_order) VALUES
        (blueprint_id_1, 'c4009bef-4504-4af7-86f5-f896a2412a0a', 1), -- Kurzzusammenfassung
        (blueprint_id_1, '4370cb68-d676-4b93-8afd-2fb7c4ad78c4', 2), -- Ausführliche Zusammenfassung
        (blueprint_id_1, '7a6cac9a-5a34-4fe5-a8f6-23f8165b0e48', 3), -- Aufgaben & Termine
        (blueprint_id_1, 'c576e875-5a52-4f6a-abb7-0c62c945af78', 4); -- Offene Fragen

    -- ============================================
    -- 2. BRAINSTORMING & IDEENENTWICKLUNG
    -- ============================================
    INSERT INTO blueprints (
        name,
        description,
        is_public,
        user_id,
        category
    ) VALUES (
        jsonb_build_object(
            'de', 'Brainstorming & Ideenentwicklung',
            'en', 'Brainstorming & Idea Development',
            'it', 'Brainstorming e sviluppo idee',
            'fr', 'Brainstorming et développement d''idées',
            'es', 'Lluvia de ideas y desarrollo de ideas'
        ),
        jsonb_build_object(
            'de', 'Erfasst und strukturiert kreative Sessions, Workshops und Strategieentwicklung. Dokumentiert alle Ideen und priorisiert Umsetzungsschritte.',
            'en', 'Captures and structures creative sessions, workshops, and strategy development. Documents all ideas and prioritizes implementation steps.',
            'it', 'Cattura e struttura sessioni creative, workshop e sviluppo strategico. Documenta tutte le idee e dà priorità ai passi di implementazione.',
            'fr', 'Capture et structure les sessions créatives, ateliers et développement de stratégie. Documente toutes les idées et priorise les étapes de mise en œuvre.',
            'es', 'Captura y estructura sesiones creativas, talleres y desarrollo de estrategias. Documenta todas las ideas y prioriza los pasos de implementación.'
        ),
        true,
        system_user_id,
        jsonb_build_object(
            'id', office_category_id,
            'name', jsonb_build_object(
                'de', 'Büro',
                'en', 'Office'
            )
        )
    ) RETURNING id INTO blueprint_id_2;

    -- Verknüpfung der Prompts für Brainstorming
    INSERT INTO prompt_blueprints (blueprint_id, prompt_id, sort_order) VALUES
        (blueprint_id_2, 'c4009bef-4504-4af7-86f5-f896a2412a0a', 1), -- Kurzzusammenfassung
        (blueprint_id_2, '8cdc89a5-2f76-4d50-a93d-0c177c3e73ab', 2), -- Gesammelte Ideen & Vorschläge
        (blueprint_id_2, '7a6cac9a-5a34-4fe5-a8f6-23f8165b0e48', 3), -- Aufgaben & Termine
        (blueprint_id_2, '2c6a6e47-1d0c-441f-9449-b5d908bffba2', 4); -- Blogbeitrag

    -- ============================================
    -- 3. PROJEKTBESPRECHUNG & STATUSUPDATE
    -- ============================================
    INSERT INTO blueprints (
        name,
        description,
        is_public,
        user_id,
        category
    ) VALUES (
        jsonb_build_object(
            'de', 'Projektbesprechung & Statusupdate',
            'en', 'Project Meeting & Status Update',
            'it', 'Riunione di progetto e aggiornamento stato',
            'fr', 'Réunion de projet et mise à jour du statut',
            'es', 'Reunión de proyecto y actualización de estado'
        ),
        jsonb_build_object(
            'de', 'Dokumentiert Projektfortschritt, Meilensteine und Hindernisse. Ideal für Steering Committees, Sprint Reviews und Stakeholder-Updates.',
            'en', 'Documents project progress, milestones, and obstacles. Ideal for steering committees, sprint reviews, and stakeholder updates.',
            'it', 'Documenta i progressi del progetto, le pietre miliari e gli ostacoli. Ideale per comitati direttivi, sprint review e aggiornamenti agli stakeholder.',
            'fr', 'Documente les progrès du projet, les jalons et les obstacles. Idéal pour les comités de pilotage, les revues de sprint et les mises à jour des parties prenantes.',
            'es', 'Documenta el progreso del proyecto, hitos y obstáculos. Ideal para comités directivos, revisiones de sprint y actualizaciones a las partes interesadas.'
        ),
        true,
        system_user_id,
        jsonb_build_object(
            'id', office_category_id,
            'name', jsonb_build_object(
                'de', 'Büro',
                'en', 'Office'
            )
        )
    ) RETURNING id INTO blueprint_id_3;

    -- Verknüpfung der Prompts für Projektbesprechung
    INSERT INTO prompt_blueprints (blueprint_id, prompt_id, sort_order) VALUES
        (blueprint_id_3, 'c4009bef-4504-4af7-86f5-f896a2412a0a', 1), -- Kurzzusammenfassung
        (blueprint_id_3, '4370cb68-d676-4b93-8afd-2fb7c4ad78c4', 2), -- Ausführliche Zusammenfassung
        (blueprint_id_3, '7a6cac9a-5a34-4fe5-a8f6-23f8165b0e48', 3), -- Aufgaben & Termine
        (blueprint_id_3, 'c576e875-5a52-4f6a-abb7-0c62c945af78', 4); -- Offene Fragen

    -- ============================================
    -- 4. KOMMUNIKATIONS-CONTENT
    -- ============================================
    INSERT INTO blueprints (
        name,
        description,
        is_public,
        user_id,
        category
    ) VALUES (
        jsonb_build_object(
            'de', 'Kommunikations-Content',
            'en', 'Communication Content',
            'it', 'Contenuti di comunicazione',
            'fr', 'Contenu de communication',
            'es', 'Contenido de comunicación'
        ),
        jsonb_build_object(
            'de', 'Verwandelt Besprechungen und Präsentationen in professionelle Kommunikationsinhalte für verschiedene Kanäle und Zielgruppen.',
            'en', 'Transforms meetings and presentations into professional communication content for various channels and audiences.',
            'it', 'Trasforma riunioni e presentazioni in contenuti di comunicazione professionali per vari canali e pubblici.',
            'fr', 'Transforme les réunions et présentations en contenu de communication professionnel pour divers canaux et publics.',
            'es', 'Transforma reuniones y presentaciones en contenido de comunicación profesional para varios canales y audiencias.'
        ),
        true,
        system_user_id,
        jsonb_build_object(
            'id', office_category_id,
            'name', jsonb_build_object(
                'de', 'Büro',
                'en', 'Office'
            )
        )
    ) RETURNING id INTO blueprint_id_4;

    -- Verknüpfung der Prompts für Kommunikations-Content
    INSERT INTO prompt_blueprints (blueprint_id, prompt_id, sort_order) VALUES
        (blueprint_id_4, 'c4009bef-4504-4af7-86f5-f896a2412a0a', 1), -- Kurzzusammenfassung
        (blueprint_id_4, '2c6a6e47-1d0c-441f-9449-b5d908bffba2', 2), -- Blogbeitrag
        (blueprint_id_4, 'b2e39e0a-ec1f-4d0e-813d-f1a08493332b', 3), -- Social Media Posts
        (blueprint_id_4, '4370cb68-d676-4b93-8afd-2fb7c4ad78c4', 4); -- Ausführliche Zusammenfassung

    -- Erfolgsmeldung
    RAISE NOTICE 'Erfolgreich 4 Office/Büro Blueprints erstellt';
    RAISE NOTICE 'Blueprint 1 (Meeting-Protokoll): %', blueprint_id_1;
    RAISE NOTICE 'Blueprint 2 (Brainstorming): %', blueprint_id_2;
    RAISE NOTICE 'Blueprint 3 (Projektbesprechung): %', blueprint_id_3;
    RAISE NOTICE 'Blueprint 4 (Kommunikations-Content): %', blueprint_id_4;

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
WHERE b.category->>'id' = '5ebf0443-7434-4624-949f-a69b019beb7a'
GROUP BY b.id, b.name, b.description, b.created_at
ORDER BY b.created_at DESC
LIMIT 10;

-- Details zu den verknüpften Prompts anzeigen:
/*
SELECT 
    b.name->>'de' as blueprint_name,
    p.memory_title->>'de' as prompt_name,
    pb.sort_order
FROM blueprints b
JOIN prompt_blueprints pb ON b.id = pb.blueprint_id
JOIN prompts p ON pb.prompt_id = p.id
WHERE b.category->>'id' = '5ebf0443-7434-4624-949f-a69b019beb7a'
AND b.created_at >= NOW() - INTERVAL '1 hour'
ORDER BY b.name->>'de', pb.sort_order;
*/