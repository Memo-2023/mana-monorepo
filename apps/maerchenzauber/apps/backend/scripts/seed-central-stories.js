#!/usr/bin/env node

/**
 * Seed Script for Central Stories
 * 
 * Usage:
 * 1. Set your Supabase credentials as environment variables:
 *    export SUPABASE_URL=your_supabase_url
 *    export SUPABASE_SERVICE_KEY=your_service_role_key
 * 
 * 2. Run the script:
 *    node scripts/seed-central-stories.js
 */

const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
  console.error('\nExample:');
  console.error('   export SUPABASE_URL=https://your-project.supabase.co');
  console.error('   export SUPABASE_SERVICE_KEY=your-service-role-key');
  process.exit(1);
}

// Initialize Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Sample central stories data
const centralStories = [
  {
    title: 'Der kleine Drache lernt fliegen',
    story_prompt: 'Ein kleiner Drache überwindet seine Höhenangst und lernt mit Hilfe seiner Freunde das Fliegen.',
    story_text: 'Es war einmal ein kleiner Drache namens Funki, der sich vor dem Fliegen fürchtete...',
    pages_data: [
      {
        page: 1,
        text: 'Der kleine Drache Funki saß traurig auf seinem Felsen. Alle anderen Drachen konnten fliegen, nur er nicht.',
        image: 'https://example.com/dragon-page1.jpg' // Replace with actual image URLs
      },
      {
        page: 2,
        text: 'Seine Freundin, die Eule Luna, kam vorbei und fragte: "Was ist los, Funki? Warum bist du so traurig?"',
        image: 'https://example.com/dragon-page2.jpg'
      },
      {
        page: 3,
        text: 'Funki erzählte Luna von seiner Angst. Luna hatte eine Idee: "Lass uns klein anfangen! Erst hüpfen, dann gleiten!"',
        image: 'https://example.com/dragon-page3.jpg'
      },
      {
        page: 4,
        text: 'Tag für Tag übten sie zusammen. Funki wurde mutiger und seine Flügel stärker.',
        image: 'https://example.com/dragon-page4.jpg'
      },
      {
        page: 5,
        text: 'Eines Tages schaffte es Funki! Er flog hoch in den Himmel und war der glücklichste Drache der Welt.',
        image: 'https://example.com/dragon-page5.jpg'
      }
    ],
    metadata: {
      version: 1,
      language: 'de',
      age_group: '4-8',
      themes: ['Mut', 'Freundschaft', 'Selbstvertrauen'],
      duration_minutes: 5
    }
  },
  {
    title: 'Die magische Sternschnuppe',
    story_prompt: 'Ein Mädchen findet eine Sternschnuppe und erlebt magische Abenteuer.',
    story_text: 'Als Emma eines Abends in den Himmel schaute, sah sie eine besondere Sternschnuppe...',
    pages_data: [
      {
        page: 1,
        text: 'Emma liebte es, die Sterne zu beobachten. Eines Abends sah sie eine besonders helle Sternschnuppe.',
        image: 'https://example.com/star-page1.jpg'
      },
      {
        page: 2,
        text: 'Die Sternschnuppe fiel in ihren Garten! Emma lief hinaus und fand einen glitzernden Stern.',
        image: 'https://example.com/star-page2.jpg'
      },
      {
        page: 3,
        text: 'Als sie den Stern berührte, begann er zu leuchten und zu sprechen: "Ich bin Stella, danke dass du mich gefunden hast!"',
        image: 'https://example.com/star-page3.jpg'
      },
      {
        page: 4,
        text: 'Stella zeigte Emma den Nachthimmel aus einer ganz neuen Perspektive. Sie flogen zusammen zu den Wolken.',
        image: 'https://example.com/star-page4.jpg'
      },
      {
        page: 5,
        text: 'Am Ende der Nacht musste Stella zurück zum Himmel. Aber sie versprach Emma, immer für sie zu leuchten.',
        image: 'https://example.com/star-page5.jpg'
      }
    ],
    metadata: {
      version: 1,
      language: 'de',
      age_group: '4-8',
      themes: ['Magie', 'Wunder', 'Freundschaft'],
      duration_minutes: 5
    }
  },
  {
    title: 'Das Einhorn im Regenbogenwald',
    story_prompt: 'Ein Einhorn hilft den Tieren des Waldes, ihre Farben wiederzufinden.',
    story_text: 'Im Regenbogenwald lebte ein besonderes Einhorn mit einer glitzernden Mähne...',
    pages_data: [
      {
        page: 1,
        text: 'Im Regenbogenwald war alles grau geworden. Die Tiere waren sehr traurig.',
        image: 'https://example.com/unicorn-page1.jpg'
      },
      {
        page: 2,
        text: 'Das Einhorn Glitza kam in den Wald und sah die traurigen Tiere. "Ich werde euch helfen!", versprach es.',
        image: 'https://example.com/unicorn-page2.jpg'
      },
      {
        page: 3,
        text: 'Mit seinem magischen Horn berührte Glitza jeden Baum, jede Blume und jedes Tier.',
        image: 'https://example.com/unicorn-page3.jpg'
      },
      {
        page: 4,
        text: 'Langsam kehrten die Farben zurück. Der Wald erstrahlte wieder in allen Regenbogenfarben.',
        image: 'https://example.com/unicorn-page4.jpg'
      },
      {
        page: 5,
        text: 'Die Tiere feierten ein großes Fest. Der Regenbogenwald war wieder der schönste Ort der Welt.',
        image: 'https://example.com/unicorn-page5.jpg'
      }
    ],
    metadata: {
      version: 1,
      language: 'de',
      age_group: '3-6',
      themes: ['Hilfsbereitschaft', 'Farben', 'Gemeinschaft'],
      duration_minutes: 4
    }
  }
];

