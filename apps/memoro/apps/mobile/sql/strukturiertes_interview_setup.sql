-- SQL-Befehle für die Implementierung der Vorlage "Strukturiertes Interview"
-- Autor: Till Schneider
-- Datum: 2025-01-15

-- HINWEIS: Kategorien werden direkt im category-Feld der blueprints-Tabelle als JSONB gespeichert
-- Es gibt keine separate categories-Tabelle

-- ============================================
-- 1. NEUE PROMPTS ERSTELLEN
-- ============================================

-- Prompt 1: Interviewpartner-Profil
INSERT INTO prompts (
    id,
    memory_title,
    prompt_text,
    description,
    is_public,
    created_at,
    updated_at,
    user_id
) VALUES (
    gen_random_uuid(),
    '{"de": "Interviewpartner-Profil", "en": "Interviewee Profile", "it": "Profilo Intervistato", "fr": "Profil de l''Interviewé", "es": "Perfil del Entrevistado"}',
    '{"de": "Erstelle ein detailliertes Profil der interviewten Person basierend auf dem folgenden Transkript. Erfasse: 1) Name, Position und beruflicher Hintergrund, 2) Hauptexpertise und Fachgebiete, 3) Wichtigste Aussagen und Standpunkte, 4) Persönlichkeitseindruck und Kommunikationsstil, 5) Besondere Erkenntnisse oder überraschende Aspekte. Strukturiere die Informationen klar und verzichte auf zusätzliche Kommentare. Hier das Interview-Transkript:", "en": "Create a detailed profile of the interviewed person based on the following transcript. Capture: 1) Name, position and professional background, 2) Main expertise and areas of specialization, 3) Key statements and viewpoints, 4) Personality impression and communication style, 5) Special insights or surprising aspects. Structure the information clearly and avoid additional comments. Here is the interview transcript:", "it": "Crea un profilo dettagliato della persona intervistata basato sulla seguente trascrizione. Cattura: 1) Nome, posizione e background professionale, 2) Principali competenze e aree di specializzazione, 3) Dichiarazioni e punti di vista chiave, 4) Impressione di personalità e stile di comunicazione, 5) Intuizioni speciali o aspetti sorprendenti. Struttura le informazioni in modo chiaro ed evita commenti aggiuntivi. Ecco la trascrizione dell''intervista:", "fr": "Créez un profil détaillé de la personne interrogée sur la base de la transcription suivante. Capturez : 1) Nom, poste et parcours professionnel, 2) Expertise principale et domaines de spécialisation, 3) Déclarations et points de vue clés, 4) Impression de personnalité et style de communication, 5) Idées spéciales ou aspects surprenants. Structurez les informations clairement et évitez les commentaires supplémentaires. Voici la transcription de l''entretien :", "es": "Crea un perfil detallado de la persona entrevistada basado en la siguiente transcripción. Captura: 1) Nombre, cargo y antecedentes profesionales, 2) Experiencia principal y áreas de especialización, 3) Declaraciones y puntos de vista clave, 4) Impresión de personalidad y estilo de comunicación, 5) Ideas especiales o aspectos sorprendentes. Estructura la información claramente y evita comentarios adicionales. Aquí está la transcripción de la entrevista:"}',
    '{"de": "Extrahiert ein umfassendes Profil der interviewten Person mit Hintergrund, Expertise und Hauptaussagen", "en": "Extracts a comprehensive profile of the interviewed person with background, expertise and key statements", "it": "Estrae un profilo completo della persona intervistata con background, competenze e dichiarazioni chiave", "fr": "Extrait un profil complet de la personne interrogée avec son parcours, son expertise et ses déclarations clés", "es": "Extrae un perfil completo de la persona entrevistada con antecedentes, experiencia y declaraciones clave"}',
    true,
    NOW(),
    NOW(),
    NULL  -- Öffentlicher Prompt
);

