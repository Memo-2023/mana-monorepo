-- Sample Deck: Deutsch für Anfänger (German Basics) - Simple Version
-- This script creates a sample public deck without needing existing users
-- Uses a system placeholder UUID that can be updated later

-- Insert the deck with a placeholder system user ID
INSERT INTO public.decks (
    id,
    user_id,
    title,
    description,
    is_public,
    tags,
    metadata,
    created_at,
    updated_at
) VALUES (
    'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
    '00000000-0000-0000-0000-000000000001', -- Placeholder system user
    'Deutsch für Anfänger',
    'Grundwortschatz für Deutsche-Lernende. Perfekt für A1-A2 Niveau mit den wichtigsten Alltagswörtern und Phrasen.',
    true,
    ARRAY['Sprachen', 'Deutsch', 'Anfänger', 'A1', 'A2', 'Grundwortschatz'],
    '{
        "category": "Sprachen",
        "difficulty": "Anfänger",
        "target_audience": "Deutschlernende A1-A2",
        "estimated_time": "2-3 Wochen",
        "created_by": "System",
        "version": "1.0",
        "is_sample_deck": true
    }'::jsonb,
    now(),
    now()
);

-- Insert sample cards
INSERT INTO public.cards (deck_id, position, title, card_type, content, created_at, updated_at) VALUES
-- Card 1: Greetings
('a0b1c2d3-e4f5-6789-abcd-ef0123456789', 1, 'Begrüßung - Hallo', 'flashcard', 
'{"front": "Hallo", "back": "Hello", "hint": "Standard greeting in German", "example": "Hallo, wie geht es dir?", "pronunciation": "HAH-lo"}'::jsonb, 
now(), now()),

-- Card 2: Thank you
('a0b1c2d3-e4f5-6789-abcd-ef0123456789', 2, 'Danke sagen', 'flashcard',
'{"front": "Danke", "back": "Thank you", "hint": "Basic way to express gratitude", "example": "Danke für deine Hilfe!", "pronunciation": "DAHN-keh"}'::jsonb,
now(), now()),

-- Card 3: Please
('a0b1c2d3-e4f5-6789-abcd-ef0123456789', 3, 'Höflich bitten', 'flashcard',
'{"front": "Bitte", "back": "Please", "hint": "Used when asking for something politely", "example": "Können Sie mir bitte helfen?", "pronunciation": "BIT-teh"}'::jsonb,
now(), now()),

-- Card 4: Excuse me
('a0b1c2d3-e4f5-6789-abcd-ef0123456789', 4, 'Entschuldigung', 'flashcard',
'{"front": "Entschuldigung", "back": "Excuse me / Sorry", "hint": "Used to get attention or apologize", "example": "Entschuldigung, wo ist der Bahnhof?", "pronunciation": "ent-SHUL-di-gung"}'::jsonb,
now(), now()),

-- Card 5: Yes/No Quiz
('a0b1c2d3-e4f5-6789-abcd-ef0123456789', 5, 'Ja und Nein', 'quiz',
'{"question": "Wie sagt man \"Yes\" auf Deutsch?", "options": ["Ja", "Nein", "Vielleicht", "Okay"], "correct_answer": 0, "explanation": "\"Ja\" bedeutet \"Yes\" auf Deutsch. \"Nein\" bedeutet \"No\"."}'::jsonb,
now(), now()),

-- Card 6: Good morning
('a0b1c2d3-e4f5-6789-abcd-ef0123456789', 6, 'Guten Morgen', 'flashcard',
'{"front": "Guten Morgen", "back": "Good morning", "hint": "Morning greeting until about 10 AM", "example": "Guten Morgen! Haben Sie gut geschlafen?", "pronunciation": "GOO-ten MOR-gen"}'::jsonb,
now(), now()),

-- Card 7: Good evening
('a0b1c2d3-e4f5-6789-abcd-ef0123456789', 7, 'Guten Abend', 'flashcard',
'{"front": "Guten Abend", "back": "Good evening", "hint": "Evening greeting from about 6 PM", "example": "Guten Abend, wie war Ihr Tag?", "pronunciation": "GOO-ten AH-bent"}'::jsonb,
now(), now()),

