-- Sample Deck: Weltgeschichte - Wichtige Ereignisse (World History - Key Events)
-- This script creates a sample public deck for learning important historical events
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
    'd3e4f5a6-b7c8-9012-def0-123456789012',
    '00000000-0000-0000-0000-000000000001', -- Placeholder system user
    'Weltgeschichte - Wichtige Ereignisse',
    'Die wichtigsten Ereignisse der Weltgeschichte von der Antike bis zur Moderne. Ideal für Schüler und Geschichtsinteressierte.',
    true,
    ARRAY['Geschichte', 'Weltgeschichte', 'Ereignisse', 'Daten', 'Epochen', 'Bildung'],
    '{
        "category": "Geschichte",
        "difficulty": "Mittel",
        "target_audience": "Schüler ab 7. Klasse, Geschichtsinteressierte",
        "estimated_time": "5-6 Wochen",
        "created_by": "System",
        "version": "1.0",
        "is_sample_deck": true,
        "time_period": "3000 v.Chr. - 21. Jahrhundert"
    }'::jsonb,
    now(),
    now()
);

-- Insert sample cards
INSERT INTO public.cards (deck_id, position, title, card_type, content, created_at, updated_at) VALUES
-- Card 1: Ancient Egypt
('d3e4f5a6-b7c8-9012-def0-123456789012', 1, 'Altes Ägypten: Pyramiden', 'flashcard', 
'{"front": "Wann wurden die Pyramiden von Gizeh erbaut?", "back": "ca. 2580-2560 v.Chr.", "hint": "Während der 4. Dynastie des Alten Reichs", "context": "Die Große Pyramide des Cheops ist eines der sieben Weltwunder der Antike", "significance": "Zeugnis der fortgeschrittenen Baukunst und Organisation im alten Ägypten"}'::jsonb, 
now(), now()),

-- Card 2: Ancient Greece
('d3e4f5a6-b7c8-9012-def0-123456789012', 2, 'Antikes Griechenland: Demokratie', 'mixed',
'{"blocks": [
    {"type": "text", "data": {"text": "Die Geburt der Demokratie in Athen"}},
    {"type": "flashcard", "data": {"front": "Wer führte demokratische Reformen in Athen ein?", "back": "Kleisthenes (508/507 v.Chr.)", "context": "Begründer der attischen Demokratie"}},
    {"type": "flashcard", "data": {"front": "Was bedeutet Demokratie wörtlich?", "back": "Herrschaft des Volkes", "etymology": "demos (Volk) + kratos (Herrschaft)"}},
    {"type": "quiz", "data": {"question": "Wer durfte in der athenischen Demokratie wählen?", "options": ["Alle Einwohner", "Nur freie Männer über 18", "Nur Adlige", "Männer und Frauen über 21"], "correct_answer": 1, "explanation": "Nur freie männliche Bürger über 18 Jahren durften wählen - Frauen, Sklaven und Metöken (Fremde) waren ausgeschlossen"}}
]}'::jsonb,
now(), now()),

-- Card 3: Roman Empire
('d3e4f5a6-b7c8-9012-def0-123456789012', 3, 'Römisches Reich: Untergang', 'quiz',
'{"question": "In welchem Jahr endete das Weströmische Reich?", "options": ["376 n.Chr.", "476 n.Chr.", "576 n.Chr.", "1453 n.Chr."], "correct_answer": 1, "explanation": "476 n.Chr. wurde der letzte weströmische Kaiser Romulus Augustulus abgesetzt. Das Oströmische Reich (Byzanz) bestand noch bis 1453."}'::jsonb,
now(), now()),

-- Card 4: Middle Ages
('d3e4f5a6-b7c8-9012-def0-123456789012', 4, 'Mittelalter: Karl der Große', 'flashcard',
'{"front": "Wann wurde Karl der Große zum Kaiser gekrönt?", "back": "25. Dezember 800 n.Chr.", "location": "Rom, durch Papst Leo III.", "significance": "Begründung des Heiligen Römischen Reiches", "empire": "Vereinte große Teile West- und Mitteleuropas"}'::jsonb,
now(), now()),

-- Card 5: The Crusades
('d3e4f5a6-b7c8-9012-def0-123456789012', 5, 'Kreuzzüge: Erster Kreuzzug', 'flashcard',
'{"front": "Zeitraum des Ersten Kreuzzugs?", "back": "1096-1099", "goal": "Eroberung Jerusalems von den Muslimen", "result": "Eroberung Jerusalems 1099, Gründung der Kreuzfahrerstaaten", "called_by": "Papst Urban II. auf dem Konzil von Clermont (1095)"}'::jsonb,
now(), now()),

