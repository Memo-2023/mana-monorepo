// import { GoogleGenerativeAI } from '@google/generative-ai';
// import { getCharacterSystemPrompt } from './promptSettings';

// const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GOOGLE_GENAI_API_KEY || '');
// const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// export interface GeneratedCharacter {
//   name: string;
//   description: string;
//   personality: string;
//   background: string;
//   appearance: string;
//   motivation: string;
//   relationships: string;
//   development: string;
//   imagePrompt: string;
// }

// export async function generateCharacter(prompt: string, suggestedName?: string): Promise<{
//   character: GeneratedCharacter;
//   systemPrompt: string;
//   finalPrompt: string;
// }> {
//   try {
//     const systemPrompt = `Du bist ein kreativer Geschichtenerzähler. Erstelle detaillierte Charakterprofile.
// Achte darauf ob es sich um einen Menschen handelt oder Tiere oder Fantasiewesen.`;

//     const finalPrompt = `
// ${systemPrompt}

// Diese wichtigen Informationen wurden dir gegeben: "${prompt}"
// ${suggestedName ? `Der Name des Charakters ist "${suggestedName}". ${suggestedName.toLowerCase() === 'pony' ? '' : ''}` : ''}

// Fülle die folgenden nummerierten Abschnitte aus:

// 1. Name: ${suggestedName || 'Erstelle einen passenden Namen'}
// 2. Beschreibung: Fasse den Charakter in einem prägnanten Satz zusammen
// 3. Persönlichkeit: Beschreibe die wichtigsten Charakterzüge, Stärken und Schwächen
// 4. Motivation: Erkläre die Hauptziele, persönlichen Wünsche und größten Ängste
// 5. Hintergrund: Beschreibe die Herkunft, Kindheit und prägenden Erlebnisse
// 6. Beziehungen: Liste wichtige Verbündete, Familie und Gegenspieler auf
// 7. Entwicklung: Beschreibe den aktuellen Stand und das Entwicklungspotenzial
// 8. Erscheinungsbild: Beschreibe detailliert das Aussehen (Alter, Größe, Gesicht, Haare, Kleidungsstil)
// 9. Bild-Prompt: Erstelle einen kurzen, visuellen Prompt (max. 2 Sätze) für ein Portraitbild. Fokussiere auf Gesicht, Pose und Ausdruck.`;

//     console.log('Final Prompt:', finalPrompt);

//     const result = await model.generateContent(finalPrompt);
//     const response = result.response;
//     const text = response.text();
// import { GoogleGenerativeAI } from '@google/generative-ai';
// import { getCharacterSystemPrompt } from './promptSettings';

// const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GOOGLE_GENAI_API_KEY || '');
// const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// export interface GeneratedCharacter {
//   name: string;
//   description: string;
//   personality: string;
//   background: string;
//   appearance: string;
//   motivation: string;
//   relationships: string;
//   development: string;
//   imagePrompt: string;
// }

// export async function generateCharacter(prompt: string, suggestedName?: string): Promise<{
//   character: GeneratedCharacter;
//   systemPrompt: string;
//   finalPrompt: string;
// }> {
//   try {
//     const systemPrompt = `Du bist ein kreativer Geschichtenerzähler. Erstelle detaillierte Charakterprofile.
// Achte darauf ob es sich um einen Menschen handelt oder Tiere oder Fantasiewesen.`;

//     const finalPrompt = `
// ${systemPrompt}

// Diese wichtigen Informationen wurden dir gegeben: "${prompt}"
// ${suggestedName ? `Der Name des Charakters ist "${suggestedName}". ${suggestedName.toLowerCase() === 'pony' ? '' : ''}` : ''}

// Fülle die folgenden nummerierten Abschnitte aus:

