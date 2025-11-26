-- Sample Deck: Mathematik Grundlagen (Mathematics Basics)
-- This script creates a sample public deck for learning basic math concepts
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
    'c2d3e4f5-a6b7-8901-cdef-012345678901',
    '00000000-0000-0000-0000-000000000001', -- Placeholder system user
    'Mathematik Grundlagen',
    'Grundlegende mathematische Konzepte und Formeln. Perfekt für Schüler der Mittelstufe und zur Auffrischung.',
    true,
    ARRAY['Mathematik', 'Grundlagen', 'Formeln', 'Geometrie', 'Algebra', 'Mittelstufe'],
    '{
        "category": "Mathematik",
        "difficulty": "Grundlagen",
        "target_audience": "Schüler 5.-8. Klasse",
        "estimated_time": "4-5 Wochen",
        "created_by": "System",
        "version": "1.0",
        "is_sample_deck": true,
        "includes_formulas": true
    }'::jsonb,
    now(),
    now()
);

-- Insert sample cards
INSERT INTO public.cards (deck_id, position, title, card_type, content, created_at, updated_at) VALUES
-- Card 1: Addition und Subtraktion
('c2d3e4f5-a6b7-8901-cdef-012345678901', 1, 'Grundrechenarten: Addition', 'flashcard', 
'{"front": "Was ist 47 + 38?", "back": "85", "hint": "Addiere zuerst die Einer (7+8=15), schreibe 5 und merke 1, dann die Zehner (4+3+1=8)", "explanation": "Addition ist das Zusammenzählen von Zahlen"}'::jsonb, 
now(), now()),

-- Card 2: Multiplication Table
('c2d3e4f5-a6b7-8901-cdef-012345678901', 2, 'Einmaleins: 7er-Reihe', 'quiz',
'{"question": "Was ist 7 × 8?", "options": ["54", "56", "58", "63"], "correct_answer": 1, "explanation": "7 × 8 = 56. Tipp: 7 × 8 ist dasselbe wie 8 × 7, und 8 × 7 = 56"}'::jsonb,
now(), now()),

-- Card 3: Brüche Grundlagen
('c2d3e4f5-a6b7-8901-cdef-012345678901', 3, 'Brüche: Grundbegriffe', 'mixed',
'{"blocks": [
    {"type": "text", "data": {"text": "Ein Bruch besteht aus Zähler (oben) und Nenner (unten)"}},
    {"type": "flashcard", "data": {"front": "Was ist 1/2 + 1/2?", "back": "1 (oder 2/2)", "hint": "Gleiche Nenner: Addiere die Zähler"}},
    {"type": "flashcard", "data": {"front": "Was ist 3/4 in Dezimalform?", "back": "0,75", "hint": "Teile 3 durch 4"}},
    {"type": "quiz", "data": {"question": "Welcher Bruch ist größer: 2/3 oder 3/4?", "options": ["2/3", "3/4", "Gleich groß"], "correct_answer": 1, "explanation": "3/4 = 0,75 und 2/3 = 0,67, also ist 3/4 größer"}}
]}'::jsonb,
now(), now()),

-- Card 4: Prozentrechnung
('c2d3e4f5-a6b7-8901-cdef-012345678901', 4, 'Prozentrechnung: Grundformel', 'flashcard',
'{"front": "Wie berechnet man 20% von 150?", "back": "30", "hint": "20% = 20/100 = 0,2. Dann: 0,2 × 150 = 30", "formula": "Prozentwert = Grundwert × Prozentsatz/100", "example": "20% von 150 = 150 × 20/100 = 30"}'::jsonb,
now(), now()),

-- Card 5: Geometrie - Flächenberechnung
('c2d3e4f5-a6b7-8901-cdef-012345678901', 5, 'Geometrie: Rechteck', 'flashcard',
'{"front": "Formel für die Fläche eines Rechtecks?", "back": "A = Länge × Breite", "hint": "Multipliziere die beiden Seitenlängen", "example": "Ein Rechteck mit Länge 5cm und Breite 3cm hat die Fläche: A = 5 × 3 = 15 cm²", "unit": "Fläche wird in Quadrateinheiten gemessen (cm², m²)"}'::jsonb,
now(), now()),