-- Card 6: Black Death
('d3e4f5a6-b7c8-9012-def0-123456789012', 6, 'Mittelalter: Der Schwarze Tod', 'mixed',
'{"blocks": [
    {"type": "text", "data": {"text": "Die verheerendste Pandemie des Mittelalters"}},
    {"type": "flashcard", "data": {"front": "Zeitraum der Pest in Europa?", "back": "1347-1353", "peak": "Höhepunkt 1348-1350"}},
    {"type": "flashcard", "data": {"front": "Geschätzte Todesopfer in Europa?", "back": "30-60% der Bevölkerung", "numbers": "Ca. 25 Millionen Menschen"}},
    {"type": "text", "data": {"text": "Folgen: Arbeitskräftemangel, soziale Umwälzungen, Judenverfolgungen, Entstehung neuer religiöser Bewegungen"}}
]}'::jsonb,
now(), now()),

-- Card 7: Renaissance
('d3e4f5a6-b7c8-9012-def0-123456789012', 7, 'Renaissance: Beginn', 'quiz',
'{"question": "Wo begann die Renaissance?", "options": ["Frankreich", "Deutschland", "Italien", "England"], "correct_answer": 2, "explanation": "Die Renaissance begann im 14. Jahrhundert in Italien, besonders in Florenz, und verbreitete sich dann über ganz Europa."}'::jsonb,
now(), now()),

-- Card 8: Columbus
('d3e4f5a6-b7c8-9012-def0-123456789012', 8, 'Entdeckungen: Kolumbus', 'flashcard',
'{"front": "Wann erreichte Kolumbus Amerika?", "back": "12. Oktober 1492", "location": "Landung auf einer Bahamas-Insel (wahrscheinlich San Salvador)", "ships": "Mit drei Schiffen: Santa Maria, Pinta, Niña", "misconception": "Er glaubte, einen neuen Weg nach Indien gefunden zu haben"}'::jsonb,
now(), now()),

-- Card 9: Reformation
('d3e4f5a6-b7c8-9012-def0-123456789012', 9, 'Reformation: Martin Luther', 'mixed',
'{"blocks": [
    {"type": "flashcard", "data": {"front": "Wann schlug Luther seine 95 Thesen an?", "back": "31. Oktober 1517", "location": "Schlosskirche zu Wittenberg"}},
    {"type": "text", "data": {"text": "Kritik am Ablasshandel und Beginn der Reformation"}},
    {"type": "quiz", "data": {"question": "Was war Luthers wichtigste Übersetzungsleistung?", "options": ["Lateinische Messe", "Bibel ins Deutsche", "Griechische Philosophen", "Kirchenlieder"], "correct_answer": 1, "explanation": "Luther übersetzte die Bibel ins Deutsche (Neues Testament 1522, vollständige Bibel 1534)"}}
]}'::jsonb,
now(), now()),

-- Card 10: Thirty Years War
('d3e4f5a6-b7c8-9012-def0-123456789012', 10, 'Dreißigjähriger Krieg', 'flashcard',
'{"front": "Zeitraum des Dreißigjährigen Krieges?", "back": "1618-1648", "cause": "Religiöse und machtpolitische Konflikte im Heiligen Römischen Reich", "end": "Westfälischer Friede", "consequences": "Verwüstung Mitteleuropas, ca. 30% Bevölkerungsverlust in deutschen Gebieten"}'::jsonb,
now(), now()),

-- Card 11: French Revolution
('d3e4f5a6-b7c8-9012-def0-123456789012', 11, 'Französische Revolution', 'mixed',
'{"blocks": [
    {"type": "flashcard", "data": {"front": "Sturm auf die Bastille?", "back": "14. Juli 1789", "significance": "Symbol für den Beginn der Revolution"}},
    {"type": "flashcard", "data": {"front": "Motto der Revolution?", "back": "Liberté, Égalité, Fraternité", "translation": "Freiheit, Gleichheit, Brüderlichkeit"}},
    {"type": "quiz", "data": {"question": "Wer wurde 1793 hingerichtet?", "options": ["Napoleon", "Ludwig XIV.", "Ludwig XVI.", "Robespierre"], "correct_answer": 2, "explanation": "König Ludwig XVI. wurde am 21. Januar 1793 guillotiniert, seine Frau Marie Antoinette im Oktober 1793"}}
]}'::jsonb,
now(), now()),

-- Card 12: Napoleon
('d3e4f5a6-b7c8-9012-def0-123456789012', 12, 'Napoleon: Kaiserkrönung', 'flashcard',
'{"front": "Wann krönte sich Napoleon zum Kaiser?", "back": "2. Dezember 1804", "location": "Notre-Dame de Paris", "special": "Er krönte sich selbst, um seine Unabhängigkeit vom Papst zu demonstrieren", "end_of_reign": "Abdankung 1814, Verbannung nach Elba, 100 Tage, finale Niederlage bei Waterloo 1815"}'::jsonb,
now(), now()),