async function seedCentralStories() {
  console.log('🌟 Starting to seed central stories...\n');

  try {
    // First, check if central-stories collection exists
    const { data: collection, error: collectionError } = await supabase
      .from('story_collections')
      .select('id')
      .eq('slug', 'central-stories')
      .single();

    let collectionId;
    
    if (!collection) {
      console.log('📁 Creating central-stories collection...');
      const { data: newCollection, error: createError } = await supabase
        .from('story_collections')
        .insert({
          slug: 'central-stories',
          name: 'Märchenzauber Geschichten',
          description: 'Offizielle Geschichten von Märchenzauber - liebevoll für euch ausgewählt',
          type: 'manual',
          sort_order: 1,
          is_active: true
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating collection:', createError);
        return;
      }
      
      collectionId = newCollection.id;
      console.log('✅ Collection created successfully\n');
    } else {
      collectionId = collection.id;
      console.log('📁 Using existing central-stories collection\n');
    }

    // Insert each story
    for (let i = 0; i < centralStories.length; i++) {
      const storyData = centralStories[i];
      console.log(`📖 Creating story ${i + 1}/${centralStories.length}: "${storyData.title}"`);

      // Insert story with central visibility
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          user_id: 'SYSTEM', // System user
          title: storyData.title,
          story_prompt: storyData.story_prompt,
          story_text: storyData.story_text,
          pages_data: storyData.pages_data,
          visibility: 'central',
          is_published: true,
          published_at: new Date().toISOString(),
          published_by: 'system',
          metadata: storyData.metadata,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (storyError) {
        console.error(`❌ Error creating story "${storyData.title}":`, storyError);
        continue;
      }

      // Add story to collection
      const { error: linkError } = await supabase
        .from('collection_stories')
        .insert({
          collection_id: collectionId,
          story_id: story.id,
          position: i + 1,
          added_by: 'system'
        });

      if (linkError) {
        console.error(`❌ Error adding story to collection:`, linkError);
      } else {
        console.log(`✅ Story "${storyData.title}" created and added to collection`);
      }
    }

    console.log('\n🎉 Seed script completed successfully!');
    console.log(`📚 ${centralStories.length} central stories have been created.`);
    
    // Verify the stories
    const { data: verifyStories, error: verifyError } = await supabase
      .from('stories')
      .select('id, title')
      .eq('visibility', 'central');
    
    if (verifyStories) {
      console.log(`\n✨ Total central stories in database: ${verifyStories.length}`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Helper function to create more stories
async function createCentralStory(title, prompt, text, pages, metadata = {}) {
  const { data: collection } = await supabase
    .from('story_collections')
    .select('id')
    .eq('slug', 'central-stories')
    .single();

  if (!collection) {
    console.error('Collection not found');
    return;
  }

  // Get next position
  const { data: existingStories } = await supabase
    .from('collection_stories')
    .select('position')
    .eq('collection_id', collection.id)
    .order('position', { ascending: false })
    .limit(1);

  const nextPosition = existingStories && existingStories.length > 0 
    ? existingStories[0].position + 1 
    : 1;

  // Create story
  const { data: story, error } = await supabase
    .from('stories')
    .insert({
      user_id: 'SYSTEM',
      title,
      story_prompt: prompt,
      story_text: text,
      pages_data: pages,
      visibility: 'central',
      is_published: true,
      published_at: new Date().toISOString(),
      published_by: 'system',
      metadata: {
        version: 1,
        language: 'de',
        ...metadata
      }
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating story:', error);
    return;
  }

  // Add to collection
  await supabase
    .from('collection_stories')
    .insert({
      collection_id: collection.id,
      story_id: story.id,
      position: nextPosition,
      added_by: 'system'
    });

  console.log(`✅ Story "${title}" created successfully`);
  return story;
}

// Run the seed script
seedCentralStories().catch(console.error);

// Export for use in other scripts
module.exports = {
  createCentralStory,
  centralStories
};