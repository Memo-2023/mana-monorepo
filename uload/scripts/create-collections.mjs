#!/usr/bin/env node

/**
 * Creates PocketBase collections via API
 * Run: node scripts/create-collections.mjs
 */

import PocketBase from 'pocketbase';

const pb = new PocketBase('http://localhost:8090');

// Admin credentials
const ADMIN_EMAIL = 'till.schneider@memoro.ai';
const ADMIN_PASSWORD = 'p0ck3t-RAJ';

async function createCollections() {
  console.log('🔧 Creating PocketBase Collections...\n');

  try {
    // 1. Authenticate as admin
    console.log('🔐 Authenticating as admin...');
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✅ Authenticated\n');

    // 2. Create Links Collection
    console.log('📦 Creating Links collection...');
    try {
      await pb.collections.create({
        name: 'links',
        type: 'base',
        fields: [
          {
            name: 'short_code',
            type: 'text',
            required: true,
            options: {
              min: 3,
              max: 50,
              pattern: '^[a-zA-Z0-9_/-]+$'
            }
          },
          {
            name: 'custom_code',
            type: 'text',
            required: false
          },
          {
            name: 'original_url',
            type: 'url',
            required: true
          },
          {
            name: 'title',
            type: 'text',
            required: false,
            options: {
              max: 200
            }
          },
          {
            name: 'description',
            type: 'text',
            required: false,
            options: {
              max: 500
            }
          },
          {
            name: 'user_id',
            type: 'relation',
            required: false,
            options: {
              collectionId: '_pb_users_auth_',
              cascadeDelete: true,
              maxSelect: 1
            }
          },
          {
            name: 'is_active',
            type: 'bool',
            required: false
          },
          {
            name: 'password',
            type: 'text',
            required: false
          },
          {
            name: 'max_clicks',
            type: 'number',
            required: false,
            options: {
              min: 0
            }
          },
          {
            name: 'expires_at',
            type: 'date',
            required: false
          },
          {
            name: 'click_count',
            type: 'number',
            required: false,
            options: {
              default: 0
            }
          },
          {
            name: 'qr_code',
            type: 'file',
            required: false,
            options: {
              maxSelect: 1,
              maxSize: 5242880
            }
          },
          {
            name: 'tags',
            type: 'json',
            required: false
          },
          {
            name: 'utm_source',
            type: 'text',
            required: false
          },
          {
            name: 'utm_medium',
            type: 'text',
            required: false
          },
          {
            name: 'utm_campaign',
            type: 'text',
            required: false
          }
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_short_code ON links (short_code)'
        ],
        listRule: '',
        viewRule: '',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id = user_id',
        deleteRule: '@request.auth.id = user_id'
      });
      console.log('✅ Links collection created');
    } catch (e) {
      if (e.response?.message?.includes('already exists')) {
        console.log('⚠️  Links collection already exists');
      } else {
        throw e;
      }
    }

    // 3. Create Clicks Collection
    console.log('📦 Creating Clicks collection...');
    try {
      await pb.collections.create({
        name: 'clicks',
        type: 'base',
        fields: [
          {
            name: 'link_id',
            type: 'relation',
            required: true,
            options: {
              collectionId: 'links',
              cascadeDelete: true,
              maxSelect: 1
            }
          },
          {
            name: 'ip_hash',
            type: 'text',
            required: false
          },
          {
            name: 'user_agent',
            type: 'text',
            required: false
          },
          {
            name: 'referer',
            type: 'text',
            required: false
          },
          {
            name: 'browser',
            type: 'text',
            required: false
          },
          {
            name: 'device_type',
            type: 'text',
            required: false
          },
          {
            name: 'os',
            type: 'text',
            required: false
          },
          {
            name: 'country',
            type: 'text',
            required: false
          },
          {
            name: 'city',
            type: 'text',
            required: false
          },
          {
            name: 'clicked_at',
            type: 'date',
            required: false
          }
        ],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: null,
        deleteRule: '@request.auth.id = link_id.user_id'
      });
      console.log('✅ Clicks collection created');
    } catch (e) {
      if (e.response?.message?.includes('already exists')) {
        console.log('⚠️  Clicks collection already exists');
      } else {
        throw e;
      }
    }

    // 4. Create Accounts Collection
    console.log('📦 Creating Accounts collection...');
    try {
      await pb.collections.create({
        name: 'accounts',
        type: 'base',
        fields: [
          {
            name: 'name',
            type: 'text',
            required: true
          },
          {
            name: 'owner',
            type: 'relation',
            required: true,
            options: {
              collectionId: '_pb_users_auth_',
              cascadeDelete: true,
              maxSelect: 1
            }
          },
          {
            name: 'members',
            type: 'relation',
            required: false,
            options: {
              collectionId: '_pb_users_auth_',
              cascadeDelete: false,
              maxSelect: null
            }
          },
          {
            name: 'isActive',
            type: 'bool',
            required: false,
            options: {
              default: true
            }
          },
          {
            name: 'planType',
            type: 'select',
            required: false,
            options: {
              values: ['free', 'team', 'enterprise']
            }
          },
          {
            name: 'settings',
            type: 'json',
            required: false
          }
        ],
        listRule: '@request.auth.id = owner || @request.auth.id ?~ members',
        viewRule: '@request.auth.id = owner || @request.auth.id ?~ members',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id = owner',
        deleteRule: '@request.auth.id = owner'
      });
      console.log('✅ Accounts collection created');
    } catch (e) {
      if (e.response?.message?.includes('already exists')) {
        console.log('⚠️  Accounts collection already exists');
      } else {
        throw e;
      }
    }

    // 5. Update Users Collection
    console.log('📦 Updating Users collection...');
    try {
      const usersCollection = await pb.collections.getOne('_pb_users_auth_');
      
      // Add custom fields to users
      const updatedFields = [
        ...usersCollection.fields,
        {
          name: 'bio',
          type: 'text',
          required: false
        },
        {
          name: 'website',
          type: 'url',
          required: false
        },
        {
          name: 'location',
          type: 'text',
          required: false
        },
        {
          name: 'github',
          type: 'text',
          required: false
        },
        {
          name: 'twitter',
          type: 'text',
          required: false
        },
        {
          name: 'linkedin',
          type: 'text',
          required: false
        },
        {
          name: 'instagram',
          type: 'text',
          required: false
        },
        {
          name: 'publicProfile',
          type: 'bool',
          required: false,
          options: {
            default: false
          }
        },
        {
          name: 'showClickStats',
          type: 'bool',
          required: false,
          options: {
            default: true
          }
        },
        {
          name: 'isPremium',
          type: 'bool',
          required: false,
          options: {
            default: false
          }
        },
        {
          name: 'stripeCustomerId',
          type: 'text',
          required: false
        },
        {
          name: 'stripeSubscriptionId',
          type: 'text',
          required: false
        },
        {
          name: 'subscriptionStatus',
          type: 'text',
          required: false
        },
        {
          name: 'planType',
          type: 'select',
          required: false,
          options: {
            values: ['free', 'monthly', 'yearly', 'lifetime']
          }
        }
      ];

      // Filter out duplicates
      const fieldNames = new Set();
      const uniqueFields = updatedFields.filter(field => {
        if (fieldNames.has(field.name)) {
          return false;
        }
        fieldNames.add(field.name);
        return true;
      });

      await pb.collections.update('_pb_users_auth_', {
        ...usersCollection,
        fields: uniqueFields
      });
      console.log('✅ Users collection updated');
    } catch (e) {
      console.log('⚠️  Could not update Users collection:', e.message);
    }

    console.log('\n✅ All collections created successfully!');
    console.log('\n📝 Next step: Run the seed script');
    console.log('   node scripts/seed-local-db.js');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createCollections();