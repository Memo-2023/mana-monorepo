-- Sample Deck: Deutsch für Anfänger (German Basics)
-- This SQL script creates a sample public deck with basic German vocabulary
-- To be executed by administrators or for initial seeding

-- First, check if we have any existing users, otherwise create a system user
DO $$
DECLARE
    system_user_id uuid;
BEGIN
    -- Try to find an existing user
    SELECT id INTO system_user_id FROM auth.users LIMIT 1;
    
    -- If no user exists, we'll use a fixed UUID for the system user
    -- This would typically be handled by having a proper admin user
    IF system_user_id IS NULL THEN
        system_user_id := '00000000-0000-0000-0000-000000000001';
        
        -- Note: In a real system, you would have a proper admin user
        -- For now, we'll just use this fixed UUID as a placeholder
        RAISE NOTICE 'Using system placeholder UUID: %', system_user_id;
    END IF;
END $$;

-- Insert the deck using a system user or the first available user
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
    COALESCE(
        (SELECT id FROM auth.users LIMIT 1), 
        '00000000-0000-0000-0000-000000000001'::uuid
    ), -- Use first available user or system placeholder
    'Deutsch für Anfänger',
    'Grundwortschatz für Deutsche-Lernende. Perfekt für A1-A2 Niveau mit den wichtigsten Alltagswörtern und Phrasen.',
    true,
    ARRAY['Sprachen', 'Deutsch', 'Anfänger', 'A1', 'A2', 'Grundwortschatz'],
    '{
        "category": "Sprachen",
        "difficulty": "Anfänger",
        "target_audience": "Deutschlernende A1-A2",
        "estimated_time": "2-3 Wochen",
        "created_by": "Admin",
        "version": "1.0"
    }'::jsonb,
    now(),
    now()
);

-- Insert cards for the German basics deck
-- Card 1: Greetings
INSERT INTO public.cards (
    id,
    deck_id,
    position,
    title,
    card_type,
    content,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
    1,
    'Begrüßung - Hallo',
    'flashcard',
    '{
        "front": "Hallo",
        "back": "Hello",
        "hint": "Standard greeting in German",
        "example": "Hallo, wie geht es dir?",
        "pronunciation": "HAH-lo"
    }'::jsonb,
    now(),
    now()
);

-- Card 2: Thank you
INSERT INTO public.cards (
    id,
    deck_id,
    position,
    title,
    card_type,
    content,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
    2,
    'Danke sagen',
    'flashcard',
    '{
        "front": "Danke",
        "back": "Thank you",
        "hint": "Basic way to express gratitude",
        "example": "Danke für deine Hilfe!",
        "pronunciation": "DAHN-keh"
    }'::jsonb,
    now(),
    now()
);

-- Card 3: Please
INSERT INTO public.cards (
    id,
    deck_id,
    position,
    title,
    card_type,
    content,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
    3,
    'Höflich bitten',
    'flashcard',
    '{
        "front": "Bitte",
        "back": "Please",
        "hint": "Used when asking for something politely",
        "example": "Können Sie mir bitte helfen?",
        "pronunciation": "BIT-teh"
    }'::jsonb,
    now(),
    now()
);

-- Card 4: Excuse me
INSERT INTO public.cards (
    id,
    deck_id,
    position,
    title,
    card_type,
    content,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
    4,
    'Entschuldigung',
    'flashcard',
    '{
        "front": "Entschuldigung",
        "back": "Excuse me / Sorry",
        "hint": "Used to get attention or apologize",
        "example": "Entschuldigung, wo ist der Bahnhof?",
        "pronunciation": "ent-SHUL-di-gung"
    }'::jsonb,
    now(),
    now()
);

-- Card 5: Yes/No
INSERT INTO public.cards (
    id,
    deck_id,
    position,
    title,
    card_type,
    content,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
    5,
    'Ja und Nein',
    'quiz',
    '{
        "question": "Wie sagt man ''Yes'' auf Deutsch?",
        "options": ["Ja", "Nein", "Vielleicht", "Okay"],
        "correct_answer": 0,
        "explanation": "''Ja'' bedeutet ''Yes'' auf Deutsch. ''Nein'' bedeutet ''No''."
    }'::jsonb,
    now(),
    now()
);

-- Card 6: Good morning
INSERT INTO public.cards (
    id,
    deck_id,
    position,
    title,
    card_type,
    content,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
    6,
    'Guten Morgen',
    'flashcard',
    '{
        "front": "Guten Morgen",
        "back": "Good morning",
        "hint": "Morning greeting until about 10 AM",
        "example": "Guten Morgen! Haben Sie gut geschlafen?",
        "pronunciation": "GOO-ten MOR-gen"
    }'::jsonb,
    now(),
    now()
);

