import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ReplicateService } from '../services/replicate.service.js';
import { GenerateImagesRequest, PersonaData } from '../types/persona.types.js';

export async function personasRoutes(server: FastifyInstance) {
  const replicateService = new ReplicateService();

  /**
   * Generate images for a persona
   * POST /api/personas/generate-images
   */
  server.post<{ Body: GenerateImagesRequest }>(
    '/personas/generate-images',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            personaId: { type: 'string' },
            personaData: { type: 'object' },
            prompt: { type: 'string' },
            style: { 
              type: 'string',
              enum: ['portrait', 'professional', 'casual', 'lifestyle'],
              default: 'portrait'
            },
            count: { 
              type: 'number',
              minimum: 1,
              maximum: 4,
              default: 4
            }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              images: { 
                type: 'array',
                items: { type: 'string' }
              }
            }
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: GenerateImagesRequest }>, reply: FastifyReply) => {
      try {
        const { personaData, prompt, style = 'portrait', count = 4 } = request.body;

        // Validate input
        if (!personaData && !prompt) {
          return reply.code(400).send({
            success: false,
            error: 'Either personaData or prompt must be provided'
          });
        }

        // Generate images
        const images = await replicateService.generatePersonaImages(
          personaData || { name: 'generated' } as PersonaData,
          prompt,
          style,
          count
        );

        return {
          success: true,
          images
        };
      } catch (error) {
        server.log.error('Error generating images:', error);
        return reply.code(500).send({
          success: false,
          error: error.message || 'Failed to generate images'
        });
      }
    }
  );

  /**
   * Get available styles for image generation
   * GET /api/personas/styles
   */
  server.get('/personas/styles', async () => {
    return {
      success: true,
      styles: ReplicateService.getAvailableStyles()
    };
  });

  /**
   * Test endpoint to check if Replicate is configured
   * GET /api/personas/test
   */
  server.get('/personas/test', async () => {
    const hasToken = !!process.env.REPLICATE_API_TOKEN;
    return {
      success: true,
      configured: hasToken,
      message: hasToken 
        ? 'Replicate API is configured' 
        : 'Replicate API token is missing. Please set REPLICATE_API_TOKEN in your .env file'
    };
  });
}