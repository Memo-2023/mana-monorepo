-- SQL Befehl zum Anlegen der Handwerk-Blueprints
-- Unterstützte Sprachen: de, en, it, fr, es
-- KORRIGIERTE VERSION - Einheitliche Kategorie-ID für alle Handwerk-Blueprints

DO $$
DECLARE
    blueprint_id_1 UUID;
    blueprint_id_2 UUID;
    blueprint_id_3 UUID;
    blueprint_id_4 UUID;
    system_user_id UUID;
    handwerk_category_id UUID := 'a1b2c3d4-5678-90ab-cdef-123456789012'; -- Feste ID für Handwerk-Kategorie
BEGIN
    -- System User ID holen oder NULL verwenden
    SELECT id INTO system_user_id FROM auth.users WHERE email = 'system@memoro.app' LIMIT 1;
    
    -- ============================================
    -- 1. KUNDENGESPRÄCH & ANGEBOTSERSTELLUNG
    -- ============================================
    INSERT INTO blueprints (
        name,
        description,
        is_public,
        user_id,
        category
    ) VALUES (
        jsonb_build_object(
            'de', 'Kundengespräch & Angebotserstellung',
            'en', 'Customer Meeting & Quote Preparation',
            'it', 'Colloquio con il cliente e preparazione preventivo',
            'fr', 'Entretien client et préparation de devis',
            'es', 'Reunión con cliente y preparación de presupuesto'
        ),
        jsonb_build_object(
            'de', 'Dokumentiert Kundenwünsche und erstellt Angebotsgrundlagen',
            'en', 'Documents customer requirements and creates quote foundations',
            'it', 'Documenta i requisiti del cliente e crea le basi per il preventivo',
            'fr', 'Documente les exigences du client et crée les bases du devis',
            'es', 'Documenta los requisitos del cliente y crea las bases del presupuesto'
        ),
        true,
        system_user_id,
        jsonb_build_object(
            'id', handwerk_category_id,
            'name', jsonb_build_object(
                'de', 'Handwerk',
                'en', 'Crafts & Trades'
            )
        )
    ) RETURNING id INTO blueprint_id_1;

    -- Verknüpfung der Prompts für Kundengespräch
    INSERT INTO prompt_blueprints (blueprint_id, prompt_id, sort_order) VALUES
        (blueprint_id_1, 'c4009bef-4504-4af7-86f5-f896a2412a0a', 1), -- Kurzzusammenfassung
        (blueprint_id_1, '4370cb68-d676-4b93-8afd-2fb7c4ad78c4', 2), -- Ausführliche Zusammenfassung
        (blueprint_id_1, '7a6cac9a-5a34-4fe5-a8f6-23f8165b0e48', 3), -- Aufgaben & Termine
        (blueprint_id_1, 'c576e875-5a52-4f6a-abb7-0c62c945af78', 4); -- Offene Fragen

    -- ============================================
    -- 2. BAUSTELLENDOKUMENTATION & QUALITÄTSSICHERUNG
    -- ============================================
    INSERT INTO blueprints (
        name,
        description,
        is_public,
        user_id,
        category
    ) VALUES (
        jsonb_build_object(
            'de', 'Baustellendokumentation & Qualitätssicherung',
            'en', 'Site Documentation & Quality Control',
            'it', 'Documentazione del cantiere e controllo qualità',
            'fr', 'Documentation de chantier et contrôle qualité',
            'es', 'Documentación de obra y control de calidad'
        ),
        jsonb_build_object(
            'de', 'Erfasst Baufortschritt, Mängel und Abnahmen',
            'en', 'Records construction progress, defects, and approvals',
            'it', 'Registra i progressi di costruzione, difetti e approvazioni',
            'fr', 'Enregistre l''avancement de la construction, les défauts et les approbations',
            'es', 'Registra el progreso de construcción, defectos y aprobaciones'
        ),
        true,
        system_user_id,
        jsonb_build_object(
            'id', handwerk_category_id,
            'name', jsonb_build_object(
                'de', 'Handwerk',
                'en', 'Crafts & Trades'
            )
        )
    ) RETURNING id INTO blueprint_id_2;

    -- Verknüpfung der Prompts für Baustellendokumentation
    INSERT INTO prompt_blueprints (blueprint_id, prompt_id, sort_order) VALUES
        (blueprint_id_2, 'c4009bef-4504-4af7-86f5-f896a2412a0a', 1), -- Kurzzusammenfassung
        (blueprint_id_2, '4370cb68-d676-4b93-8afd-2fb7c4ad78c4', 2), -- Ausführliche Zusammenfassung
        (blueprint_id_2, '7a6cac9a-5a34-4fe5-a8f6-23f8165b0e48', 3), -- Aufgaben & Termine
        (blueprint_id_2, '47ce3340-e8c6-437c-928d-854c55589491', 4); -- Beantwortete Fragen & Antworten

    -- ============================================
    -- 3. TEAM-BESPRECHUNG & ARBEITSPLANUNG
    -- ============================================
    INSERT INTO blueprints (
        name,
        description,
        is_public,
        user_id,
        category
    ) VALUES (
        jsonb_build_object(
            'de', 'Team-Besprechung & Arbeitsplanung',
            'en', 'Team Meeting & Work Planning',
            'it', 'Riunione del team e pianificazione del lavoro',
            'fr', 'Réunion d''équipe et planification du travail',
            'es', 'Reunión de equipo y planificación del trabajo'
        ),
        jsonb_build_object(
            'de', 'Strukturiert Teambesprechungen und Arbeitseinteilung',
            'en', 'Structures team meetings and work allocation',
            'it', 'Struttura le riunioni del team e l''assegnazione del lavoro',
            'fr', 'Structure les réunions d''équipe et la répartition du travail',
            'es', 'Estructura las reuniones de equipo y la asignación de trabajo'
        ),
        true,
        system_user_id,
        jsonb_build_object(
            'id', handwerk_category_id,
            'name', jsonb_build_object(
                'de', 'Handwerk',
                'en', 'Crafts & Trades'
            )
        )
    ) RETURNING id INTO blueprint_id_3;

    -- Verknüpfung der Prompts für Team-Besprechung
    INSERT INTO prompt_blueprints (blueprint_id, prompt_id, sort_order) VALUES
        (blueprint_id_3, 'c4009bef-4504-4af7-86f5-f896a2412a0a', 1), -- Kurzzusammenfassung
        (blueprint_id_3, '7a6cac9a-5a34-4fe5-a8f6-23f8165b0e48', 2), -- Aufgaben & Termine
        (blueprint_id_3, '8cdc89a5-2f76-4d50-a93d-0c177c3e73ab', 3), -- Gesammelte Ideen & Vorschläge
        (blueprint_id_3, 'c576e875-5a52-4f6a-abb7-0c62c945af78', 4); -- Offene Fragen

    -- ============================================
    -- 4. FACHLICHE WEITERBILDUNG & SCHULUNGEN
    -- ============================================
    INSERT INTO blueprints (
        name,
        description,
        is_public,
        user_id,
        category
    ) VALUES (
        jsonb_build_object(
            'de', 'Fachliche Weiterbildung & Schulungen',
            'en', 'Professional Training & Education',
            'it', 'Formazione professionale e corsi',
            'fr', 'Formation professionnelle et formations',
            'es', 'Formación profesional y capacitaciones'
        ),
        jsonb_build_object(
            'de', 'Dokumentiert Schulungen und neue Techniken',
            'en', 'Documents training and new techniques',
            'it', 'Documenta la formazione e le nuove tecniche',
            'fr', 'Documente les formations et les nouvelles techniques',
            'es', 'Documenta capacitaciones y nuevas técnicas'
        ),
        true,
        system_user_id,
        jsonb_build_object(
            'id', handwerk_category_id,
            'name', jsonb_build_object(
                'de', 'Handwerk',
                'en', 'Crafts & Trades'
            )
        )
    ) RETURNING id INTO blueprint_id_4;

    -- Verknüpfung der Prompts für Weiterbildung
    INSERT INTO prompt_blueprints (blueprint_id, prompt_id, sort_order) VALUES
        (blueprint_id_4, 'c4009bef-4504-4af7-86f5-f896a2412a0a', 1), -- Kurzzusammenfassung
        (blueprint_id_4, '4370cb68-d676-4b93-8afd-2fb7c4ad78c4', 2), -- Ausführliche Zusammenfassung
        (blueprint_id_4, '47ce3340-e8c6-437c-928d-854c55589491', 3), -- Beantwortete Fragen & Antworten
        (blueprint_id_4, '2c6a6e47-1d0c-441f-9449-b5d908bffba2', 4); -- Blogbeitrag

    -- Erfolgsmeldung
    RAISE NOTICE 'Erfolgreich 4 Handwerk Blueprints erstellt';
    RAISE NOTICE 'Blueprint 1 (Kundengespräch): %', blueprint_id_1;
    RAISE NOTICE 'Blueprint 2 (Baustellendokumentation): %', blueprint_id_2;
    RAISE NOTICE 'Blueprint 3 (Team-Besprechung): %', blueprint_id_3;
    RAISE NOTICE 'Blueprint 4 (Weiterbildung): %', blueprint_id_4;

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
WHERE b.category->>'id' = 'a1b2c3d4-5678-90ab-cdef-123456789012'
GROUP BY b.id, b.name, b.description, b.created_at
ORDER BY b.created_at DESC
LIMIT 4;