-- Card 13: Industrial Revolution
('d3e4f5a6-b7c8-9012-def0-123456789012', 13, 'Industrielle Revolution', 'quiz',
'{"question": "Wo begann die Industrielle Revolution?", "options": ["Deutschland", "USA", "Großbritannien", "Frankreich"], "correct_answer": 2, "explanation": "Die Industrielle Revolution begann um 1760 in Großbritannien mit der Mechanisierung der Textilindustrie und der Erfindung der Dampfmaschine."}'::jsonb,
now(), now()),

-- Card 14: American Civil War
('d3e4f5a6-b7c8-9012-def0-123456789012', 14, 'Amerikanischer Bürgerkrieg', 'flashcard',
'{"front": "Zeitraum des Amerikanischen Bürgerkriegs?", "back": "1861-1865", "sides": "Nordstaaten (Union) vs. Südstaaten (Konföderation)", "main_issue": "Sklaverei und Rechte der Einzelstaaten", "outcome": "Sieg der Union, Abschaffung der Sklaverei (13. Amendment)", "casualties": "Ca. 620.000 Tote"}'::jsonb,
now(), now()),

-- Card 15: German Unification
('d3e4f5a6-b7c8-9012-def0-123456789012', 15, 'Deutsche Reichsgründung', 'flashcard',
'{"front": "Wann wurde das Deutsche Reich gegründet?", "back": "18. Januar 1871", "location": "Spiegelsaal von Versailles", "first_kaiser": "Wilhelm I.", "architect": "Otto von Bismarck (Reichskanzler)", "context": "Nach dem Sieg im Deutsch-Französischen Krieg 1870/71"}'::jsonb,
now(), now()),

-- Card 16: World War I
('d3e4f5a6-b7c8-9012-def0-123456789012', 16, 'Erster Weltkrieg', 'mixed',
'{"blocks": [
    {"type": "flashcard", "data": {"front": "Zeitraum des Ersten Weltkriegs?", "back": "1914-1918", "trigger": "Attentat von Sarajevo (28. Juni 1914)"}},
    {"type": "flashcard", "data": {"front": "Waffenstillstand?", "back": "11. November 1918", "time": "11 Uhr (11.11. um 11 Uhr)"}},
    {"type": "quiz", "data": {"question": "Welcher Vertrag beendete offiziell den Krieg mit Deutschland?", "options": ["Vertrag von Verdun", "Vertrag von Versailles", "Vertrag von Wien", "Vertrag von Potsdam"], "correct_answer": 1, "explanation": "Der Vertrag von Versailles wurde am 28. Juni 1919 unterzeichnet"}}
]}'::jsonb,
now(), now()),

-- Card 17: Russian Revolution
('d3e4f5a6-b7c8-9012-def0-123456789012', 17, 'Russische Revolution', 'flashcard',
'{"front": "Oktoberrevolution in Russland?", "back": "7. November 1917 (25. Oktober alten Stils)", "leader": "Wladimir Lenin", "party": "Bolschewiki", "result": "Sturz der provisorischen Regierung, Beginn der Sowjetmacht", "civil_war": "Russischer Bürgerkrieg 1918-1921"}'::jsonb,
now(), now()),

-- Card 18: Great Depression
('d3e4f5a6-b7c8-9012-def0-123456789012', 18, 'Weltwirtschaftskrise', 'quiz',
'{"question": "Mit welchem Ereignis begann die Weltwirtschaftskrise?", "options": ["Krieg in Europa", "Börsenkrach in New York", "Bankenkrise in London", "Revolution in Russland"], "correct_answer": 1, "explanation": "Der Schwarze Donnerstag (24. Oktober 1929) und Schwarze Dienstag (29. Oktober 1929) an der New Yorker Börse lösten die Weltwirtschaftskrise aus."}'::jsonb,
now(), now()),

-- Card 19: World War II
('d3e4f5a6-b7c8-9012-def0-123456789012', 19, 'Zweiter Weltkrieg', 'mixed',
'{"blocks": [
    {"type": "flashcard", "data": {"front": "Beginn des Zweiten Weltkriegs?", "back": "1. September 1939", "event": "Deutscher Überfall auf Polen"}},
    {"type": "flashcard", "data": {"front": "Ende in Europa?", "back": "8. Mai 1945", "event": "Bedingungslose Kapitulation Deutschlands"}},
    {"type": "flashcard", "data": {"front": "Ende in Asien?", "back": "2. September 1945", "event": "Kapitulation Japans nach Atombomben auf Hiroshima und Nagasaki"}},
    {"type": "text", "data": {"text": "Geschätzte Opferzahl: 70-85 Millionen Menschen, davon etwa 6 Millionen Juden im Holocaust"}}
]}'::jsonb,
now(), now()),

