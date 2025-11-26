/**
 * Database Seed Script
 * Seeds initial data for the chat application
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { models } from './schema';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://chat:password@localhost:5432/chat';

async function seed() {
  console.log('Starting database seed...');

  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    // Check if models already exist
    const existingModels = await db.select().from(models);

    if (existingModels.length > 0) {
      console.log(`Found ${existingModels.length} existing models. Skipping seed.`);
      await client.end();
      return;
    }

    // Seed AI models
    console.log('Seeding AI models...');

    const modelData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'GPT-O3-Mini',
        description: 'Fast, efficient responses for everyday tasks',
        provider: 'azure',
        parameters: {
          temperature: 0.7,
          max_tokens: 800,
          deployment: 'gpt-o3-mini-se',
        },
        isActive: true,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        name: 'GPT-4o-Mini',
        description: 'Compact and powerful for complex tasks',
        provider: 'azure',
        parameters: {
          temperature: 0.7,
          max_tokens: 1000,
          deployment: 'gpt-4o-mini-se',
        },
        isActive: true,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440005',
        name: 'GPT-4o',
        description: 'Most advanced model for demanding tasks',
        provider: 'azure',
        parameters: {
          temperature: 0.7,
          max_tokens: 2000,
          deployment: 'gpt-4o-se',
        },
        isActive: true,
      },
    ];

    await db.insert(models).values(modelData);

    console.log(`Seeded ${modelData.length} AI models successfully!`);

    // Log the seeded models
    const seededModels = await db.select().from(models);
    console.log('Seeded models:');
    seededModels.forEach((model) => {
      console.log(`  - ${model.name} (${model.id})`);
    });

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run seed
seed()
  .then(() => {
    console.log('Seed completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