-- Card 6: Kreisberechnung
('c2d3e4f5-a6b7-8901-cdef-012345678901', 6, 'Geometrie: Kreis', 'mixed',
'{"blocks": [
    {"type": "text", "data": {"text": "Wichtige Formeln für den Kreis"}},
    {"type": "flashcard", "data": {"front": "Umfang eines Kreises", "back": "U = 2 × π × r", "hint": "r ist der Radius, π ≈ 3,14"}},
    {"type": "flashcard", "data": {"front": "Fläche eines Kreises", "back": "A = π × r²", "hint": "r² bedeutet r × r"}},
    {"type": "quiz", "data": {"question": "Was ist der Umfang eines Kreises mit Radius 5cm?", "options": ["15,7 cm", "31,4 cm", "78,5 cm", "25 cm"], "correct_answer": 1, "explanation": "U = 2 × π × r = 2 × 3,14 × 5 = 31,4 cm"}}
]}'::jsonb,
now(), now()),

-- Card 7: Negative Zahlen
('c2d3e4f5-a6b7-8901-cdef-012345678901', 7, 'Negative Zahlen: Rechnen', 'quiz',
'{"question": "Was ist (-5) + 3?", "options": ["-8", "-2", "2", "8"], "correct_answer": 1, "explanation": "Bei (-5) + 3 gehst du von -5 drei Schritte nach rechts auf dem Zahlenstrahl, landest bei -2"}'::jsonb,
now(), now()),

-- Card 8: Potenzen
('c2d3e4f5-a6b7-8901-cdef-012345678901', 8, 'Potenzen: Grundlagen', 'flashcard',
'{"front": "Was ist 2⁴?", "back": "16", "hint": "2⁴ = 2 × 2 × 2 × 2", "explanation": "Eine Potenz ist eine verkürzte Schreibweise für wiederholte Multiplikation", "examples": "2¹ = 2, 2² = 4, 2³ = 8, 2⁴ = 16, 2⁵ = 32"}'::jsonb,
now(), now()),

-- Card 9: Gleichungen lösen
('c2d3e4f5-a6b7-8901-cdef-012345678901', 9, 'Gleichungen: Einfache Lösung', 'flashcard',
'{"front": "Löse: x + 5 = 12", "back": "x = 7", "hint": "Subtrahiere 5 von beiden Seiten", "steps": "x + 5 = 12 | -5 auf beiden Seiten → x = 7", "check": "Probe: 7 + 5 = 12 ✓"}'::jsonb,
now(), now()),

-- Card 10: Dreisatz
('c2d3e4f5-a6b7-8901-cdef-012345678901', 10, 'Dreisatz: Proportional', 'mixed',
'{"blocks": [
    {"type": "text", "data": {"text": "Der Dreisatz löst Verhältnisaufgaben"}},
    {"type": "flashcard", "data": {"front": "3 Äpfel kosten 2€. Was kosten 9 Äpfel?", "back": "6€", "hint": "9 Äpfel sind 3× so viele, also 3× so teuer"}},
    {"type": "text", "data": {"text": "Rechnung: 3 Äpfel → 2€, 1 Apfel → 2€/3, 9 Äpfel → 2€/3 × 9 = 6€"}}
]}'::jsonb,
now(), now()),

-- Card 11: Primzahlen
('c2d3e4f5-a6b7-8901-cdef-012345678901', 11, 'Zahlentheorie: Primzahlen', 'quiz',
'{"question": "Welche dieser Zahlen ist KEINE Primzahl?", "options": ["17", "19", "21", "23"], "correct_answer": 2, "explanation": "21 ist keine Primzahl, da 21 = 3 × 7. Primzahlen sind nur durch 1 und sich selbst teilbar."}'::jsonb,
now(), now()),

-- Card 12: Quadratwurzeln
('c2d3e4f5-a6b7-8901-cdef-012345678901', 12, 'Wurzeln: Quadratwurzel', 'flashcard',
'{"front": "Was ist √64?", "back": "8", "hint": "Welche Zahl mal sich selbst ergibt 64?", "explanation": "√64 = 8, weil 8 × 8 = 64", "more_examples": "√4 = 2, √9 = 3, √16 = 4, √25 = 5, √36 = 6, √49 = 7"}'::jsonb,
now(), now()),

-- Card 13: Mittelwerte
('c2d3e4f5-a6b7-8901-cdef-012345678901', 13, 'Statistik: Durchschnitt', 'flashcard',
'{"front": "Durchschnitt von: 4, 7, 9, 12, 18?", "back": "10", "hint": "Addiere alle Zahlen und teile durch die Anzahl", "calculation": "(4 + 7 + 9 + 12 + 18) ÷ 5 = 50 ÷ 5 = 10", "formula": "Durchschnitt = Summe aller Werte ÷ Anzahl der Werte"}'::jsonb,
now(), now()),