-- Card 20: United Nations
('d3e4f5a6-b7c8-9012-def0-123456789012', 20, 'Vereinte Nationen', 'flashcard',
'{"front": "Gründung der UNO?", "back": "24. Oktober 1945", "location": "San Francisco", "charter": "UN-Charta unterzeichnet am 26. Juni 1945", "members": "Ursprünglich 51 Mitgliedsstaaten, heute 193", "goals": "Weltfrieden, internationale Sicherheit, Menschenrechte"}'::jsonb,
now(), now()),

-- Card 21: Cold War
('d3e4f5a6-b7c8-9012-def0-123456789012', 21, 'Kalter Krieg: Berliner Mauer', 'mixed',
'{"blocks": [
    {"type": "flashcard", "data": {"front": "Bau der Berliner Mauer?", "back": "13. August 1961", "reason": "Stopp der Massenflucht aus der DDR"}},
    {"type": "flashcard", "data": {"front": "Fall der Berliner Mauer?", "back": "9. November 1989", "trigger": "Friedliche Revolution in der DDR"}},
    {"type": "text", "data": {"text": "Die Mauer stand 28 Jahre und teilte Berlin und Deutschland"}}
]}'::jsonb,
now(), now()),

-- Card 22: Moon Landing
('d3e4f5a6-b7c8-9012-def0-123456789012', 22, 'Raumfahrt: Mondlandung', 'flashcard',
'{"front": "Erste bemannte Mondlandung?", "back": "20. Juli 1969", "mission": "Apollo 11", "astronauts": "Neil Armstrong (erster Mensch auf dem Mond), Buzz Aldrin, Michael Collins", "famous_quote": "That\'s one small step for man, one giant leap for mankind", "country": "USA"}'::jsonb,
now(), now()),

-- Card 23: European Union
('d3e4f5a6-b7c8-9012-def0-123456789012', 23, 'Europäische Union', 'quiz',
'{"question": "Welcher Vertrag begründete die EWG (Vorläufer der EU)?", "options": ["Vertrag von Lissabon", "Römische Verträge", "Vertrag von Maastricht", "Vertrag von Amsterdam"], "correct_answer": 1, "explanation": "Die Römischen Verträge wurden am 25. März 1957 unterzeichnet und begründeten die Europäische Wirtschaftsgemeinschaft (EWG). Die EU entstand 1993 durch den Vertrag von Maastricht."}'::jsonb,
now(), now()),

-- Card 24: 9/11 Attacks
('d3e4f5a6-b7c8-9012-def0-123456789012', 24, 'Terroranschläge 9/11', 'flashcard',
'{"front": "Datum der Anschläge auf das World Trade Center?", "back": "11. September 2001", "location": "New York City und Washington D.C.", "perpetrator": "Al-Qaida unter Osama bin Laden", "victims": "Fast 3.000 Menschen", "consequences": "Krieg gegen den Terror, Afghanistan-Krieg, veränderte Sicherheitspolitik weltweit"}'::jsonb,
now(), now()),

-- Card 25: COVID-19 Pandemic
('d3e4f5a6-b7c8-9012-def0-123456789012', 25, 'COVID-19 Pandemie', 'mixed',
'{"blocks": [
    {"type": "flashcard", "data": {"front": "Wann erklärte die WHO COVID-19 zur Pandemie?", "back": "11. März 2020", "first_cases": "Dezember 2019 in Wuhan, China"}},
    {"type": "text", "data": {"text": "Erste mRNA-Impfstoffe in der Geschichte, entwickelt in Rekordzeit"}},
    {"type": "flashcard", "data": {"front": "Erste Impfstoffzulassung?", "back": "Dezember 2020", "vaccines": "BioNTech/Pfizer, Moderna"}},
    {"type": "text", "data": {"text": "Globale Auswirkungen: Lockdowns, Wirtschaftskrise, Digitalisierungsschub, über 6 Millionen Tote weltweit"}}
]}'::jsonb,
now(), now());

-- Update deck metadata with card count
UPDATE public.decks 
SET metadata = metadata || '{"card_count": 25}'::jsonb
WHERE id = 'd3e4f5a6-b7c8-9012-def0-123456789012';

-- Verification: Show what was created
SELECT 
    d.title,
    d.is_public,
    d.user_id,
    array_length(d.tags, 1) as tag_count,
    COUNT(c.id) as card_count
FROM public.decks d
LEFT JOIN public.cards c ON d.id = c.deck_id
WHERE d.id = 'd3e4f5a6-b7c8-9012-def0-123456789012'
GROUP BY d.id, d.title, d.is_public, d.user_id, d.tags;