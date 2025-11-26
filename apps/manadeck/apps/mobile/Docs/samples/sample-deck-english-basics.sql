-- Sample Deck: English for Beginners (Englisch für Anfänger)
-- This script creates a sample public deck for German speakers learning English
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
    'b1c2d3e4-f5a6-7890-bcde-f01234567890',
    '00000000-0000-0000-0000-000000000001', -- Placeholder system user
    'English for Beginners',
    'Essential English vocabulary for German speakers. Perfect for A1-A2 level with everyday words and phrases.',
    true,
    ARRAY['Languages', 'English', 'Beginner', 'A1', 'A2', 'Vocabulary'],
    '{
        "category": "Sprachen",
        "difficulty": "Anfänger",
        "target_audience": "Deutschsprachige Englischlernende A1-A2",
        "estimated_time": "3-4 Wochen",
        "created_by": "System",
        "version": "1.0",
        "is_sample_deck": true,
        "language_pair": "EN-DE"
    }'::jsonb,
    now(),
    now()
);

-- Insert sample cards
INSERT INTO public.cards (deck_id, position, title, card_type, content, created_at, updated_at) VALUES
-- Card 1: Days of the Week
('b1c2d3e4-f5a6-7890-bcde-f01234567890', 1, 'Days of the Week', 'mixed', 
'{"blocks": [
    {"type": "text", "data": {"text": "Learn the days of the week in English"}},
    {"type": "flashcard", "data": {"front": "Monday", "back": "Montag", "pronunciation": "MAN-day"}},
    {"type": "flashcard", "data": {"front": "Tuesday", "back": "Dienstag", "pronunciation": "TYOOS-day"}},
    {"type": "flashcard", "data": {"front": "Wednesday", "back": "Mittwoch", "pronunciation": "WENZ-day"}},
    {"type": "flashcard", "data": {"front": "Thursday", "back": "Donnerstag", "pronunciation": "THURZ-day"}},
    {"type": "flashcard", "data": {"front": "Friday", "back": "Freitag", "pronunciation": "FRY-day"}},
    {"type": "flashcard", "data": {"front": "Saturday", "back": "Samstag", "pronunciation": "SAT-ur-day"}},
    {"type": "flashcard", "data": {"front": "Sunday", "back": "Sonntag", "pronunciation": "SUN-day"}}
]}'::jsonb, 
now(), now()),

-- Card 2: Common Verbs - To be
('b1c2d3e4-f5a6-7890-bcde-f01234567890', 2, 'Verb: to be', 'flashcard',
'{"front": "I am / You are / He is", "back": "Ich bin / Du bist / Er ist", "hint": "The most important verb in English", "example": "I am happy. You are my friend. He is tall.", "grammar_note": "Conjugation: am, are, is"}'::jsonb,
now(), now()),

-- Card 3: Common Verbs - To have
('b1c2d3e4-f5a6-7890-bcde-f01234567890', 3, 'Verb: to have', 'flashcard',
'{"front": "to have", "back": "haben", "hint": "Possession verb", "example": "I have a car. She has two cats.", "pronunciation": "hav", "grammar_note": "I/you/we/they have, he/she/it has"}'::jsonb,
now(), now()),

-- Card 4: House vocabulary
('b1c2d3e4-f5a6-7890-bcde-f01234567890', 4, 'House: Kitchen', 'flashcard',
'{"front": "kitchen", "back": "die Küche", "hint": "Where you cook food", "example": "The kitchen is very modern.", "pronunciation": "KIT-chen"}'::jsonb,
now(), now()),

-- Card 5: House: Bedroom
('b1c2d3e4-f5a6-7890-bcde-f01234567890', 5, 'House: Bedroom', 'flashcard',
'{"front": "bedroom", "back": "das Schlafzimmer", "hint": "Where you sleep", "example": "My bedroom is upstairs.", "pronunciation": "BED-room"}'::jsonb,
now(), now()),

-- Card 6: Quiz - Articles
('b1c2d3e4-f5a6-7890-bcde-f01234567890', 6, 'Articles Quiz', 'quiz',
'{"question": "Which article is used before singular nouns starting with consonants?", "options": ["a", "an", "the", "no article"], "correct_answer": 0, "explanation": "Use \"a\" before singular nouns starting with consonants (a book, a car). Use \"an\" before vowel sounds (an apple, an hour)."}'::jsonb,
now(), now()),

-- Card 7: Time expressions
('b1c2d3e4-f5a6-7890-bcde-f01234567890', 7, 'Time: Morning', 'flashcard',
'{"front": "in the morning", "back": "am Morgen / morgens", "hint": "Time of day expression", "example": "I drink coffee in the morning.", "pronunciation": "in the MOR-ning"}'::jsonb,
now(), now()),

-- Card 8: Time: Evening
('b1c2d3e4-f5a6-7890-bcde-f01234567890', 8, 'Time: Evening', 'flashcard',
'{"front": "in the evening", "back": "am Abend / abends", "hint": "Time of day expression", "example": "We watch TV in the evening.", "pronunciation": "in the EEV-ning"}'::jsonb,
now(), now()),