-- Card 14: Winkel
('c2d3e4f5-a6b7-8901-cdef-012345678901', 14, 'Geometrie: Winkelarten', 'mixed',
'{"blocks": [
    {"type": "text", "data": {"text": "Verschiedene Winkelarten und ihre Größen"}},
    {"type": "flashcard", "data": {"front": "Spitzer Winkel", "back": "0° < Winkel < 90°", "example": "45° ist ein spitzer Winkel"}},
    {"type": "flashcard", "data": {"front": "Rechter Winkel", "back": "Genau 90°", "symbol": "∟"}},
    {"type": "flashcard", "data": {"front": "Stumpfer Winkel", "back": "90° < Winkel < 180°", "example": "120° ist ein stumpfer Winkel"}},
    {"type": "flashcard", "data": {"front": "Gestreckter Winkel", "back": "Genau 180°", "note": "Eine gerade Linie"}}
]}'::jsonb,
now(), now()),

-- Card 15: Teilbarkeitsregeln
('c2d3e4f5-a6b7-8901-cdef-012345678901', 15, 'Teilbarkeit: Regeln', 'mixed',
'{"blocks": [
    {"type": "text", "data": {"text": "Wichtige Teilbarkeitsregeln"}},
    {"type": "flashcard", "data": {"front": "Teilbar durch 2", "back": "Wenn die letzte Ziffer gerade ist (0,2,4,6,8)", "example": "124 ist durch 2 teilbar"}},
    {"type": "flashcard", "data": {"front": "Teilbar durch 3", "back": "Wenn die Quersumme durch 3 teilbar ist", "example": "123: 1+2+3=6, 6 ist durch 3 teilbar"}},
    {"type": "flashcard", "data": {"front": "Teilbar durch 5", "back": "Wenn die letzte Ziffer 0 oder 5 ist", "example": "145 ist durch 5 teilbar"}},
    {"type": "flashcard", "data": {"front": "Teilbar durch 9", "back": "Wenn die Quersumme durch 9 teilbar ist", "example": "81: 8+1=9, 9 ist durch 9 teilbar"}}
]}'::jsonb,
now(), now()),

-- Card 16: Römische Zahlen
('c2d3e4f5-a6b7-8901-cdef-012345678901', 16, 'Zahlensysteme: Römische Zahlen', 'quiz',
'{"question": "Was ist XIV in arabischen Zahlen?", "options": ["14", "16", "19", "24"], "correct_answer": 0, "explanation": "XIV = 10 (X) + 4 (IV) = 14. IV bedeutet 5-1=4"}'::jsonb,
now(), now()),

-- Card 17: Volumenberechnung
('c2d3e4f5-a6b7-8901-cdef-012345678901', 17, 'Geometrie: Würfelvolumen', 'flashcard',
'{"front": "Volumen eines Würfels mit Kantenlänge 4cm?", "back": "64 cm³", "formula": "V = a³ (a × a × a)", "calculation": "V = 4³ = 4 × 4 × 4 = 64 cm³", "hint": "Bei einem Würfel sind alle Kanten gleich lang"}'::jsonb,
now(), now()),

-- Card 18: Binomische Formeln
('c2d3e4f5-a6b7-8901-cdef-012345678901', 18, 'Algebra: Binomische Formeln', 'mixed',
'{"blocks": [
    {"type": "text", "data": {"text": "Die drei binomischen Formeln"}},
    {"type": "flashcard", "data": {"front": "1. Binomische Formel", "back": "(a + b)² = a² + 2ab + b²", "example": "(x + 3)² = x² + 6x + 9"}},
    {"type": "flashcard", "data": {"front": "2. Binomische Formel", "back": "(a - b)² = a² - 2ab + b²", "example": "(x - 2)² = x² - 4x + 4"}},
    {"type": "flashcard", "data": {"front": "3. Binomische Formel", "back": "(a + b)(a - b) = a² - b²", "example": "(x + 5)(x - 5) = x² - 25"}}
]}'::jsonb,
now(), now()),

-- Card 19: Pythagoras
('c2d3e4f5-a6b7-8901-cdef-012345678901', 19, 'Geometrie: Satz des Pythagoras', 'flashcard',
'{"front": "Satz des Pythagoras", "back": "a² + b² = c²", "hint": "In einem rechtwinkligen Dreieck", "explanation": "a und b sind die Katheten (kurze Seiten), c ist die Hypotenuse (längste Seite)", "example": "Dreieck mit a=3, b=4: c² = 9 + 16 = 25, also c = 5"}'::jsonb,
now(), now()),

