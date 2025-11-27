// import { GoogleGenerativeAI } from '@google/generative-ai';
// import { getStorySystemPrompt, getImageSystemPrompt } from './promptSettings';
// import { generateImageWithReplicate } from './replicateAI';

// const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GOOGLE_GENAI_API_KEY || '');
// const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// export async function generateStory(prompt: string): Promise<{
//   story: string;
//   systemPrompt: string;
//   finalPrompt: string;
//   imageDescriptions: string[];
//   imagePrompt: string;
// }> {
//   try {
//     const systemPrompt = await getStorySystemPrompt();
//     const imagePromptTemplate = await getImageSystemPrompt();

//     const finalPrompt = `
//       System: ${systemPrompt}

//       Prompt: ${prompt}
//     `;

//     const result = await model.generateContent(finalPrompt);
//     const response = result.response;
//     const text = response.text();
// import { GoogleGenerativeAI } from '@google/generative-ai';
// import { getStorySystemPrompt, getImageSystemPrompt } from './promptSettings';
// import { generateImageWithReplicate } from './replicateAI';

// const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GOOGLE_GENAI_API_KEY || '');
// const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// export async function generateStory(prompt: string): Promise<{
//   story: string;
//   systemPrompt: string;
//   finalPrompt: string;
//   imageDescriptions: string[];
//   imagePrompt: string;
// }> {
//   try {
//     const systemPrompt = await getStorySystemPrompt();
//     const imagePromptTemplate = await getImageSystemPrompt();

//     const finalPrompt = `
//       System: ${systemPrompt}

//       Prompt: ${prompt}
//     `;

//     const result = await model.generateContent(finalPrompt);
//     const response = result.response;
//     const text = response.text();

//     // Generate image descriptions using the custom template
//     const imagePrompt = imagePromptTemplate.replace('[TEXT]', text);

//     const imageResult = await model.generateContent(imagePrompt);
//     const imageResponse = imageResult.response;
//     const imageText = imageResponse.text();

//     // Parse numbered list into array
//     const imageDescriptions = imageText
//       .split('\n')
//       .filter(line => /^\d+\./.test(line.trim()))
//       .map(line => line.replace(/^\d+\.\s*/, '').trim());

//     return {
//       story: text,
//       systemPrompt,
//       finalPrompt,
//       imageDescriptions,
//       imagePrompt: imagePromptTemplate,
//     };
//   } catch (error) {
//     console.error('Error generating story:', error);
//     throw error;
//   }
// }

// export async function generateImage(prompt: string): Promise<string> {
//   return generateImageWithReplicate(prompt);
// }