// 1. Name: ${suggestedName || 'Erstelle einen passenden Namen'}
// 2. Beschreibung: Fasse den Charakter in einem prägnanten Satz zusammen
// 3. Persönlichkeit: Beschreibe die wichtigsten Charakterzüge, Stärken und Schwächen
// 4. Motivation: Erkläre die Hauptziele, persönlichen Wünsche und größten Ängste
// 5. Hintergrund: Beschreibe die Herkunft, Kindheit und prägenden Erlebnisse
// 6. Beziehungen: Liste wichtige Verbündete, Familie und Gegenspieler auf
// 7. Entwicklung: Beschreibe den aktuellen Stand und das Entwicklungspotenzial
// 8. Erscheinungsbild: Beschreibe detailliert das Aussehen (Alter, Größe, Gesicht, Haare, Kleidungsstil)
// 9. Bild-Prompt: Erstelle einen kurzen, visuellen Prompt (max. 2 Sätze) für ein Portraitbild. Fokussiere auf Gesicht, Pose und Ausdruck.`;

//     console.log('Final Prompt:', finalPrompt);

//     const result = await model.generateContent(finalPrompt);
//     const response = result.response;
//     const text = response.text();
    
//     console.log('AI Response:', text);
    
//     // Create character object with default values
//     const character: GeneratedCharacter = {
//       name: suggestedName || '',
//       description: '',
//       personality: '',
//       background: '',
//       appearance: '',
//       motivation: '',
//       relationships: '',
//       development: '',
//       imagePrompt: ''
//     };
    
//     // Split response into sections by number prefixes and clean up
//     const sections = text
//       .split(/\d+\.\s+/)
//       .filter(Boolean)
//       .map(section => section
//         .replace(/\*\*/g, '')
//         .replace(/^\s*[^:]*:\s*/, '')
//         .replace(/^\s*•\s*/gm, '')
//         .trim()
//       );
    
//     console.log('Cleaned sections:', sections.map((s, i) => `${i}: ${s.substring(0, 50)}...`));
    
//     // Map sections to character fields
//     sections.forEach((content, index) => {
//       if (!content) return;
      
//       // Entferne den Abschnittsnummer und Doppelpunkt am Anfang
//       const cleanContent = content
//         .replace(/^\d+:\s*/, '')  // Entfernt "1:" am Anfang
//         .replace(/\*\*/g, '')     // Entfernt Markdown-Formatierung
//         .replace(/^\s*\*\s*/gm, '') // Entfernt Aufzählungszeichen
//         .trim();

//       // Überspringe den ersten leeren Abschnitt
//       const adjustedIndex = index - 1;
      
//       switch (adjustedIndex) {
//         case 0: // Name
//           if (!suggestedName) character.name = cleanContent;
//           break;
//         case 1: // Beschreibung
//           character.description = cleanContent;
//           break;
//         case 2: // Persönlichkeit
//           character.personality = cleanContent;
//           break;
//         case 3: // Motivation
//           character.motivation = cleanContent;
//           break;
//         case 4: // Hintergrund
//           character.background = cleanContent;
//           break;
//         case 5: // Beziehungen
//           character.relationships = cleanContent;
//           break;
//         case 6: // Entwicklung
//           character.development = cleanContent;
//           break;
//         case 7: // Erscheinungsbild
//           character.appearance = cleanContent;
//           break;
//         case 8: // Bild-Prompt
//           character.imagePrompt = cleanContent;
//           break;
//       }
//     });

//     // Wenn ein Name vorgegeben wurde, diesen verwenden
//     if (suggestedName) {
//       character.name = suggestedName;
//     }

//     // Debug output
//     console.log('Character before save:', {
//       name: character.name,
//       description: character.description,
//       personality: character.personality,
//       motivation: character.motivation,
//       background: character.background,
//       relationships: character.relationships,
//       development: character.development,
//       appearance: character.appearance,
//       imagePrompt: character.imagePrompt
//     });

//     // Validate required fields
//     const requiredFields = [
//       'name',
//       'description',
//       'personality',
//       'motivation',
//       'background',
//       'relationships',
//       'development',
//       'appearance',
//       'imagePrompt'
//     ] as const;

//     const missingFields = requiredFields.filter(
//       field => !character[field] || character[field].trim() === ''
//     );

//     if (missingFields.length > 0) {
//       console.error('Missing fields:', missingFields);
//       throw new Error(`Unvollständige Charakterinformationen. Fehlende Felder: ${missingFields.join(', ')}`);
//     }

//     return {
//       character,
//       systemPrompt,
//       finalPrompt
//     };
//   } catch (error) {
//     console.error('Error generating character:', error);
//     throw error;
//   }
// }