-- Card 7: Good evening
INSERT INTO public.cards (
    id,
    deck_id,
    position,
    title,
    card_type,
    content,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
    7,
    'Guten Abend',
    'flashcard',
    '{
        "front": "Guten Abend",
        "back": "Good evening",
        "hint": "Evening greeting from about 6 PM",
        "example": "Guten Abend, wie war Ihr Tag?",
        "pronunciation": "GOO-ten AH-bent"
    }'::jsonb,
    now(),
    now()
);

-- Card 8: Numbers 1-5
INSERT INTO public.cards (
    id,
    deck_id,
    position,
    title,
    card_type,
    content,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
    8,
    'Zahlen 1-5',
    'mixed',
    '{
        "front": "Die Zahlen von 1 bis 5",
        "back": "1 = eins, 2 = zwei, 3 = drei, 4 = vier, 5 = fünf",
        "hint": "Basic counting in German",
        "additional_info": "These are the most basic numbers you need to know"
    }'::jsonb,
    now(),
    now()
);

-- Card 9: Colors - Red
INSERT INTO public.cards (
    id,
    deck_id,
    position,
    title,
    card_type,
    content,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
    9,
    'Farbe: Rot',
    'flashcard',
    '{
        "front": "rot",
        "back": "red",
        "hint": "The color of a rose or blood",
        "example": "Das Auto ist rot.",
        "pronunciation": "roht"
    }'::jsonb,
    now(),
    now()
);

-- Card 10: Colors - Blue
INSERT INTO public.cards (
    id,
    deck_id,
    position,
    title,
    card_type,
    content,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
    10,
    'Farbe: Blau',
    'flashcard',
    '{
        "front": "blau",
        "back": "blue",
        "hint": "The color of the sky or ocean",
        "example": "Der Himmel ist blau.",
        "pronunciation": "blau"
    }'::jsonb,
    now(),
    now()
);

-- Card 11: Food - Bread
INSERT INTO public.cards (
    id,
    deck_id,
    position,
    title,
    card_type,
    content,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
    11,
    'Essen: Brot',
    'flashcard',
    '{
        "front": "das Brot",
        "back": "the bread",
        "hint": "Basic food item, neuter noun",
        "example": "Ich esse Brot zum Frühstück.",
        "pronunciation": "dahs broht",
        "grammar_note": "neuter noun (das)"
    }'::jsonb,
    now(),
    now()
);

-- Card 12: Food - Water
INSERT INTO public.cards (
    id,
    deck_id,
    position,
    title,
    card_type,
    content,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
    12,
    'Getränk: Wasser',
    'flashcard',
    '{
        "front": "das Wasser",
        "back": "the water",
        "hint": "Essential drink, neuter noun",
        "example": "Ich trinke Wasser.",
        "pronunciation": "dahs VAH-ser",
        "grammar_note": "neuter noun (das)"
    }'::jsonb,
    now(),
    now()
);

-- Card 13: Family - Mother
INSERT INTO public.cards (
    id,
    deck_id,
    position,
    title,
    card_type,
    content,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
    13,
    'Familie: Mutter',
    'flashcard',
    '{
        "front": "die Mutter",
        "back": "the mother",
        "hint": "Female parent, feminine noun",
        "example": "Meine Mutter ist sehr nett.",
        "pronunciation": "dee MUT-ter",
        "grammar_note": "feminine noun (die)"
    }'::jsonb,
    now(),
    now()
);

-- Card 14: Family - Father
INSERT INTO public.cards (
    id,
    deck_id,
    position,
    title,
    card_type,
    content,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
    14,
    'Familie: Vater',
    'flashcard',
    '{
        "front": "der Vater",
        "back": "the father",
        "hint": "Male parent, masculine noun",
        "example": "Mein Vater arbeitet viel.",
        "pronunciation": "der FAH-ter",
        "grammar_note": "masculine noun (der)"
    }'::jsonb,
    now(),
    now()
);

-- Card 15: Question - How are you?
INSERT INTO public.cards (
    id,
    deck_id,
    position,
    title,
    card_type,
    content,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
    15,
    'Frage: Wie geht es dir?',
    'flashcard',
    '{
        "front": "Wie geht es dir?",
        "back": "How are you? (informal)",
        "hint": "Common question when greeting friends",
        "example": "Hallo Maria! Wie geht es dir?",
        "pronunciation": "vee gayt es deer",
        "additional_info": "Formal version: Wie geht es Ihnen?"
    }'::jsonb,
    now(),
    now()
);