-- Prompt 2: Kernthemen & Erkenntnisse
INSERT INTO prompts (
    id,
    memory_title,
    prompt_text,
    description,
    is_public,
    created_at,
    updated_at,
    user_id
) VALUES (
    gen_random_uuid(),
    '{"de": "Kernthemen & Erkenntnisse", "en": "Key Topics & Insights", "it": "Temi Chiave e Approfondimenti", "fr": "Sujets Clés et Perspectives", "es": "Temas Clave e Ideas"}',
    '{"de": "Analysiere das folgende Interview-Transkript und identifiziere: 1) HAUPTTHEMEN: Die 3-5 zentralen Themen des Gesprächs mit kurzer Beschreibung, 2) NEUE ERKENNTNISSE: Überraschende oder besonders wertvolle Aussagen und Informationen, 3) KERNBOTSCHAFTEN: Die wichtigsten Botschaften des Interviewpartners, 4) WIDERSPRÜCHE: Falls vorhanden, notiere Unstimmigkeiten oder widersprüchliche Aussagen, 5) FOLLOW-UP: Empfehlungen für vertiefende Fragen oder nächste Schritte. Strukturiere die Analyse klar nach diesen Kategorien. Hier das Transkript:", "en": "Analyze the following interview transcript and identify: 1) MAIN TOPICS: The 3-5 central themes of the conversation with brief description, 2) NEW INSIGHTS: Surprising or particularly valuable statements and information, 3) KEY MESSAGES: The most important messages from the interviewee, 4) CONTRADICTIONS: If present, note inconsistencies or contradictory statements, 5) FOLLOW-UP: Recommendations for in-depth questions or next steps. Structure the analysis clearly according to these categories. Here is the transcript:", "it": "Analizza la seguente trascrizione dell''intervista e identifica: 1) TEMI PRINCIPALI: I 3-5 temi centrali della conversazione con breve descrizione, 2) NUOVE INTUIZIONI: Dichiarazioni e informazioni sorprendenti o particolarmente preziose, 3) MESSAGGI CHIAVE: I messaggi più importanti dell''intervistato, 4) CONTRADDIZIONI: Se presenti, nota incoerenze o dichiarazioni contraddittorie, 5) FOLLOW-UP: Raccomandazioni per domande approfondite o prossimi passi. Struttura l''analisi chiaramente secondo queste categorie. Ecco la trascrizione:", "fr": "Analysez la transcription d''entretien suivante et identifiez : 1) SUJETS PRINCIPAUX : Les 3-5 thèmes centraux de la conversation avec une brève description, 2) NOUVELLES PERSPECTIVES : Déclarations et informations surprenantes ou particulièrement précieuses, 3) MESSAGES CLÉS : Les messages les plus importants de la personne interrogée, 4) CONTRADICTIONS : Le cas échéant, notez les incohérences ou les déclarations contradictoires, 5) SUIVI : Recommandations pour des questions approfondies ou les prochaines étapes. Structurez l''analyse clairement selon ces catégories. Voici la transcription :", "es": "Analiza la siguiente transcripción de la entrevista e identifica: 1) TEMAS PRINCIPALES: Los 3-5 temas centrales de la conversación con breve descripción, 2) NUEVAS IDEAS: Declaraciones e información sorprendentes o particularmente valiosas, 3) MENSAJES CLAVE: Los mensajes más importantes del entrevistado, 4) CONTRADICCIONES: Si están presentes, nota inconsistencias o declaraciones contradictorias, 5) SEGUIMIENTO: Recomendaciones para preguntas en profundidad o próximos pasos. Estructura el análisis claramente según estas categorías. Aquí está la transcripción:"}',
    '{"de": "Identifiziert Hauptthemen, neue Erkenntnisse und Follow-up-Empfehlungen aus dem Interview", "en": "Identifies main topics, new insights and follow-up recommendations from the interview", "it": "Identifica i temi principali, le nuove intuizioni e le raccomandazioni di follow-up dall''intervista", "fr": "Identifie les sujets principaux, les nouvelles perspectives et les recommandations de suivi de l''entretien", "es": "Identifica los temas principales, las nuevas ideas y las recomendaciones de seguimiento de la entrevista"}',
    true,
    NOW(),
    NOW(),
    NULL  -- Öffentlicher Prompt
);

-- ============================================
-- 2. BLUEPRINT ERSTELLEN
-- ============================================

INSERT INTO blueprints (
    id,
    name,
    description,
    category,
    is_public,
    created_at,
    updated_at,
    user_id,
    advice
) VALUES (
    gen_random_uuid(),
    '{"de": "Strukturiertes Interview", "en": "Structured Interview"}',
    '{"de": "Systematische Erfassung und Auswertung von Interview-Gesprächen mit strukturierter Analyse von Inhalten, Personen und Erkenntnissen", "en": "Systematic capture and evaluation of interview conversations with structured analysis of content, people and insights"}',
    '{"id": "interview-category-001", "name": {"de": "Interview", "en": "Interview"}, "description": {"de": "Vorlagen für strukturierte Interviews und Gespräche", "en": "Templates for structured interviews and conversations"}, "style": {"color": "#9333EA"}}'::jsonb,  -- Kategorie als JSONB direkt eingebettet
    true,
    NOW(),
    NOW(),
    NULL,  -- Öffentlicher Blueprint
    '{
        "tips": {
            "tip1": {
                "order": 1,
                "content": {
                    "de": "Nennen Sie zu Beginn des Interviews Name, Position und Organisation des Gesprächspartners für eine klare Zuordnung.",
                    "en": "State the name, position and organization of the interviewee at the beginning of the interview for clear attribution."
                }
            },
            "tip2": {
                "order": 2,
                "content": {
                    "de": "Stellen Sie offene Fragen, die ausführliche Antworten ermöglichen, anstatt Ja/Nein-Fragen zu verwenden.",
                    "en": "Ask open-ended questions that allow for detailed answers instead of using yes/no questions."
                }
            },
            "tip3": {
                "order": 3,
                "content": {
                    "de": "Lassen Sie bewusst Pausen nach Antworten, damit der Interviewpartner seine Gedanken ergänzen kann.",
                    "en": "Deliberately leave pauses after answers so the interviewee can add to their thoughts."
                }
            },
            "tip4": {
                "order": 4,
                "content": {
                    "de": "Fassen Sie wichtige Punkte während des Gesprächs zusammen, um Missverständnisse zu vermeiden.",
                    "en": "Summarize important points during the conversation to avoid misunderstandings."
                }
            }
        },
        "metadata": {
            "version": "1.0",
            "last_updated": "2025-01-15T12:00:00+01:00",
            "supported_languages": ["de", "en", "it", "fr", "es"]
        }
    }'::jsonb
);

