import Replicate from 'replicate';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { PersonaData } from '../types/persona.types.js';

export class ReplicateService {
  private replicate: Replicate;
  private storagePath: string;

  constructor() {
    this.replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN!,
    });
    this.storagePath = process.env.STORAGE_PATH || './storage/images';
  }

  /**
   * Generate images for a persona using Replicate
   */
  async generatePersonaImages(
    persona: PersonaData,
    customPrompt?: string,
    style: string = 'portrait',
    count: number = 4
  ): Promise<string[]> {
    try {
      // Build prompt based on persona data or use custom prompt
      const prompt = customPrompt || this.buildPromptFromPersona(persona, style);
      
      console.log('Generating images with prompt:', prompt);

      // Use Stable Diffusion XL (SDXL) for high quality images
      const output = await this.replicate.run(
        "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        {
          input: {
            prompt,
            negative_prompt: "ugly, distorted, blurry, low quality, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck, (worst quality:2), (low quality:2), (normal quality:2), lowres, ((monochrome)), ((grayscale))",
            width: 1024,
            height: 1024,
            num_outputs: count,
            scheduler: "K_EULER",
            num_inference_steps: 30,
            guidance_scale: 7.5,
            prompt_strength: 0.8,
            refine: "expert_ensemble_refiner",
            high_noise_frac: 0.8,
          }
        }
      ) as string[];

      // Save images locally
      const savedPaths = await this.saveImages(output, persona.name);
      
      return savedPaths;
    } catch (error) {
      console.error('Error generating images:', error);
      throw new Error(`Failed to generate images: ${error.message}`);
    }
  }

  /**
   * Build a detailed prompt from persona data
   */
  private buildPromptFromPersona(persona: PersonaData, style: string): string {
    const { appearance, demographics, professional } = persona;
    
    // Base prompt components
    const age = demographics?.age || '35-45';
    const gender = demographics?.gender || 'person';
    const profession = professional?.jobTitle || 'professional';
    
    // Style-specific modifiers
    const styleModifiers = {
      portrait: 'professional portrait photography, studio lighting, sharp focus, high quality, detailed',
      professional: 'business attire, office environment, corporate headshot, professional photography',
      casual: 'casual clothing, relaxed pose, natural lighting, lifestyle photography',
      lifestyle: 'in their work environment, candid shot, documentary style, natural lighting',
    };

    // Build the prompt
    let prompt = '';

    if (appearance?.prompt) {
      // If there's a specific prompt in the persona, use it
      prompt = appearance.prompt;
    } else if (appearance?.description) {
      // Build from appearance description
      prompt = `Professional photograph of a ${age} year old ${gender}, ${profession}. `;
      prompt += appearance.description + '. ';
      
      if (appearance.hairColor && appearance.hairStyle) {
        prompt += `${appearance.hairColor} hair in ${appearance.hairStyle}. `;
      }
      
      if (appearance.eyeColor) {
        prompt += `${appearance.eyeColor} eyes. `;
      }
      
      if (appearance.clothingStyle) {
        prompt += `Wearing ${appearance.clothingStyle}. `;
      }
      
      if (appearance.firstImpression) {
        prompt += appearance.firstImpression + '. ';
      }
    } else {
      // Fallback generic prompt
      prompt = `Professional photograph of a ${age} year old ${gender} ${profession}. `;
    }

    // Add style modifiers
    prompt += styleModifiers[style] || styleModifiers.portrait;
    
    return prompt;
  }

  /**
   * Save generated images to local storage
   */
  private async saveImages(imageUrls: string[], personaName: string): Promise<string[]> {
    const savedPaths: string[] = [];
    
    // Ensure storage directory exists
    await fs.mkdir(this.storagePath, { recursive: true });
    
    // Create subdirectory for persona
    const personaDir = path.join(this.storagePath, this.sanitizeFilename(personaName));
    await fs.mkdir(personaDir, { recursive: true });
    
    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      const timestamp = Date.now();
      const filename = `${this.sanitizeFilename(personaName)}_${timestamp}_${i + 1}.png`;
      const filepath = path.join(personaDir, filename);
      
      try {
        // Download image
        const response = await fetch(imageUrl);
        const buffer = await response.arrayBuffer();
        
        // Process with sharp (resize, optimize)
        await sharp(Buffer.from(buffer))
          .resize(1024, 1024, { fit: 'cover' })
          .png({ quality: 90 })
          .toFile(filepath);
        
        savedPaths.push(filepath);
        console.log(`Saved image to: ${filepath}`);
      } catch (error) {
        console.error(`Failed to save image ${i + 1}:`, error);
      }
    }
    
    return savedPaths;
  }

  /**
   * Sanitize filename to remove special characters
   */
  private sanitizeFilename(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 50);
  }

  /**
   * Get available styles for image generation
   */
  static getAvailableStyles(): string[] {
    return ['portrait', 'professional', 'casual', 'lifestyle'];
  }
}