-- Card 16: Weather - Sun
INSERT INTO public.cards (
    id,
    deck_id,
    position,
    title,
    card_type,
    content,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
    16,
    'Wetter: Sonne',
    'flashcard',
    '{
        "front": "die Sonne",
        "back": "the sun",
        "hint": "Bright object in the sky, feminine noun",
        "example": "Die Sonne scheint heute.",
        "pronunciation": "dee SON-neh",
        "grammar_note": "feminine noun (die)"
    }'::jsonb,
    now(),
    now()
);

-- Card 17: Days - Today
INSERT INTO public.cards (
    id,
    deck_id,
    position,
    title,
    card_type,
    content,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
    17,
    'Zeit: Heute',
    'flashcard',
    '{
        "front": "heute",
        "back": "today",
        "hint": "Refers to the current day",
        "example": "Heute ist ein schöner Tag.",
        "pronunciation": "HOY-teh"
    }'::jsonb,
    now(),
    now()
);

-- Card 18: Basic verb - to be
INSERT INTO public.cards (
    id,
    deck_id,
    position,
    title,
    card_type,
    content,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
    18,
    'Verb: sein (to be)',
    'mixed',
    '{
        "front": "sein - to be",
        "back": "ich bin (I am), du bist (you are), er/sie/es ist (he/she/it is)",
        "hint": "Most important verb in German",
        "example": "Ich bin müde. Du bist nett. Er ist groß.",
        "pronunciation": "zine"
    }'::jsonb,
    now(),
    now()
);

-- Card 19: Basic verb - to have
INSERT INTO public.cards (
    id,
    deck_id,
    position,
    title,
    card_type,
    content,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
    19,
    'Verb: haben (to have)',
    'mixed',
    '{
        "front": "haben - to have",
        "back": "ich habe (I have), du hast (you have), er/sie/es hat (he/she/it has)",
        "hint": "Second most important verb in German",
        "example": "Ich habe Hunger. Du hast Zeit. Sie hat ein Auto.",
        "pronunciation": "HAH-ben"
    }'::jsonb,
    now(),
    now()
);

-- Card 20: Goodbye
INSERT INTO public.cards (
    id,
    deck_id,
    position,
    title,
    card_type,
    content,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
    20,
    'Abschied: Auf Wiedersehen',
    'flashcard',
    '{
        "front": "Auf Wiedersehen",
        "back": "Goodbye",
        "hint": "Formal way to say goodbye",
        "example": "Auf Wiedersehen, bis morgen!",
        "pronunciation": "owf VEE-der-zay-en",
        "additional_info": "Informal: Tschüss (CHOOS)"
    }'::jsonb,
    now(),
    now()
);

-- Update deck metadata to reflect the actual card count
UPDATE public.decks 
SET metadata = metadata || '{"card_count": 20}'::jsonb
WHERE id = 'a0b1c2d3-e4f5-6789-abcd-ef0123456789';

-- Add some sample study sessions and progress (optional)
-- This would typically be generated as users study, but can be added for demo purposes

-- Comment out the following if you don't want demo progress data:
/*
-- Sample study session (replace USER_ID with actual user)
INSERT INTO public.study_sessions (
    id,
    user_id,
    deck_id,
    mode,
    started_at,
    ended_at,
    total_cards,
    completed_cards,
    correct_answers,
    incorrect_answers,
    total_time_seconds,
    average_card_time_seconds
) VALUES (
    gen_random_uuid(),
    'YOUR_USER_ID',
    'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
    'all',
    now() - interval '1 day',
    now() - interval '1 day' + interval '15 minutes',
    20,
    20,
    16,
    4,
    900, -- 15 minutes
    45   -- 45 seconds per card
);
*/

-- Verification queries (uncomment to run after insertion):
/*
-- Verify the deck was created
SELECT id, title, description, is_public, array_length(tags, 1) as tag_count 
FROM public.decks 
WHERE id = 'a0b1c2d3-e4f5-6789-abcd-ef0123456789';

-- Count cards in the deck
SELECT COUNT(*) as card_count 
FROM public.cards 
WHERE deck_id = 'a0b1c2d3-e4f5-6789-abcd-ef0123456789';

-- Show first few cards
SELECT position, title, card_type, content->>'front' as front_text, content->>'back' as back_text
FROM public.cards 
WHERE deck_id = 'a0b1c2d3-e4f5-6789-abcd-ef0123456789'
ORDER BY position 
LIMIT 5;
*/