-- ============================================
-- 3. BLUEPRINT-PROMPT VERKNÜPFUNGEN
-- ============================================

-- Hinweis: Diese Abfragen verwenden Subqueries, um die IDs zu referenzieren.
-- In der Praxis sollten Sie die generierten UUIDs aus den vorherigen INSERT-Statements verwenden.

-- Verknüpfung 1: Kurzzusammenfassung (existierend)
INSERT INTO prompt_blueprints (blueprint_id, prompt_id, created_at)
VALUES (
    (SELECT id FROM blueprints WHERE name->>'de' = 'Strukturiertes Interview' LIMIT 1),
    'c4009bef-4504-4af7-86f5-f896a2412a0a',  -- ID der Kurzzusammenfassung
    NOW()
);

-- Verknüpfung 2: Offene Fragen (existierend)
INSERT INTO prompt_blueprints (blueprint_id, prompt_id, created_at)
VALUES (
    (SELECT id FROM blueprints WHERE name->>'de' = 'Strukturiertes Interview' LIMIT 1),
    'c576e875-5a52-4f6a-abb7-0c62c945af78',  -- ID der Offenen Fragen
    NOW()
);

-- Verknüpfung 3: Beantwortete Fragen & Antworten (existierend)
INSERT INTO prompt_blueprints (blueprint_id, prompt_id, created_at)
VALUES (
    (SELECT id FROM blueprints WHERE name->>'de' = 'Strukturiertes Interview' LIMIT 1),
    '47ce3340-e8c6-437c-928d-854c55589491',  -- ID der Beantworteten Fragen
    NOW()
);

-- Verknüpfung 4: Gesammelte Ideen & Vorschläge (existierend)
INSERT INTO prompt_blueprints (blueprint_id, prompt_id, created_at)
VALUES (
    (SELECT id FROM blueprints WHERE name->>'de' = 'Strukturiertes Interview' LIMIT 1),
    '8cdc89a5-2f76-4d50-a93d-0c177c3e73ab',  -- ID der Gesammelten Ideen
    NOW()
);

-- Verknüpfung 5: Interviewpartner-Profil (neu)
INSERT INTO prompt_blueprints (blueprint_id, prompt_id, created_at)
VALUES (
    (SELECT id FROM blueprints WHERE name->>'de' = 'Strukturiertes Interview' LIMIT 1),
    (SELECT id FROM prompts WHERE memory_title->>'de' = 'Interviewpartner-Profil' LIMIT 1),
    NOW()
);

-- Verknüpfung 6: Kernthemen & Erkenntnisse (neu)
INSERT INTO prompt_blueprints (blueprint_id, prompt_id, created_at)
VALUES (
    (SELECT id FROM blueprints WHERE name->>'de' = 'Strukturiertes Interview' LIMIT 1),
    (SELECT id FROM prompts WHERE memory_title->>'de' = 'Kernthemen & Erkenntnisse' LIMIT 1),
    NOW()
);

-- ============================================
-- ANMERKUNGEN ZUR AUSFÜHRUNG
-- ============================================

-- 1. Führen Sie diese SQL-Befehle in der angegebenen Reihenfolge aus
-- 2. Die gen_random_uuid() Funktion generiert automatisch UUIDs
-- 3. Für Produktionsumgebungen sollten Sie die generierten IDs speichern und wiederverwenden
-- 4. Testen Sie nach der Ausführung, ob alle Verknüpfungen korrekt erstellt wurden
-- 5. Die Farbe #9333EA (Lila) wurde für die Interview-Kategorie gewählt
-- 6. Kategorien sind als JSONB direkt im category-Feld der blueprints-Tabelle gespeichert

-- Optional: Überprüfung der erstellten Daten
-- SELECT * FROM blueprints WHERE name->>'de' = 'Strukturiertes Interview';
-- SELECT * FROM prompts WHERE memory_title->>'de' IN ('Interviewpartner-Profil', 'Kernthemen & Erkenntnisse');
-- SELECT * FROM prompt_blueprints pb 
--   JOIN blueprints b ON pb.blueprint_id = b.id 
--   WHERE b.name->>'de' = 'Strukturiertes Interview';