-- Card 9: Weather vocabulary
('b1c2d3e4-f5a6-7890-bcde-f01234567890', 9, 'Weather: Sunny', 'flashcard',
'{"front": "sunny", "back": "sonnig", "hint": "Weather adjective", "example": "It is sunny today.", "pronunciation": "SUN-ee"}'::jsonb,
now(), now()),

-- Card 10: Weather: Rainy
('b1c2d3e4-f5a6-7890-bcde-f01234567890', 10, 'Weather: Rainy', 'flashcard',
'{"front": "rainy", "back": "regnerisch", "hint": "Weather adjective", "example": "It is rainy in London.", "pronunciation": "RAY-nee"}'::jsonb,
now(), now()),

-- Card 11: Body parts
('b1c2d3e4-f5a6-7890-bcde-f01234567890', 11, 'Body: Head', 'flashcard',
'{"front": "head", "back": "der Kopf", "hint": "Body part on top", "example": "My head hurts.", "pronunciation": "hed"}'::jsonb,
now(), now()),

-- Card 12: Body: Hand
('b1c2d3e4-f5a6-7890-bcde-f01234567890', 12, 'Body: Hand', 'flashcard',
'{"front": "hand", "back": "die Hand", "hint": "Body part with fingers", "example": "Please give me your hand.", "pronunciation": "hand"}'::jsonb,
now(), now()),

-- Card 13: Common Phrases
('b1c2d3e4-f5a6-7890-bcde-f01234567890', 13, 'Phrase: How much?', 'flashcard',
'{"front": "How much does it cost?", "back": "Wie viel kostet es?", "hint": "Shopping phrase", "example": "Excuse me, how much does this cost?", "pronunciation": "hau match daz it kost"}'::jsonb,
now(), now()),

-- Card 14: Quiz - Plural forms
('b1c2d3e4-f5a6-7890-bcde-f01234567890', 14, 'Plural Forms Quiz', 'quiz',
'{"question": "What is the plural of \"child\"?", "options": ["childs", "children", "childes", "childer"], "correct_answer": 1, "explanation": "Child is an irregular plural. The plural of child is children, not childs."}'::jsonb,
now(), now()),

-- Card 15: Common adjectives
('b1c2d3e4-f5a6-7890-bcde-f01234567890', 15, 'Adjective: Big/Small', 'flashcard',
'{"front": "big / small", "back": "groß / klein", "hint": "Size adjectives", "example": "The elephant is big. The mouse is small.", "pronunciation": "big / smawl"}'::jsonb,
now(), now()),

-- Card 16: Adjective: Hot/Cold
('b1c2d3e4-f5a6-7890-bcde-f01234567890', 16, 'Adjective: Hot/Cold', 'flashcard',
'{"front": "hot / cold", "back": "heiß / kalt", "hint": "Temperature adjectives", "example": "The coffee is hot. The ice cream is cold.", "pronunciation": "hot / kohld"}'::jsonb,
now(), now()),

-- Card 17: Question words
('b1c2d3e4-f5a6-7890-bcde-f01234567890', 17, 'Question: Where?', 'flashcard',
'{"front": "Where?", "back": "Wo?", "hint": "Question word for location", "example": "Where is the train station?", "pronunciation": "wair"}'::jsonb,
now(), now()),

-- Card 18: Question: When?
('b1c2d3e4-f5a6-7890-bcde-f01234567890', 18, 'Question: When?', 'flashcard',
'{"front": "When?", "back": "Wann?", "hint": "Question word for time", "example": "When does the movie start?", "pronunciation": "wen"}'::jsonb,
now(), now()),

-- Card 19: Prepositions
('b1c2d3e4-f5a6-7890-bcde-f01234567890', 19, 'Preposition: On/In/At', 'mixed',
'{"blocks": [
    {"type": "text", "data": {"text": "Important prepositions for place and time"}},
    {"type": "flashcard", "data": {"front": "on (the table)", "back": "auf (dem Tisch)", "example": "The book is on the table."}},
    {"type": "flashcard", "data": {"front": "in (the room)", "back": "in (dem Zimmer)", "example": "She is in the room."}},
    {"type": "flashcard", "data": {"front": "at (the station)", "back": "am/an (dem Bahnhof)", "example": "I am at the station."}}
]}'::jsonb,
now(), now()),

-- Card 20: Final Quiz
('b1c2d3e4-f5a6-7890-bcde-f01234567890', 20, 'Final Review Quiz', 'quiz',
'{"question": "How do you say \"Guten Tag\" in English?", "options": ["Good morning", "Good day/Hello", "Good evening", "Goodbye"], "correct_answer": 1, "explanation": "\"Guten Tag\" means \"Good day\" or simply \"Hello\" in English. It is a general greeting used during the day."}'::jsonb,
now(), now());

-- Update deck metadata with card count
UPDATE public.decks 
SET metadata = metadata || '{"card_count": 20}'::jsonb
WHERE id = 'b1c2d3e4-f5a6-7890-bcde-f01234567890';

-- Verification: Show what was created
SELECT 
    d.title,
    d.is_public,
    d.user_id,
    array_length(d.tags, 1) as tag_count,
    COUNT(c.id) as card_count
FROM public.decks d
LEFT JOIN public.cards c ON d.id = c.deck_id
WHERE d.id = 'b1c2d3e4-f5a6-7890-bcde-f01234567890'
GROUP BY d.id, d.title, d.is_public, d.user_id, d.tags;