-- Card 8: Numbers
('a0b1c2d3-e4f5-6789-abcd-ef0123456789', 8, 'Zahlen 1-5', 'mixed',
'{"front": "Die Zahlen von 1 bis 5", "back": "1 = eins, 2 = zwei, 3 = drei, 4 = vier, 5 = fünf", "hint": "Basic counting in German", "additional_info": "These are the most basic numbers you need to know"}'::jsonb,
now(), now()),

-- Card 9: Colors - Red
('a0b1c2d3-e4f5-6789-abcd-ef0123456789', 9, 'Farbe: Rot', 'flashcard',
'{"front": "rot", "back": "red", "hint": "The color of a rose or blood", "example": "Das Auto ist rot.", "pronunciation": "roht"}'::jsonb,
now(), now()),

-- Card 10: Colors - Blue
('a0b1c2d3-e4f5-6789-abcd-ef0123456789', 10, 'Farbe: Blau', 'flashcard',
'{"front": "blau", "back": "blue", "hint": "The color of the sky or ocean", "example": "Der Himmel ist blau.", "pronunciation": "blau"}'::jsonb,
now(), now()),

-- Card 11: Food - Bread
('a0b1c2d3-e4f5-6789-abcd-ef0123456789', 11, 'Essen: Brot', 'flashcard',
'{"front": "das Brot", "back": "the bread", "hint": "Basic food item, neuter noun", "example": "Ich esse Brot zum Frühstück.", "pronunciation": "dahs broht", "grammar_note": "neuter noun (das)"}'::jsonb,
now(), now()),

-- Card 12: Drink - Water
('a0b1c2d3-e4f5-6789-abcd-ef0123456789', 12, 'Getränk: Wasser', 'flashcard',
'{"front": "das Wasser", "back": "the water", "hint": "Essential drink, neuter noun", "example": "Ich trinke Wasser.", "pronunciation": "dahs VAH-ser", "grammar_note": "neuter noun (das)"}'::jsonb,
now(), now()),

-- Card 13: Family - Mother
('a0b1c2d3-e4f5-6789-abcd-ef0123456789', 13, 'Familie: Mutter', 'flashcard',
'{"front": "die Mutter", "back": "the mother", "hint": "Female parent, feminine noun", "example": "Meine Mutter ist sehr nett.", "pronunciation": "dee MUT-ter", "grammar_note": "feminine noun (die)"}'::jsonb,
now(), now()),

-- Card 14: Family - Father
('a0b1c2d3-e4f5-6789-abcd-ef0123456789', 14, 'Familie: Vater', 'flashcard',
'{"front": "der Vater", "back": "the father", "hint": "Male parent, masculine noun", "example": "Mein Vater arbeitet viel.", "pronunciation": "der FAH-ter", "grammar_note": "masculine noun (der)"}'::jsonb,
now(), now()),

-- Card 15: Question - How are you?
('a0b1c2d3-e4f5-6789-abcd-ef0123456789', 15, 'Frage: Wie geht es dir?', 'flashcard',
'{"front": "Wie geht es dir?", "back": "How are you? (informal)", "hint": "Common question when greeting friends", "example": "Hallo Maria! Wie geht es dir?", "pronunciation": "vee gayt es deer", "additional_info": "Formal version: Wie geht es Ihnen?"}'::jsonb,
now(), now());

-- Update deck metadata with card count
UPDATE public.decks 
SET metadata = metadata || '{"card_count": 15}'::jsonb
WHERE id = 'a0b1c2d3-e4f5-6789-abcd-ef0123456789';

-- Verification: Show what was created
SELECT 
    d.title,
    d.is_public,
    d.user_id,
    array_length(d.tags, 1) as tag_count,
    COUNT(c.id) as card_count
FROM public.decks d
LEFT JOIN public.cards c ON d.id = c.deck_id
WHERE d.id = 'a0b1c2d3-e4f5-6789-abcd-ef0123456789'
GROUP BY d.id, d.title, d.is_public, d.user_id, d.tags;