-- Card 20: Wahrscheinlichkeit
('c2d3e4f5-a6b7-8901-cdef-012345678901', 20, 'Stochastik: Wahrscheinlichkeit', 'quiz',
'{"question": "Wie groß ist die Wahrscheinlichkeit, mit einem Würfel eine 6 zu würfeln?", "options": ["1/2", "1/3", "1/6", "1/12"], "correct_answer": 2, "explanation": "Ein Würfel hat 6 Seiten, nur eine zeigt die 6. Wahrscheinlichkeit = günstige Fälle / mögliche Fälle = 1/6 ≈ 16,7%"}'::jsonb,
now(), now()),

-- Card 21: Lineare Funktionen
('c2d3e4f5-a6b7-8901-cdef-012345678901', 21, 'Funktionen: Linear', 'flashcard',
'{"front": "Allgemeine Form einer linearen Funktion?", "back": "y = mx + b", "explanation": "m = Steigung, b = y-Achsenabschnitt", "example": "y = 2x + 3 hat Steigung 2 und schneidet die y-Achse bei 3", "graph_info": "Der Graph ist immer eine Gerade"}'::jsonb,
now(), now()),

-- Card 22: Größenumrechnung
('c2d3e4f5-a6b7-8901-cdef-012345678901', 22, 'Einheiten: Längen umrechnen', 'mixed',
'{"blocks": [
    {"type": "text", "data": {"text": "Wichtige Längeneinheiten und ihre Umrechnung"}},
    {"type": "flashcard", "data": {"front": "1 km = ? m", "back": "1000 m", "hint": "kilo = 1000"}},
    {"type": "flashcard", "data": {"front": "1 m = ? cm", "back": "100 cm", "hint": "centi = 1/100"}},
    {"type": "flashcard", "data": {"front": "1 cm = ? mm", "back": "10 mm", "hint": "milli = 1/1000"}},
    {"type": "quiz", "data": {"question": "2,5 km sind wie viele Meter?", "options": ["25 m", "250 m", "2500 m", "25000 m"], "correct_answer": 2}}
]}'::jsonb,
now(), now()),

-- Card 23: Logarithmus Grundlagen
('c2d3e4f5-a6b7-8901-cdef-012345678901', 23, 'Logarithmus: Einführung', 'flashcard',
'{"front": "Was ist log₁₀(100)?", "back": "2", "hint": "10 hoch was ergibt 100?", "explanation": "log₁₀(100) = 2, weil 10² = 100", "rule": "Der Logarithmus ist die Umkehrfunktion der Potenz"}'::jsonb,
now(), now()),

-- Card 24: Symmetrie
('c2d3e4f5-a6b7-8901-cdef-012345678901', 24, 'Geometrie: Symmetrie', 'quiz',
'{"question": "Wie viele Symmetrieachsen hat ein Quadrat?", "options": ["2", "3", "4", "8"], "correct_answer": 2, "explanation": "Ein Quadrat hat 4 Symmetrieachsen: 2 durch die Mittelpunkte gegenüberliegender Seiten und 2 durch gegenüberliegende Ecken"}'::jsonb,
now(), now()),

-- Card 25: Abschluss-Quiz
('c2d3e4f5-a6b7-8901-cdef-012345678901', 25, 'Abschluss: Gemischtes Quiz', 'quiz',
'{"question": "Ein Rechteck hat einen Umfang von 20cm und eine Länge von 6cm. Wie breit ist es?", "options": ["2 cm", "4 cm", "8 cm", "14 cm"], "correct_answer": 1, "explanation": "Umfang = 2×(Länge + Breite). 20 = 2×(6 + Breite). 10 = 6 + Breite. Breite = 4 cm"}'::jsonb,
now(), now());

-- Update deck metadata with card count
UPDATE public.decks 
SET metadata = metadata || '{"card_count": 25}'::jsonb
WHERE id = 'c2d3e4f5-a6b7-8901-cdef-012345678901';

-- Verification: Show what was created
SELECT 
    d.title,
    d.is_public,
    d.user_id,
    array_length(d.tags, 1) as tag_count,
    COUNT(c.id) as card_count
FROM public.decks d
LEFT JOIN public.cards c ON d.id = c.deck_id
WHERE d.id = 'c2d3e4f5-a6b7-8901-cdef-012345678901'
GROUP BY d.id, d.title, d.is_public, d.user_id, d.tags;