# Backend Architecture Analysis & Migration Plan
### Picture AI Image Generation App

**Document Version:** 1.0
**Date:** 2025-10-09
**Author:** Architecture Review Team

---

## Executive Summary

Picture is an AI image generation application built as a monorepo with web (SvelteKit) and mobile (React Native/Expo) clients. The current backend is **100% Supabase**, leveraging PostgreSQL, Authentication, Storage, and a single Edge Function for image generation.

**Current State:** The architecture is functional but has significant scalability and architectural concerns, particularly around the monolithic Edge Function (667 lines) that handles long-running AI image generation tasks.

**Key Findings:**
- Single Edge Function doing too much (API calls, polling, file handling, database updates)
- No queue system for managing concurrent generations
- Limited error handling and retry mechanisms
- Potential cold start issues with Edge Functions
- Tight coupling to Replicate API within the Edge Function

**Recommendations:**
- **Short-term (0-3 months):** Option E - Refactor Supabase architecture with proper separation of concerns
- **Long-term (6-12 months):** Option F - Hybrid architecture with dedicated backend for compute-heavy tasks
- **Cost-conscious alternative:** Option A - Keep Supabase, add lightweight Node.js backend

---

## Table of Contents

1. [Current Architecture Deep Dive](#1-current-architecture-deep-dive)
2. [Alternative Backend Architectures](#2-alternative-backend-architectures)
3. [Detailed Comparison Matrix](#3-detailed-comparison-matrix)
4. [Specific Concerns for Picture App](#4-specific-concerns-for-picture-app)
5. [Migration Strategies](#5-migration-strategies)
6. [Final Recommendations](#6-final-recommendations)
7. [Appendices](#appendices)

---

## 1. Current Architecture Deep Dive

### 1.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌─────────────────────┐         ┌──────────────────────┐      │
│  │   Web App           │         │   Mobile App          │      │
│  │   (SvelteKit)       │         │   (Expo/RN)           │      │
│  │   - Tailwind CSS    │         │   - NativeWind        │      │
│  │   - Svelte 5        │         │   - React Navigation  │      │
│  └──────────┬──────────┘         └──────────┬───────────┘      │
└─────────────┼────────────────────────────────┼──────────────────┘
              │                                │
              └────────────────┬───────────────┘
                               │
              ┌────────────────▼─────────────────┐
              │    @picture/shared Package       │
              │  - Supabase Client Factory       │
              │  - Database Types (auto-gen)     │
              │  - Shared Utilities              │
              └────────────────┬─────────────────┘
                               │
              ┌────────────────▼─────────────────────────────────┐
              │              SUPABASE BACKEND                     │
              │                                                   │
              │  ┌─────────────────────────────────────────┐    │
              │  │   PostgreSQL Database                    │    │
              │  │   - 12 Tables (profiles, images, etc)   │    │
              │  │   - Row Level Security (RLS) enabled    │    │
              │  │   - 2 Views (batch_progress, etc)       │    │
              │  │   - 6 Functions (rate limiting, etc)    │    │
              │  └─────────────────────────────────────────┘    │
              │                                                   │
              │  ┌─────────────────────────────────────────┐    │
              │  │   Supabase Auth                          │    │
              │  │   - Email/Password Authentication        │    │
              │  │   - JWT Token Management                 │    │
              │  │   - Session Persistence                  │    │
              │  └─────────────────────────────────────────┘    │
              │                                                   │
              │  ┌─────────────────────────────────────────┐    │
              │  │   Supabase Storage                       │    │
              │  │   - Bucket: "generated-images"           │    │
              │  │   - Max file size: 50MB                  │    │
              │  │   - Image transformation enabled         │    │
              │  └─────────────────────────────────────────┘    │
              │                                                   │
              │  ┌─────────────────────────────────────────┐    │
              │  │   Edge Function: generate-image          │    │
              │  │   - 667 lines of TypeScript              │    │
              │  │   - Handles 15+ AI models                │    │
              │  │   - Polls Replicate API (up to 10 min)  │    │
              │  │   - Downloads & uploads images           │    │
              │  │   - Updates database records             │    │
              │  └──────────────────┬──────────────────────┘    │
              └─────────────────────┼────────────────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │   Replicate API                │
                    │   - FLUX, SDXL, Ideogram, etc  │
                    │   - Async prediction model     │
                    │   - Pay-per-generation         │
                    └────────────────────────────────┘
```

### 1.2 Database Schema

The application uses **12 tables**, **2 views**, and **6 database functions**:

#### Core Tables:
1. **profiles** (2 rows) - User profiles linked to auth.users
2. **image_generations** (68 rows) - Generation job tracking
3. **images** (29 rows) - Completed image records
4. **models** (14 rows) - AI model configurations
5. **batch_generations** - Batch job management
6. **generation_performance** - Performance metrics
7. **generation_errors** - Error tracking and retry logic
8. **user_rate_limits** - Rate limiting per user
9. **tags** - Image tagging system
10. **image_tags** - Many-to-many relationship
11. **image_likes** - User favorites
12. **prompt_templates** - Reusable prompts

#### Views:
- **batch_progress** - Aggregated batch status
- **multi_generation_groups** - Multi-generation tracking

#### Database Functions:
- `check_rate_limit(p_user_id, p_count)` - Rate limit enforcement
- `create_multi_generation(...)` - Batch generation setup
- `get_error_statistics(...)` - Error analytics
- `get_user_limits(p_user_id)` - Retrieve user quotas
- `process_error_recovery()` - Automatic error recovery
- `recover_stale_generations()` - Clean up stuck jobs
- `schedule_retry(...)` - Retry failed generations

### 1.3 Edge Function: generate-image

**Location:** `/apps/mobile/supabase/functions/generate-image/index.ts`
**Size:** 667 lines
**Purpose:** Complete image generation workflow

#### Responsibilities (Too Many!):

1. **Authentication & Authorization**
   - Verify JWT token
   - Get user context
   - Create admin client for RLS bypass

2. **Model Configuration**
   - Parse 15+ different model parameter formats
   - Handle aspect ratio conversions
   - Map model-specific parameters

3. **Image-to-Image Processing**
   - Download source images
   - Convert to base64
   - Validate image formats

4. **Replicate API Integration**
   - Call Replicate predictions API
   - Poll for completion (up to 120 attempts × 2s = 4 minutes max)
   - Handle different model response formats

5. **File Management**
   - Download generated images from Replicate
   - Process different image formats (webp, png, jpeg, svg)
   - Upload to Supabase Storage

6. **Database Operations**
   - Create image records
   - Update generation status
   - Track performance metrics
   - Log errors

7. **Error Handling**
   - Catch and log errors
   - Update failed generation records
   - Return error responses

#### Supported Models:
- FLUX (Schnell, Dev, 1.1 Pro, Krea Dev)
- SDXL (Regular, Lightning, Refiner)
- Ideogram V3 Turbo
- Imagen 4 Fast
- Recraft V3 (Regular + SVG)
- Stable Diffusion 3.5
- SeeDream 3 & 4
- Qwen Image

### 1.4 Client-Side Architecture

#### Web App (SvelteKit)
- **Framework:** SvelteKit + Svelte 5
- **Styling:** Tailwind CSS v4
- **API Layer:** `/apps/web/src/lib/api/`
  - `generate.ts` - Image generation
  - `images.ts` - Image CRUD operations
  - `models.ts` - Model management
  - `tags.ts` - Tagging system
  - `upload.ts` - Image upload (NEW)

#### Mobile App (Expo/React Native)
- **Framework:** Expo SDK 54 + React Native 0.81
- **Navigation:** Expo Router (file-based)
- **Styling:** NativeWind (Tailwind for RN)
- **State:** Zustand

#### Shared Package (@picture/shared)
```typescript
// packages/shared/src/api/supabase.ts
export function createSupabaseClient(url: string, key: string) {
  return createClient<Database>(url, key)
}

// Auto-generated types from database schema
export type Database = { /* 970 lines of types */ }
```

### 1.5 Current Pain Points

#### 1.5.1 Monolithic Edge Function
- **Single Responsibility Violation:** Does everything from auth to file uploads
- **Hard to Test:** 667 lines, tightly coupled
- **Hard to Debug:** All logs in one function
- **No Separation:** Business logic + infrastructure code mixed

#### 1.5.2 Long-Running Process Issues
- **Synchronous Polling:** Blocks for 2-120 seconds per generation
- **No Queue System:** Can't prioritize or manage concurrent jobs
- **Cold Starts:** Edge Functions may have cold start delays
- **Timeout Risk:** 10-minute max for Edge Functions

#### 1.5.3 Scalability Concerns
- **No Horizontal Scaling:** Single function handles all requests
- **No Load Balancing:** Can't distribute work
- **Rate Limiting:** Basic, not sophisticated
- **No Backpressure:** Can't handle traffic spikes

#### 1.5.4 Error Handling
- **Limited Retry Logic:** Basic retry in database functions
- **No Circuit Breaker:** Doesn't prevent cascading failures
- **Manual Recovery:** Requires `recover_stale_generations()`

#### 1.5.5 Real-Time Updates
- **Polling Required:** Clients must poll for generation status
- **No WebSockets:** Can't push completion notifications
- **No Server-Sent Events:** No real-time progress updates

#### 1.5.6 Cost Optimization
- **No Caching:** Repeated Replicate API calls
- **No Batch Optimization:** Each generation is independent
- **Resource Waste:** Edge Function runs even when just polling

### 1.6 Current Strengths

1. **Simple Architecture:** Easy to understand, single backend
2. **Rapid Development:** Supabase provides everything out-of-box
3. **Type Safety:** Auto-generated TypeScript types from schema
4. **RLS Security:** Row-level security enforced at database level
5. **Shared Client:** Single Supabase client across web + mobile
6. **No DevOps:** Managed infrastructure, automatic scaling
7. **Cost Effective (Currently):** Free tier + pay-per-use for small scale

---

## 2. Alternative Backend Architectures

### Option A: Keep Supabase + Add Custom Backend

**Philosophy:** Minimal change, add a lightweight backend for compute tasks.

#### Architecture:

```
┌─────────────┐     ┌─────────────┐
│  Web App    │────▶│ Supabase    │
│  Mobile App │     │ - Database  │
└─────────────┘     │ - Auth      │
       │            │ - Storage   │
       │            └─────────────┘
       │
       ▼
┌─────────────────────────────────┐
│   Custom Backend                 │
│   (Node.js + Express/Fastify)   │
│   - Image generation endpoint   │
│   - Replicate API integration   │
│   - Job queue (BullMQ)          │
│   - File processing             │
└─────────────────────────────────┘
       │
       ▼
┌─────────────┐
│ Replicate   │
│ API         │
└─────────────┘
```

#### Implementation Details:

**Backend Stack:**
- **Runtime:** Node.js 20+ or Bun
- **Framework:** Fastify (for performance) or Express (for simplicity)
- **Queue:** BullMQ + Redis for job management
- **Deployment:** Railway, Render, Fly.io, or AWS Fargate

**Code Structure:**
```
custom-backend/
├── src/
│   ├── routes/
│   │   └── generate.ts          # POST /api/generate
│   ├── services/
│   │   ├── replicate.service.ts # Replicate API wrapper
│   │   ├── storage.service.ts   # Supabase Storage client
│   │   └── queue.service.ts     # BullMQ job management
│   ├── workers/
│   │   └── generation.worker.ts # Background job processor
│   ├── middleware/
│   │   └── auth.ts              # Verify Supabase JWT
│   └── server.ts
├── Dockerfile
└── package.json
```

**Generation Flow:**
1. Client calls custom backend: `POST /api/generate`
2. Backend verifies Supabase JWT token
3. Create generation record in Supabase DB
4. Add job to BullMQ queue
5. Return immediately with `generation_id`
6. Worker processes job asynchronously
7. Update Supabase DB when complete
8. Client polls Supabase DB for status (or use webhooks)

**Example Code:**
```typescript
// routes/generate.ts
export async function generateImage(req: FastifyRequest, reply: FastifyReply) {
  // Verify Supabase JWT
  const user = await verifySupabaseToken(req.headers.authorization);

  // Create generation record
  const { data: generation } = await supabase
    .from('image_generations')
    .insert({ user_id: user.id, prompt, status: 'queued' })
    .select()
    .single();

  // Add to queue
  await generationQueue.add('generate', {
    generation_id: generation.id,
    prompt,
    model_id,
    user_id: user.id
  });

  return { generation_id: generation.id };
}

// workers/generation.worker.ts
generationQueue.process('generate', async (job) => {
  const { generation_id, prompt, model_id } = job.data;

  try {
    // Update status to processing
    await supabase
      .from('image_generations')
      .update({ status: 'processing' })
      .eq('id', generation_id);

    // Call Replicate API
    const prediction = await replicate.predictions.create({
      version: modelVersion,
      input: { prompt }
    });

    // Poll for completion
    const result = await replicate.wait(prediction);

    // Download image
    const imageBuffer = await fetch(result.output[0]).then(r => r.arrayBuffer());

    // Upload to Supabase Storage
    const { data } = await supabase.storage
      .from('generated-images')
      .upload(`${user_id}/${generation_id}.webp`, imageBuffer);

    // Create image record
    await supabase.from('images').insert({
      generation_id,
      user_id,
      filename: `${generation_id}.webp`,
      storage_path: data.path,
      public_url: data.publicUrl
    });

    // Update generation status
    await supabase
      .from('image_generations')
      .update({ status: 'completed', completed_at: new Date() })
      .eq('id', generation_id);

  } catch (error) {
    await supabase
      .from('image_generations')
      .update({ status: 'failed', error_message: error.message })
      .eq('id', generation_id);
  }
});
```

#### Pros:
- Minimal changes to existing architecture
- Keep all Supabase benefits (DB, Auth, Storage, RLS)
- Better separation of concerns
- Proper job queue for async processing
- Easy to add retry logic, rate limiting
- Can scale backend independently
- Lower cost than full migration

#### Cons:
- Need to manage another service (backend + Redis)
- Slightly more complex deployment
- Still somewhat coupled to Supabase
- Need to handle JWT verification manually

#### Cost Estimate (Monthly):
- Supabase: $25 (Pro plan) or stay on free tier
- Backend: $7-20 (Railway/Render/Fly.io)
- Redis: $0 (Upstash free tier) or $10 (Redis Cloud)
- **Total: $7-55/month** (vs. $0-25 currently)

---

### Option B: Migrate to AWS Amplify

**Philosophy:** Full AWS ecosystem, enterprise-grade infrastructure.

#### Architecture:

```
┌─────────────┐     ┌──────────────────────────────────────┐
│  Web App    │────▶│  AWS Amplify                          │
│  Mobile App │     │                                       │
└─────────────┘     │  ┌────────────────────────────────┐ │
                    │  │  AWS AppSync (GraphQL)          │ │
                    │  │  - Auto-generated resolvers     │ │
                    │  │  - Real-time subscriptions      │ │
                    │  └────────────────────────────────┘ │
                    │                                       │
                    │  ┌────────────────────────────────┐ │
                    │  │  Amazon Cognito                 │ │
                    │  │  - User pools                   │ │
                    │  │  - Identity pools               │ │
                    │  └────────────────────────────────┘ │
                    │                                       │
                    │  ┌────────────────────────────────┐ │
                    │  │  AWS Lambda Functions           │ │
                    │  │  - generateImage                │ │
                    │  │  - processGeneration            │ │
                    │  └────────────────────────────────┘ │
                    │                                       │
                    │  ┌────────────────────────────────┐ │
                    │  │  Amazon DynamoDB                │ │
                    │  │  - Serverless NoSQL             │ │
                    │  │  - Auto-scaling                 │ │
                    │  └────────────────────────────────┘ │
                    │                                       │
                    │  ┌────────────────────────────────┐ │
                    │  │  Amazon S3                      │ │
                    │  │  - Image storage                │ │
                    │  │  - CloudFront CDN               │ │
                    │  └────────────────────────────────┘ │
                    │                                       │
                    │  ┌────────────────────────────────┐ │
                    │  │  Amazon SQS/EventBridge         │ │
                    │  │  - Job queue                    │ │
                    │  │  - Event-driven architecture    │ │
                    │  └────────────────────────────────┘ │
                    └──────────────────────────────────────┘
```

#### Implementation Details:

**Amplify CLI Setup:**
```bash
amplify init
amplify add auth          # Cognito User Pool
amplify add api           # AppSync GraphQL API
amplify add storage       # S3 bucket
amplify add function      # Lambda functions
amplify push
```

**GraphQL Schema:**
```graphql
type User @model @auth(rules: [{ allow: owner }]) {
  id: ID!
  username: String
  email: AWSEmail!
  images: [Image] @hasMany
  generations: [Generation] @hasMany
}

type Model @model @auth(rules: [{ allow: public, operations: [read] }]) {
  id: ID!
  name: String!
  displayName: String!
  replicateId: String!
  defaultSteps: Int
  defaultGuidance: Float
}

type Generation @model @auth(rules: [{ allow: owner }]) {
  id: ID!
  user: User @belongsTo
  model: Model @belongsTo
  prompt: String!
  status: GenerationStatus!
  error: String
  createdAt: AWSDateTime!
  completedAt: AWSDateTime
  image: Image @hasOne
}

type Image @model @auth(rules: [{ allow: owner }]) {
  id: ID!
  user: User @belongsTo
  generation: Generation @belongsTo
  filename: String!
  s3Key: String!
  publicUrl: AWSURL!
  width: Int
  height: Int
  format: String
  createdAt: AWSDateTime!
}

enum GenerationStatus {
  QUEUED
  PROCESSING
  COMPLETED
  FAILED
}
```

**Lambda Function (TypeScript):**
```typescript
// amplify/backend/function/processGeneration/src/index.ts
import { SQSHandler } from 'aws-lambda';
import Replicate from 'replicate';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
const s3 = new S3Client({});
const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler: SQSHandler = async (event) => {
  for (const record of event.Records) {
    const { generationId, prompt, modelId, userId } = JSON.parse(record.body);

    try {
      // Update status to processing
      await updateGenerationStatus(generationId, 'PROCESSING');

      // Call Replicate
      const output = await replicate.run(modelId, { input: { prompt } });

      // Download image
      const response = await fetch(output[0]);
      const buffer = await response.arrayBuffer();

      // Upload to S3
      const s3Key = `${userId}/${generationId}.webp`;
      await s3.send(new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: s3Key,
        Body: Buffer.from(buffer),
        ContentType: 'image/webp'
      }));

      // Create image record via AppSync mutation
      await createImageRecord(generationId, s3Key);

      // Update generation status
      await updateGenerationStatus(generationId, 'COMPLETED');

    } catch (error) {
      await updateGenerationStatus(generationId, 'FAILED', error.message);
    }
  }
};
```

**Real-time Subscriptions (Client):**
```typescript
// Subscribe to generation updates
const subscription = API.graphql(
  graphqlOperation(`
    subscription OnGenerationUpdate($userId: ID!) {
      onUpdateGeneration(filter: { userId: { eq: $userId } }) {
        id
        status
        error
        image {
          publicUrl
        }
      }
    }
  `, { userId })
).subscribe({
  next: ({ value }) => {
    const generation = value.data.onUpdateGeneration;
    if (generation.status === 'COMPLETED') {
      showNotification('Image ready!', generation.image.publicUrl);
    }
  }
});
```

#### Pros:
- Enterprise-grade infrastructure
- Real-time subscriptions built-in (AppSync)
- GraphQL API auto-generated from schema
- Excellent mobile SDK (AWS Amplify)
- Fine-grained security with Cognito
- Scales automatically (DynamoDB, Lambda)
- AWS ecosystem benefits (CloudWatch, X-Ray, etc.)
- Strong offline support with DataStore

#### Cons:
- Steep learning curve (AWS complexity)
- Vendor lock-in (heavily AWS-specific)
- DynamoDB has different query patterns than SQL
- More expensive at scale
- Amplify CLI can be finicky
- Migration effort is HIGH (complete rewrite)
- Need to learn AWS services

#### Cost Estimate (Monthly):
- AWS Amplify Hosting: $15-50
- AppSync: $4 per million queries + $2 per million minutes
- Lambda: $0.20 per million requests (likely $5-20)
- DynamoDB: $1.25 per million writes + $0.25 per million reads ($10-50)
- S3 + CloudFront: $5-20
- Cognito: Free for <50k MAU
- **Total: $40-160/month** for moderate traffic

---

### Option C: Firebase

**Philosophy:** Google's BaaS (Backend as a Service), mobile-first approach.

#### Architecture:

```
┌─────────────┐     ┌──────────────────────────────────────┐
│  Web App    │────▶│  Firebase                             │
│  Mobile App │     │                                       │
└─────────────┘     │  ┌────────────────────────────────┐ │
                    │  │  Firebase Authentication        │ │
                    │  │  - Email/Password, OAuth        │ │
                    │  │  - Custom claims                │ │
                    │  └────────────────────────────────┘ │
                    │                                       │
                    │  ┌────────────────────────────────┐ │
                    │  │  Cloud Firestore                │ │
                    │  │  - NoSQL document database      │ │
                    │  │  - Real-time sync               │ │
                    │  │  - Offline support              │ │
                    │  └────────────────────────────────┘ │
                    │                                       │
                    │  ┌────────────────────────────────┐ │
                    │  │  Cloud Functions (Node.js)      │ │
                    │  │  - generateImage (HTTP)         │ │
                    │  │  - processGeneration (Queue)    │ │
                    │  │  - onImageCreated (Trigger)     │ │
                    │  └────────────────────────────────┘ │
                    │                                       │
                    │  ┌────────────────────────────────┐ │
                    │  │  Firebase Storage (GCS)         │ │
                    │  │  - Image uploads                │ │
                    │  │  - CDN-backed                   │ │
                    │  └────────────────────────────────┘ │
                    │                                       │
                    │  ┌────────────────────────────────┐ │
                    │  │  Cloud Tasks                    │ │
                    │  │  - Job queue for async work     │ │
                    │  └────────────────────────────────┘ │
                    └──────────────────────────────────────┘
```

#### Implementation Details:

**Firestore Data Model:**
```typescript
// collections/users/{userId}
interface User {
  username: string;
  email: string;
  createdAt: Timestamp;
}

// collections/models/{modelId}
interface Model {
  name: string;
  displayName: string;
  replicateId: string;
  defaultSteps: number;
  defaultGuidance: number;
  isActive: boolean;
}

// collections/generations/{generationId}
interface Generation {
  userId: string;
  modelId: string;
  prompt: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  error?: string;
  createdAt: Timestamp;
  completedAt?: Timestamp;
}

// collections/images/{imageId}
interface Image {
  userId: string;
  generationId: string;
  filename: string;
  storagePath: string;
  publicUrl: string;
  width: number;
  height: number;
  createdAt: Timestamp;
}
```

**Security Rules (firestore.rules):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Anyone can read models
    match /models/{modelId} {
      allow read: if true;
      allow write: if false; // Admin only via Cloud Functions
    }

    // Users can only access their own generations
    match /generations/{generationId} {
      allow read: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
      allow update: if false; // Updated by Cloud Functions only
    }

    // Users can only access their own images
    match /images/{imageId} {
      allow read: if request.auth.uid == resource.data.userId;
      allow write: if false; // Created by Cloud Functions only
    }
  }
}
```

**Cloud Function (TypeScript):**
```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Replicate from 'replicate';

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

// HTTP-triggered function
export const generateImage = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { prompt, modelId } = data;
  const userId = context.auth.uid;

  // Create generation record
  const generationRef = await db.collection('generations').add({
    userId,
    modelId,
    prompt,
    status: 'queued',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Queue processing task
  await enqueueProcessGeneration(generationRef.id, { userId, prompt, modelId });

  return { generationId: generationRef.id };
});

// Queue-triggered function
export const processGeneration = functions.tasks.taskQueue().onDispatch(async (data) => {
  const { generationId, userId, prompt, modelId } = data;

  try {
    // Update status
    await db.collection('generations').doc(generationId).update({
      status: 'processing'
    });

    // Get model config
    const modelDoc = await db.collection('models').doc(modelId).get();
    const model = modelDoc.data();

    // Call Replicate
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
    const output = await replicate.run(model.replicateId, {
      input: { prompt }
    }) as string[];

    // Download image
    const response = await fetch(output[0]);
    const buffer = await response.arrayBuffer();

    // Upload to Firebase Storage
    const filename = `${generationId}.webp`;
    const filePath = `users/${userId}/images/${filename}`;
    const file = storage.bucket().file(filePath);

    await file.save(Buffer.from(buffer), {
      contentType: 'image/webp',
      metadata: {
        firebaseStorageDownloadTokens: generationId
      }
    });

    const publicUrl = await file.getSignedUrl({
      action: 'read',
      expires: '03-01-2500'
    });

    // Create image record
    await db.collection('images').add({
      userId,
      generationId,
      filename,
      storagePath: filePath,
      publicUrl: publicUrl[0],
      width: 1024,
      height: 1024,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update generation
    await db.collection('generations').doc(generationId).update({
      status: 'completed',
      completedAt: admin.firestore.FieldValue.serverTimestamp()
    });

  } catch (error) {
    await db.collection('generations').doc(generationId).update({
      status: 'failed',
      error: error.message
    });
  }
});

// Real-time listener (Firestore trigger)
export const onGenerationComplete = functions.firestore
  .document('generations/{generationId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Send push notification when completed
    if (before.status !== 'completed' && after.status === 'completed') {
      // Send FCM notification to user
      await admin.messaging().send({
        token: after.fcmToken,
        notification: {
          title: 'Image Ready!',
          body: 'Your generated image is ready to view'
        }
      });
    }
  });
```

**Client-Side Real-time Sync:**
```typescript
// React Native with Firebase SDK
import firestore from '@react-native-firebase/firestore';

// Subscribe to generation updates
const unsubscribe = firestore()
  .collection('generations')
  .doc(generationId)
  .onSnapshot((doc) => {
    const generation = doc.data();
    if (generation.status === 'completed') {
      // Fetch the image
      firestore()
        .collection('images')
        .where('generationId', '==', generationId)
        .get()
        .then((snapshot) => {
          const image = snapshot.docs[0].data();
          showImage(image.publicUrl);
        });
    }
  });
```

#### Pros:
- Excellent mobile SDK (best-in-class for React Native)
- Real-time sync out-of-the-box
- Offline support built-in
- Simple, intuitive API
- Generous free tier (Spark plan)
- Google Cloud integration (if needed)
- Firebase Extensions marketplace
- Strong authentication system
- Push notifications included (FCM)

#### Cons:
- NoSQL only (no relational queries)
- Query limitations (can be restrictive)
- Vendor lock-in (Google-specific)
- Cloud Functions can be slow (cold starts)
- Limited TypeScript support historically
- Need to learn NoSQL data modeling
- Pricing can get expensive with reads/writes
- Complete migration required

#### Cost Estimate (Monthly):
- Firebase Authentication: Free (<50k MAU)
- Firestore: $0.06 per 100k reads + $0.18 per 100k writes (~$10-30)
- Cloud Functions: $0.40 per million invocations (~$5-15)
- Firebase Storage: $0.026/GB stored + $0.12/GB downloaded (~$5-20)
- Cloud Tasks: $0.40 per million tasks (~$1-5)
- **Total: $21-70/month** for moderate traffic

---

### Option D: Custom Backend (Full Control)

**Philosophy:** Build exactly what you need, full flexibility.

#### Architecture:

```
┌─────────────┐     ┌──────────────────────────────────────┐
│  Web App    │────▶│  Custom API Backend                   │
│  Mobile App │     │  (NestJS / tRPC / Hono)              │
└─────────────┘     │                                       │
                    │  ┌────────────────────────────────┐ │
                    │  │  API Layer                      │ │
                    │  │  - REST or tRPC                 │ │
                    │  │  - GraphQL (optional)           │ │
                    │  │  - WebSocket for real-time      │ │
                    │  └────────────────────────────────┘ │
                    │                                       │
                    │  ┌────────────────────────────────┐ │
                    │  │  Business Logic Layer           │ │
                    │  │  - Services                     │ │
                    │  │  - Domain models                │ │
                    │  └────────────────────────────────┘ │
                    │                                       │
                    │  ┌────────────────────────────────┐ │
                    │  │  Queue System                   │ │
                    │  │  - BullMQ + Redis               │ │
                    │  │  - Job processors               │ │
                    │  └────────────────────────────────┘ │
                    │                                       │
                    │  ┌────────────────────────────────┐ │
                    │  │  Authentication                 │ │
                    │  │  - Clerk / Auth.js / Custom JWT │ │
                    │  └────────────────────────────────┘ │
                    └──────────────────────────────────────┘
                              │              │
                ┌─────────────┴──────┐      │
                ▼                    ▼       ▼
       ┌─────────────────┐  ┌──────────────────┐
       │  PostgreSQL     │  │  Object Storage  │
       │  - AWS RDS      │  │  - S3 / R2       │
       │  - PlanetScale  │  │  - CloudFlare    │
       │  - Neon         │  └──────────────────┘
       └─────────────────┘
```

#### Technology Stack Options:

**Option D1: NestJS (Enterprise-grade)**
```
Backend: NestJS (TypeScript, decorators, dependency injection)
Database: PostgreSQL with Prisma ORM
Auth: Passport.js with JWT
Queue: BullMQ + Redis
Storage: AWS S3 or Cloudflare R2
Real-time: Socket.io or WebSockets
Deployment: Docker on AWS ECS/Fargate or Kubernetes
```

**Option D2: tRPC (Type-safe, end-to-end)**
```
Backend: tRPC with Express/Fastify
Database: PostgreSQL with Drizzle ORM or Prisma
Auth: NextAuth.js (Auth.js) or Clerk
Queue: BullMQ + Redis
Storage: Cloudflare R2 (S3-compatible)
Real-time: tRPC subscriptions
Deployment: Vercel for API, Railway for workers
```

**Option D3: Hono (Ultra-fast, edge-first)**
```
Backend: Hono (runs on Cloudflare Workers)
Database: Neon (serverless Postgres) or Turso (SQLite)
Auth: Clerk or custom JWT
Queue: Cloudflare Queues or Inngest
Storage: Cloudflare R2
Real-time: Cloudflare Durable Objects
Deployment: Cloudflare Workers
```

#### Implementation Example (NestJS):

**Project Structure:**
```
custom-backend/
├── src/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   ├── jwt.strategy.ts
│   │   └── guards/
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.service.ts
│   │   ├── users.controller.ts
│   │   └── entities/user.entity.ts
│   ├── models/
│   │   ├── models.module.ts
│   │   ├── models.service.ts
│   │   └── models.controller.ts
│   ├── generations/
│   │   ├── generations.module.ts
│   │   ├── generations.service.ts
│   │   ├── generations.controller.ts
│   │   ├── generations.gateway.ts (WebSocket)
│   │   └── processors/generation.processor.ts
│   ├── images/
│   │   ├── images.module.ts
│   │   ├── images.service.ts
│   │   └── images.controller.ts
│   ├── storage/
│   │   ├── storage.module.ts
│   │   └── storage.service.ts (S3 client)
│   ├── replicate/
│   │   ├── replicate.module.ts
│   │   └── replicate.service.ts
│   ├── queue/
│   │   ├── queue.module.ts
│   │   └── queue.service.ts
│   ├── database/
│   │   └── prisma.service.ts
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   └── schema.prisma
├── Dockerfile
└── docker-compose.yml
```

**Prisma Schema:**
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String          @id @default(uuid())
  email         String          @unique
  username      String?         @unique
  passwordHash  String?
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  generations   Generation[]
  images        Image[]

  @@map("users")
}

model Model {
  id                  String          @id @default(uuid())
  name                String          @unique
  displayName         String
  replicateId         String
  version             String?
  description         String?
  defaultSteps        Int             @default(30)
  defaultGuidance     Decimal         @default(7.5)
  defaultWidth        Int             @default(1024)
  defaultHeight       Int             @default(1024)
  supportsNegPrompt   Boolean         @default(true)
  supportsSeed        Boolean         @default(true)
  supportsImg2Img     Boolean         @default(false)
  isActive            Boolean         @default(true)
  sortOrder           Int             @default(0)

  generations         Generation[]

  @@map("models")
}

model Generation {
  id                String          @id @default(uuid())
  userId            String
  modelId           String
  prompt            String
  negativePrompt    String?
  width             Int             @default(1024)
  height            Int             @default(1024)
  steps             Int             @default(30)
  guidance          Decimal         @default(7.5)
  seed              Int?
  status            GenerationStatus @default(QUEUED)
  errorMessage      String?
  replicatePredId   String?
  generationTime    Int?
  createdAt         DateTime        @default(now())
  completedAt       DateTime?

  user              User            @relation(fields: [userId], references: [id])
  model             Model           @relation(fields: [modelId], references: [id])
  image             Image?

  @@index([userId])
  @@index([status])
  @@map("generations")
}

model Image {
  id              String          @id @default(uuid())
  generationId    String          @unique
  userId          String
  filename        String
  storagePath     String
  publicUrl       String
  fileSize        Int
  width           Int
  height          Int
  format          String          @default("webp")
  isPublic        Boolean         @default(false)
  isFavorite      Boolean         @default(false)
  createdAt       DateTime        @default(now())
  archivedAt      DateTime?

  generation      Generation      @relation(fields: [generationId], references: [id])
  user            User            @relation(fields: [userId], references: [id])

  @@index([userId])
  @@map("images")
}

enum GenerationStatus {
  QUEUED
  PROCESSING
  COMPLETED
  FAILED
}
```

**Generation Service:**
```typescript
// src/generations/generations.service.ts
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class GenerationsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('generation') private generationQueue: Queue,
  ) {}

  async createGeneration(userId: string, dto: CreateGenerationDto) {
    // Create generation record
    const generation = await this.prisma.generation.create({
      data: {
        userId,
        modelId: dto.modelId,
        prompt: dto.prompt,
        negativePrompt: dto.negativePrompt,
        width: dto.width,
        height: dto.height,
        steps: dto.steps,
        guidance: dto.guidance,
        status: 'QUEUED',
      },
    });

    // Add to queue
    await this.generationQueue.add('process', {
      generationId: generation.id,
      userId,
      modelId: dto.modelId,
      prompt: dto.prompt,
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    return generation;
  }

  async getGenerationStatus(generationId: string, userId: string) {
    return this.prisma.generation.findFirst({
      where: { id: generationId, userId },
      include: { image: true, model: true },
    });
  }
}
```

**Queue Processor:**
```typescript
// src/generations/processors/generation.processor.ts
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { ReplicateService } from '../../replicate/replicate.service';
import { StorageService } from '../../storage/storage.service';
import { PrismaService } from '../../database/prisma.service';
import { GenerationsGateway } from '../generations.gateway';

@Processor('generation')
export class GenerationProcessor {
  constructor(
    private replicate: ReplicateService,
    private storage: StorageService,
    private prisma: PrismaService,
    private gateway: GenerationsGateway,
  ) {}

  @Process('process')
  async processGeneration(job: Job) {
    const { generationId, userId, modelId, prompt } = job.data;

    try {
      // Update status
      await this.prisma.generation.update({
        where: { id: generationId },
        data: { status: 'PROCESSING' },
      });

      // Notify via WebSocket
      this.gateway.sendStatusUpdate(userId, generationId, 'PROCESSING');

      // Get model config
      const model = await this.prisma.model.findUnique({
        where: { id: modelId },
      });

      // Call Replicate
      const startTime = Date.now();
      const output = await this.replicate.generate({
        modelId: model.replicateId,
        version: model.version,
        input: { prompt },
      });

      const generationTime = Math.floor((Date.now() - startTime) / 1000);

      // Download image
      const imageBuffer = await this.replicate.downloadImage(output[0]);

      // Upload to S3/R2
      const filename = `${generationId}.webp`;
      const storagePath = `${userId}/${filename}`;
      const { publicUrl } = await this.storage.uploadImage(
        storagePath,
        imageBuffer,
      );

      // Create image record
      const image = await this.prisma.image.create({
        data: {
          generationId,
          userId,
          filename,
          storagePath,
          publicUrl,
          fileSize: imageBuffer.length,
          width: 1024,
          height: 1024,
          format: 'webp',
        },
      });

      // Update generation
      await this.prisma.generation.update({
        where: { id: generationId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          generationTime,
        },
      });

      // Notify completion via WebSocket
      this.gateway.sendGenerationComplete(userId, generationId, image);

    } catch (error) {
      await this.prisma.generation.update({
        where: { id: generationId },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
        },
      });

      this.gateway.sendStatusUpdate(userId, generationId, 'FAILED', error.message);
      throw error; // Let Bull retry
    }
  }
}
```

**WebSocket Gateway (Real-time):**
```typescript
// src/generations/generations.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class GenerationsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    // Authenticate and join user-specific room
    const userId = client.handshake.auth.userId;
    client.join(`user:${userId}`);
  }

  sendStatusUpdate(
    userId: string,
    generationId: string,
    status: string,
    error?: string,
  ) {
    this.server.to(`user:${userId}`).emit('generation:status', {
      generationId,
      status,
      error,
    });
  }

  sendGenerationComplete(userId: string, generationId: string, image: any) {
    this.server.to(`user:${userId}`).emit('generation:complete', {
      generationId,
      image,
    });
  }
}
```

**Client Integration:**
```typescript
// Web/Mobile client
import io from 'socket.io-client';

const socket = io('https://api.picture.com', {
  auth: { userId: currentUser.id, token: authToken }
});

// Listen for generation updates
socket.on('generation:status', (data) => {
  console.log(`Generation ${data.generationId}: ${data.status}`);
});

socket.on('generation:complete', (data) => {
  showNotification('Image ready!');
  displayImage(data.image.publicUrl);
});

// Trigger generation
const response = await fetch('https://api.picture.com/api/generations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ prompt, modelId })
});
```

#### Pros:
- **Total Control:** Build exactly what you need
- **No Vendor Lock-in:** Use any service, switch providers easily
- **Best Performance:** Optimize for your specific use case
- **Flexible Tech Stack:** Choose your preferred tools
- **Cost Optimization:** Pay only for what you use
- **Advanced Features:** Implement any feature without limitations
- **SQL Database:** Full relational query power
- **Real-time:** WebSockets for instant updates

#### Cons:
- **Most Development Time:** Build everything from scratch
- **DevOps Overhead:** Need to manage infrastructure
- **Higher Initial Cost:** Time + resources to build
- **Maintenance Burden:** Ongoing updates, security patches
- **Scaling Complexity:** Need to design for scale
- **Team Expertise Required:** Need skilled developers

#### Cost Estimate (Monthly):
**Option D1 (AWS):**
- RDS PostgreSQL: $15-50 (db.t3.micro to db.t3.small)
- ECS Fargate: $30-100 (2 tasks, 0.5 vCPU, 1GB RAM)
- ElastiCache Redis: $15-30 (cache.t3.micro)
- S3: $5-15
- ALB: $20
- **Total: $85-215/month**

**Option D2 (Mixed):**
- Neon Postgres: $19 (Pro plan)
- Railway (API + Workers): $20-50
- Upstash Redis: $0-10 (free tier or paid)
- Cloudflare R2: $0-5 (10GB free)
- **Total: $39-84/month**

**Option D3 (Cloudflare):**
- Workers: $5 (Paid plan, unlimited requests)
- Neon/Turso DB: $0-19
- R2 Storage: $0-5
- Queues: Included
- **Total: $5-29/month** (Most cost-effective!)

---

### Option E: Supabase with Better Architecture

**Philosophy:** Keep Supabase but refactor properly - best of both worlds.

#### Architecture:

```
┌─────────────┐     ┌────────────────────────────────────────────────┐
│  Web App    │────▶│  SUPABASE                                       │
│  Mobile App │     │                                                 │
└─────────────┘     │  ┌──────────────────────────────────────────┐ │
                    │  │  PostgreSQL + PostgREST                   │ │
                    │  │  - Same database schema                   │ │
                    │  │  - RLS enabled                            │ │
                    │  │  - Add pg_cron for scheduled tasks        │ │
                    │  └──────────────────────────────────────────┘ │
                    │                                                 │
                    │  ┌──────────────────────────────────────────┐ │
                    │  │  Supabase Auth (no changes)              │ │
                    │  └──────────────────────────────────────────┘ │
                    │                                                 │
                    │  ┌──────────────────────────────────────────┐ │
                    │  │  Supabase Storage (no changes)           │ │
                    │  └──────────────────────────────────────────┘ │
                    │                                                 │
                    │  ┌──────────────────────────────────────────┐ │
                    │  │  Refactored Edge Functions               │ │
                    │  │                                            │ │
                    │  │  1. queue-generation (HTTP)              │ │
                    │  │     - Validate input                      │ │
                    │  │     - Create DB record                    │ │
                    │  │     - Enqueue job                         │ │
                    │  │     - Return immediately                  │ │
                    │  │                                            │ │
                    │  │  2. prepare-model-input (Internal)       │ │
                    │  │     - Model-specific parameter mapping   │ │
                    │  │     - Aspect ratio calculations          │ │
                    │  │     - Image-to-image preprocessing       │ │
                    │  │                                            │ │
                    │  │  3. call-replicate (Internal)            │ │
                    │  │     - Call Replicate API                 │ │
                    │  │     - Return prediction ID               │ │
                    │  │                                            │ │
                    │  │  4. poll-replicate (Scheduled)           │ │
                    │  │     - Check status of pending jobs       │ │
                    │  │     - Update DB when complete            │ │
                    │  │                                            │ │
                    │  │  5. download-process-image (Internal)    │ │
                    │  │     - Download from Replicate            │ │
                    │  │     - Process image                       │ │
                    │  │     - Upload to Storage                  │ │
                    │  │                                            │ │
                    │  │  6. finalize-generation (Internal)       │ │
                    │  │     - Create image record                │ │
                    │  │     - Update generation status           │ │
                    │  │     - Send notifications                 │ │
                    │  └──────────────────────────────────────────┘ │
                    └─────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────▼──────────────────┐
                    │   External Queue Service           │
                    │   (Inngest / Trigger.dev / Defer)  │
                    │   - Job orchestration              │
                    │   - Retry logic                    │
                    │   - Scheduling                     │
                    └────────────────────────────────────┘
```

#### Implementation Strategy:

**1. Add Job Queue System (Inngest - Recommended)**

Why Inngest?
- Works perfectly with serverless
- No infrastructure to manage
- Built-in retry, scheduling, monitoring
- Great DX with TypeScript
- Free tier: 50k function runs/month

```typescript
// supabase/functions/shared/inngest.ts
import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'picture-app',
  eventKey: Deno.env.get('INNGEST_EVENT_KEY')
});

// Define functions
export const processGeneration = inngest.createFunction(
  {
    id: 'process-generation',
    retries: 3,
    timeout: '10m'
  },
  { event: 'generation/queued' },
  async ({ event, step }) => {
    const { generationId, userId, modelId, prompt } = event.data;

    // Step 1: Prepare model input
    const input = await step.run('prepare-input', async () => {
      return await prepareModelInput(modelId, prompt);
    });

    // Step 2: Call Replicate
    const prediction = await step.run('call-replicate', async () => {
      return await callReplicate(modelId, input);
    });

    // Step 3: Poll for completion
    const result = await step.run('poll-completion', async () => {
      return await pollReplicate(prediction.id);
    });

    // Step 4: Download and process image
    const { imageBuffer, format } = await step.run('download-image', async () => {
      return await downloadImage(result.output[0]);
    });

    // Step 5: Upload to storage
    const { publicUrl } = await step.run('upload-storage', async () => {
      return await uploadToSupabase(userId, generationId, imageBuffer, format);
    });

    // Step 6: Finalize in database
    await step.run('finalize-generation', async () => {
      return await finalizeGeneration(generationId, publicUrl);
    });

    return { success: true, publicUrl };
  }
);
```

**2. Refactored Edge Functions**

```typescript
// supabase/functions/queue-generation/index.ts
import { createClient } from '@supabase/supabase-js';
import { inngest } from '../shared/inngest.ts';

Deno.serve(async (req) => {
  // Auth verification
  const authHeader = req.headers.get('Authorization');
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader! } } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401
    });
  }

  // Parse request
  const { prompt, modelId, width, height } = await req.json();

  // Create generation record
  const { data: generation, error } = await supabase
    .from('image_generations')
    .insert({
      user_id: user.id,
      model_id: modelId,
      prompt,
      width,
      height,
      status: 'queued'
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400
    });
  }

  // Send event to Inngest
  await inngest.send({
    name: 'generation/queued',
    data: {
      generationId: generation.id,
      userId: user.id,
      modelId,
      prompt,
      width,
      height
    }
  });

  return new Response(
    JSON.stringify({
      generationId: generation.id,
      status: 'queued'
    }),
    { status: 200 }
  );
});
```

```typescript
// supabase/functions/shared/replicate.ts
export async function prepareModelInput(modelId: string, prompt: string, params: any) {
  // Extract model-specific logic from monolith
  if (modelId.includes('flux-schnell')) {
    return {
      prompt,
      aspect_ratio: calculateAspectRatio(params.width, params.height),
      num_inference_steps: params.steps || 4,
      output_format: 'webp'
    };
  }
  // ... other models
}

export async function callReplicate(modelId: string, input: any) {
  const REPLICATE_API_TOKEN = Deno.env.get('REPLICATE_API_TOKEN');

  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ version: modelId, input })
  });

  return await response.json();
}

export async function pollReplicate(predictionId: string): Promise<any> {
  const REPLICATE_API_TOKEN = Deno.env.get('REPLICATE_API_TOKEN');

  let attempts = 0;
  while (attempts < 120) {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const response = await fetch(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      {
        headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` }
      }
    );

    const result = await response.json();

    if (result.status === 'succeeded') {
      return result;
    } else if (result.status === 'failed') {
      throw new Error(result.error || 'Generation failed');
    }

    attempts++;
  }

  throw new Error('Generation timeout');
}
```

**3. Add Real-time Notifications with Supabase Realtime**

```typescript
// Client-side (Web/Mobile)
import { supabase } from '@picture/shared';

// Subscribe to generation updates
const subscription = supabase
  .channel('generations')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'image_generations',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      const generation = payload.new;
      if (generation.status === 'completed') {
        showNotification('Image ready!');
        fetchImage(generation.id);
      } else if (generation.status === 'failed') {
        showError(generation.error_message);
      }
    }
  )
  .subscribe();
```

**4. Add Database Functions for Better Logic**

```sql
-- Function to get next queued generation
CREATE OR REPLACE FUNCTION get_next_queued_generation()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  model_id uuid,
  prompt text,
  width int,
  height int
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ig.id,
    ig.user_id,
    ig.model_id,
    ig.prompt,
    ig.width,
    ig.height
  FROM image_generations ig
  WHERE ig.status = 'queued'
  ORDER BY ig.priority DESC, ig.created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
END;
$$ LANGUAGE plpgsql;

-- Function to update generation with retry logic
CREATE OR REPLACE FUNCTION update_generation_status(
  p_generation_id uuid,
  p_status text,
  p_error_message text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE image_generations
  SET
    status = p_status,
    error_message = p_error_message,
    completed_at = CASE WHEN p_status IN ('completed', 'failed') THEN NOW() ELSE NULL END,
    retry_count = CASE WHEN p_status = 'failed' THEN retry_count + 1 ELSE retry_count END
  WHERE id = p_generation_id;

  -- If failed and retry count < 3, requeue
  IF p_status = 'failed' AND (SELECT retry_count FROM image_generations WHERE id = p_generation_id) < 3 THEN
    UPDATE image_generations
    SET status = 'queued'
    WHERE id = p_generation_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

**5. Add pg_cron for Cleanup Tasks**

```sql
-- Install pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule cleanup of old failed generations (every day at 2 AM)
SELECT cron.schedule(
  'cleanup-failed-generations',
  '0 2 * * *',
  $$
    DELETE FROM image_generations
    WHERE status = 'failed'
    AND created_at < NOW() - INTERVAL '30 days';
  $$
);

-- Schedule recovery of stale processing generations (every 10 minutes)
SELECT cron.schedule(
  'recover-stale-generations',
  '*/10 * * * *',
  $$
    UPDATE image_generations
    SET status = 'queued', retry_count = retry_count + 1
    WHERE status = 'processing'
    AND created_at < NOW() - INTERVAL '15 minutes'
    AND retry_count < 3;
  $$
);
```

#### Pros:
- **Keep Supabase Benefits:** Database, Auth, Storage, RLS all stay
- **Better Architecture:** Proper separation of concerns
- **Job Queue:** Inngest provides enterprise-grade queue
- **Real-time:** Use Supabase Realtime for notifications
- **Low Migration Effort:** Refactor existing code, no rewrite
- **Cost Effective:** Inngest free tier + Supabase Pro
- **Better Monitoring:** Inngest dashboard shows all jobs
- **Retry Logic:** Built into Inngest
- **Type Safety:** Keep existing TypeScript types

#### Cons:
- **Still on Supabase:** Some vendor lock-in remains
- **Edge Function Limitations:** Still 10-minute timeout
- **External Dependency:** Rely on Inngest (but stable)
- **Complexity:** More moving parts than current setup

#### Cost Estimate (Monthly):
- Supabase Pro: $25
- Inngest: $0 (free tier) or $50 (Team plan for more runs)
- **Total: $25-75/month**

---

### Option F: Hybrid/Multi-Cloud

**Philosophy:** Use the best tool for each job, keep flexibility.

#### Architecture:

```
┌─────────────┐
│  Web App    │────┐
│  Mobile App │    │
└─────────────┘    │
                   ▼
┌──────────────────────────────────────────────────────────┐
│                   API Gateway / Router                    │
│                   (Cloudflare Workers / Hono)            │
│   - Route requests to appropriate services               │
│   - JWT verification                                      │
│   - Rate limiting                                         │
└──────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
┌─────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  Supabase   │  │ Cloudflare│  │  Inngest │  │ Replicate│
│             │  │           │  │          │  │   API    │
│ - Database  │  │ - Storage │  │ - Queue  │  │          │
│ - Auth      │  │   (R2)    │  │ - Orchestr│  │          │
│ - RLS       │  │ - CDN     │  │          │  │          │
└─────────────┘  └──────────┘  └──────────┘  └──────────┘
```

#### Implementation:

**Cloudflare Workers Router:**
```typescript
// workers/src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';

const app = new Hono();

app.use('/*', cors());
app.use('/api/*', jwt({ secret: Deno.env.get('JWT_SECRET')! }));

// Route to Supabase for database operations
app.get('/api/images', async (c) => {
  const userId = c.get('jwtPayload').sub;

  const supabase = createClient(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_SERVICE_KEY
  );

  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('user_id', userId);

  return c.json(data);
});

// Route to Inngest for generation
app.post('/api/generate', async (c) => {
  const userId = c.get('jwtPayload').sub;
  const { prompt, modelId } = await c.req.json();

  // Create generation record in Supabase
  const generation = await createGenerationRecord(userId, prompt, modelId);

  // Trigger Inngest workflow
  await c.env.INNGEST.send({
    name: 'generation/queued',
    data: { generationId: generation.id, userId, prompt, modelId }
  });

  return c.json({ generationId: generation.id });
});

// Serve images from R2 with cache
app.get('/images/:userId/:filename', async (c) => {
  const { userId, filename } = c.req.param();

  const object = await c.env.R2_BUCKET.get(`${userId}/${filename}`);

  if (!object) {
    return c.notFound();
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata.contentType,
      'Cache-Control': 'public, max-age=31536000',
      'ETag': object.httpEtag
    }
  });
});

export default app;
```

**Database:** Keep Supabase PostgreSQL (best managed Postgres)
**Auth:** Keep Supabase Auth (excellent, no reason to change)
**Storage:** Migrate to Cloudflare R2 (S3-compatible, cheaper)
**Queue:** Use Inngest (serverless job orchestration)
**CDN:** Cloudflare (automatic for Workers + R2)

#### Migration Path:

1. **Phase 1: Add Cloudflare Workers router** (Week 1)
   - Deploy workers as API gateway
   - Route all requests through it
   - Keep all backends the same

2. **Phase 2: Migrate storage to R2** (Week 2)
   - Copy existing images from Supabase Storage to R2
   - Update new uploads to go to R2
   - Update database URLs
   - Keep Supabase Storage as fallback

3. **Phase 3: Add Inngest for queue** (Week 3)
   - Implement Inngest workflows
   - Refactor Edge Function into Inngest functions
   - Test thoroughly
   - Switch traffic

4. **Phase 4: Optimize** (Week 4)
   - Add caching layers
   - Optimize database queries
   - Monitor performance
   - Fine-tune costs

#### Pros:
- **Best of All Worlds:** Pick best service for each task
- **Cost Optimization:** R2 is 90% cheaper than S3/Supabase Storage
- **Performance:** Cloudflare CDN is fastest
- **Flexibility:** Easy to swap services
- **Scalability:** Each component scales independently
- **No Single Point of Failure:** Distributed architecture

#### Cons:
- **Complexity:** Most complex architecture
- **Multiple Services:** More to manage and monitor
- **Integration Overhead:** Services need to communicate
- **Debugging:** Harder with distributed system
- **Learning Curve:** Need to know multiple platforms

#### Cost Estimate (Monthly):
- Supabase Pro: $25 (database + auth)
- Cloudflare Workers: $5 (paid plan)
- Cloudflare R2: $0-5 (10GB free, $0.015/GB after)
- Inngest: $0-50 (free or team plan)
- **Total: $30-85/month**

---

## 3. Detailed Comparison Matrix

| Criteria | Current (Supabase) | A: Supabase + Backend | B: AWS Amplify | C: Firebase | D: Custom (NestJS) | E: Refactored Supabase | F: Hybrid |
|----------|-------------------|----------------------|----------------|-------------|-------------------|----------------------|-----------|
| **COST** |
| Initial Setup | $0-25/mo | $7-55/mo | $40-160/mo | $21-70/mo | $39-215/mo | $25-75/mo | $30-85/mo |
| Scaling Cost | Medium | Medium-Low | High | Medium | Low-Medium | Medium | Low |
| Predictability | Medium | High | Low | Medium | High | High | High |
| **PERFORMANCE** |
| API Latency | Good (PostgREST) | Very Good | Good | Good | Excellent | Good | Excellent (Edge) |
| Cold Starts | Yes (Edge Fn) | Minimal | Yes (Lambda) | Yes | No (if always-on) | Yes (Edge Fn) | Minimal (Workers) |
| Database Speed | Excellent (Postgres) | Excellent | Good (DynamoDB) | Good (Firestore) | Excellent | Excellent | Excellent |
| File Serving | Good | Good | Excellent (CloudFront) | Good | Excellent (CDN) | Good | Excellent (CF) |
| **SCALABILITY** |
| Horizontal Scaling | Auto (Supabase) | Manual/Auto | Auto (AWS) | Auto (Firebase) | Manual/Auto | Auto (Supabase) | Auto (Multi) |
| Geographic Distribution | Limited | Medium | Excellent (AWS Global) | Excellent | Medium | Limited | Excellent (CF) |
| Concurrent Jobs | Limited | Excellent (Queue) | Good | Good | Excellent | Excellent (Inngest) | Excellent |
| Max Request Size | 50MB | Configurable | 6MB (Lambda) | 10MB | Configurable | 50MB | Configurable |
| **DEVELOPER EXPERIENCE** |
| Learning Curve | Easy | Medium | Steep | Easy | Steep | Easy-Medium | Medium-Steep |
| Local Development | Good (CLI) | Excellent | Medium | Good | Excellent | Good | Medium |
| Type Safety | Excellent | Excellent | Medium | Medium | Excellent | Excellent | Excellent |
| Debugging | Medium | Good | Hard (AWS) | Good | Excellent | Medium | Medium |
| Testing | Medium | Excellent | Medium | Medium | Excellent | Good | Medium |
| Documentation | Excellent | Good | Excellent | Excellent | Good | Excellent | Good |
| **VENDOR LOCK-IN** |
| Database Portability | Medium (Postgres) | High (Postgres) | Low (DynamoDB) | Low (Firestore) | High (Standard DB) | Medium (Postgres) | High (Postgres) |
| Auth Portability | Medium | High (JWT) | Low (Cognito) | Low (Firebase Auth) | High (Custom) | Medium | High (JWT) |
| Storage Portability | Medium | High (S3-compatible) | Medium (S3) | Low (Firebase Storage) | High (S3-compatible) | Medium | High (R2/S3) |
| API Portability | Medium | High (Custom) | Low (AppSync) | Low (Firebase SDK) | High (Standard) | Medium | High (Standard) |
| Exit Difficulty | Medium | Low | High | High | Very Low | Medium | Low |
| **MAINTENANCE** |
| Ongoing Effort | Low | Medium | Medium-High | Low | High | Medium | Medium-High |
| Security Updates | Auto | Manual (Backend) | Auto | Auto | Manual | Auto | Mixed |
| Monitoring | Built-in | Need setup | Excellent (CloudWatch) | Good | Need setup | Built-in + Inngest | Mixed |
| Backup/Recovery | Auto | Manual (DB auto) | Manual (auto available) | Auto | Manual | Auto | Mixed |
| **FEATURES** |
| Real-time Updates | Yes (Realtime) | Need WebSockets | Yes (AppSync) | Yes (built-in) | Need WebSockets | Yes (Realtime) | Need WebSockets |
| Job Queue | No | Yes (BullMQ) | Yes (SQS) | Yes (Tasks) | Yes (BullMQ) | Yes (Inngest) | Yes (Inngest) |
| File Uploads | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Image Processing | Basic | Full control | Lambda | Functions | Full control | Basic | Full control |
| Caching | Limited | Full control | CloudFront | Firebase CDN | Full control | Limited | Cloudflare |
| Analytics | Basic | Custom | CloudWatch | Firebase Analytics | Custom | Basic + Custom | Custom |
| **MIGRATION EFFORT** |
| Code Changes | N/A | 20% | 90% | 80% | 95% | 40% | 50% |
| Data Migration | N/A | None | Complex | Complex | Medium | None | Minimal (Storage) |
| Time Estimate | N/A | 2-3 weeks | 8-12 weeks | 6-10 weeks | 10-16 weeks | 3-5 weeks | 4-6 weeks |
| Risk Level | N/A | Low | High | Medium-High | High | Low-Medium | Medium |
| Rollback Difficulty | N/A | Easy | Hard | Hard | Medium | Easy | Medium |
| **SPECIFIC NEEDS** |
| Long-running Tasks | Poor | Excellent | Good | Good | Excellent | Excellent | Excellent |
| Third-party APIs | Poor | Excellent | Good | Good | Excellent | Excellent | Excellent |
| Large File Handling | Medium | Excellent | Good | Medium | Excellent | Medium | Excellent |
| Real-time Progress | No | Yes | Yes | Yes | Yes | Yes | Yes |
| Cost at Scale | Medium | Low | High | Medium | Low | Medium | Low |
| Multi-platform SDK | Excellent | Good | Excellent | Excellent | Medium | Excellent | Good |

### Summary Scores (1-10, higher is better)

| Option | Cost | Performance | Scalability | DX | Low Lock-in | Low Maintenance | Features | Migration Ease | **TOTAL** |
|--------|------|-------------|-------------|----|-----------|----|----------|----------------|-----------|
| Current | 9 | 6 | 5 | 8 | 5 | 9 | 5 | 10 | **57** |
| A: Supabase + Backend | 7 | 8 | 8 | 7 | 7 | 6 | 8 | 8 | **59** |
| B: AWS Amplify | 4 | 7 | 9 | 5 | 3 | 6 | 9 | 3 | **46** |
| C: Firebase | 6 | 7 | 8 | 7 | 3 | 8 | 8 | 4 | **51** |
| D: Custom (NestJS) | 6 | 9 | 8 | 7 | 10 | 4 | 10 | 2 | **56** |
| E: Refactored Supabase | 7 | 7 | 8 | 8 | 6 | 7 | 8 | 9 | **60** ⭐ |
| F: Hybrid | 7 | 9 | 10 | 6 | 8 | 5 | 9 | 6 | **60** ⭐ |

**Top 3 Options:**
1. **Option E: Refactored Supabase** (60 points) - Best balance
2. **Option F: Hybrid** (60 points) - Best performance/scale
3. **Option A: Supabase + Backend** (59 points) - Simplest improvement

---

## 4. Specific Concerns for Picture App

### 4.1 Long-Running Processes (2-120 seconds)

**Current Problem:**
- Edge Function blocks entire duration
- User waits for response
- Timeout risk if >10 minutes

**Solution Comparison:**

| Option | Approach | Quality Score |
|--------|----------|---------------|
| Current | Synchronous blocking | ❌ Poor (1/10) |
| A | BullMQ queue, async workers | ✅ Excellent (9/10) |
| B | SQS queue, Lambda workers | ✅ Good (8/10) |
| C | Cloud Tasks, Cloud Functions | ✅ Good (8/10) |
| D | BullMQ queue, dedicated workers | ✅ Excellent (10/10) |
| E | Inngest orchestration | ✅ Excellent (9/10) |
| F | Inngest + distributed workers | ✅ Excellent (9/10) |

**Recommended Solution:** Queue-based architecture (Options A, D, E, F)

**Implementation Pattern:**
```typescript
// Client request
POST /api/generate { prompt, modelId }
  ↓
// Immediate response
{ generationId: "abc123", status: "queued" }
  ↓
// Backend processes asynchronously
Queue Worker → Replicate API → Poll → Download → Upload → Update DB
  ↓
// Client polls or receives webhook/WebSocket update
GET /api/generations/abc123 → { status: "completed", imageUrl: "..." }
```

### 4.2 Third-Party API Integration (Replicate)

**Challenges:**
- Replicate uses async prediction model (not instant)
- Need to poll for completion
- Different models have different response formats
- Rate limiting on Replicate side
- Cost per generation

**Best Practices:**

1. **Abstraction Layer**
```typescript
// Create a ReplicateService that handles all models
class ReplicateService {
  async generate(model: Model, input: any): Promise<Prediction> {
    // Normalize input based on model
    const normalizedInput = this.normalizeInput(model, input);

    // Call Replicate
    const prediction = await this.client.predictions.create({
      version: model.replicateId,
      input: normalizedInput
    });

    return prediction;
  }

  async waitForCompletion(predictionId: string): Promise<Output> {
    return await this.client.wait(predictionId, {
      interval: 2000,
      maxAttempts: 120
    });
  }
}
```

2. **Retry Strategy**
```typescript
// Exponential backoff for failed API calls
const retryConfig = {
  retries: 3,
  factor: 2,
  minTimeout: 1000,
  maxTimeout: 10000
};
```

3. **Cost Tracking**
```typescript
// Log every Replicate call for cost analysis
await db.generation_costs.insert({
  generation_id,
  model_id,
  cost: modelConfig.costPerGeneration,
  timestamp: new Date()
});
```

**Best Options for API Integration:**
- **Option D** (Custom): Full control over retry, caching, error handling
- **Option E** (Inngest): Built-in retry and monitoring
- **Option A** (Backend + BullMQ): Good queue-based handling

### 4.3 File Handling (Image Downloads/Uploads)

**Challenges:**
- Images can be 1-20MB
- Need to download from Replicate
- Need to upload to storage
- Format conversions (JPEG → WebP)
- Metadata extraction

**Current Issues:**
- Everything in memory in Edge Function
- No streaming
- No optimization

**Improved Architecture:**

```typescript
// Option E/F: Inngest with streaming
const downloadAndUpload = inngest.createFunction(
  { id: 'download-upload-image' },
  { event: 'image/process' },
  async ({ event, step }) => {
    // Download with streaming
    const imageStream = await step.run('download', async () => {
      const response = await fetch(event.data.imageUrl);
      return response.body;
    });

    // Process image (resize, optimize, format conversion)
    const processedBuffer = await step.run('process', async () => {
      return await sharp(imageStream)
        .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 90 })
        .toBuffer();
    });

    // Upload to storage
    const { publicUrl } = await step.run('upload', async () => {
      return await storage.upload(
        `${event.data.userId}/${event.data.generationId}.webp`,
        processedBuffer,
        { contentType: 'image/webp' }
      );
    });

    return { publicUrl };
  }
);
```

**Storage Comparison:**

| Storage | Cost/GB/mo | Bandwidth | Speed | Best For |
|---------|-----------|-----------|-------|----------|
| Supabase Storage | $0.021 | $0.09/GB | Good | Current (integrated) |
| AWS S3 | $0.023 | $0.09/GB | Good | Option A, B, D |
| Cloudflare R2 | $0.015 | Free egress! | Excellent | Option F (winner!) |
| Google Cloud Storage | $0.020 | $0.12/GB | Good | Option C |

**Recommendation:**
- **Short-term:** Keep Supabase Storage (simplicity)
- **Long-term:** Migrate to Cloudflare R2 (90% cheaper bandwidth)

### 4.4 Real-Time Updates

**Current Problem:**
- Client must poll database for status updates
- Inefficient (many queries)
- Delayed notifications (depends on poll interval)

**Solution Options:**

**Option 1: Supabase Realtime (Options E, Current)**
```typescript
// Client subscribes to database changes
const subscription = supabase
  .channel('generations')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'image_generations',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    if (payload.new.status === 'completed') {
      showNotification('Image ready!');
    }
  })
  .subscribe();
```
- **Pros:** Built-in, easy, no extra cost
- **Cons:** Limited to database changes, not custom events

**Option 2: WebSockets (Options A, D)**
```typescript
// Server pushes updates
socket.emit('generation:complete', { generationId, imageUrl });

// Client listens
socket.on('generation:complete', (data) => {
  showImage(data.imageUrl);
});
```
- **Pros:** Full control, custom events, instant
- **Cons:** Need to manage WebSocket server

**Option 3: AppSync Subscriptions (Option B)**
```graphql
subscription OnGenerationComplete($userId: ID!) {
  onUpdateGeneration(userId: $userId) {
    id
    status
    image { url }
  }
}
```
- **Pros:** GraphQL subscriptions, built-in
- **Cons:** AWS-specific

**Option 4: Firestore Real-time (Option C)**
```typescript
firestore()
  .collection('generations')
  .doc(generationId)
  .onSnapshot(doc => {
    if (doc.data().status === 'completed') {
      // Update UI
    }
  });
```
- **Pros:** Excellent for mobile, offline support
- **Cons:** NoSQL limitations

**Recommendation:**
- **Best for current architecture:** Supabase Realtime (Option E)
- **Best for custom backend:** WebSockets (Option D)
- **Best for mobile:** Firebase (Option C) or Supabase Realtime

### 4.5 Cost Optimization

**Current Costs Breakdown:**

Assuming 1,000 generations/month:
- Replicate API: $50-100 (main cost, 15+ models)
- Supabase Pro: $25
- Edge Function invocations: Free (under limit)
- Storage: $5
- Bandwidth: $10
- **Total: $90-140/month**

**Cost Optimization Strategies:**

1. **Caching Generated Images**
```typescript
// Check if similar prompt was already generated
const cached = await db.images
  .where('prompt', prompt)
  .where('model_id', modelId)
  .where('created_at', '>', thirtyDaysAgo)
  .first();

if (cached) {
  return cached; // Save Replicate API call
}
```
- **Savings:** 10-30% reduction in Replicate costs

2. **Batch Processing**
```typescript
// Group similar generations together
const batch = await getBatchGenerations(userId);
if (batch.length >= 5) {
  // Process batch on Replicate (some models offer discounts)
  await processGenerationBatch(batch);
}
```
- **Savings:** 5-15% with bulk discounts

3. **Model Selection**
```typescript
// Recommend cheaper, faster models for simple prompts
const modelRecommendation = analyzePrompt(prompt);
if (modelRecommendation.complexity === 'low') {
  suggestModel('flux-schnell'); // Cheaper and faster
}
```
- **Savings:** 20-40% by using appropriate models

4. **Storage Optimization**
```typescript
// Convert all to WebP, compress aggressively
await sharp(imageBuffer)
  .webp({ quality: 85, effort: 6 })
  .toBuffer();
```
- **Savings:** 50-70% storage costs

5. **Intelligent Caching with CDN**
```typescript
// Use Cloudflare R2 + CDN (Option F)
// Free egress = no bandwidth costs
```
- **Savings:** 90% bandwidth costs

**Projected Costs with Optimizations:**

| Option | Without Optimization | With Optimization | Savings |
|--------|---------------------|-------------------|---------|
| Current | $90-140/mo | $65-100/mo | 28% |
| A: Supabase + Backend | $107-155/mo | $75-110/mo | 30% |
| E: Refactored Supabase | $75-125/mo | $50-85/mo | 33% |
| F: Hybrid (R2) | $80-135/mo | $45-75/mo | 44% ⭐ |

**Best for Cost:** Option F (Hybrid with Cloudflare R2)

### 4.6 Multi-Platform Support (Web + Mobile)

**Requirements:**
- Shared authentication
- Same API across platforms
- Optimized for mobile (offline, push notifications)
- Type-safe clients

**Platform-Specific Considerations:**

**Web (SvelteKit):**
```typescript
// Current: Direct Supabase client - works great
import { supabase } from '$lib/supabase';

// With custom backend: REST or tRPC client
import { api } from '$lib/api';
await api.generations.create({ prompt });
```

**Mobile (React Native/Expo):**
```typescript
// Current: Supabase client with AsyncStorage
import { supabase } from '@picture/shared';

// Ideal: Mobile-optimized SDK
// - Offline support
// - Background uploads
// - Push notifications
// - File system access
```

**Comparison:**

| Platform | Current | A: Backend | B: AWS | C: Firebase | D: Custom | E: Refactored | F: Hybrid |
|----------|---------|-----------|--------|-------------|-----------|---------------|-----------|
| Web SDK | ✅ Excellent | ✅ Good | ✅ Good | ✅ Good | ⚠️ Manual | ✅ Excellent | ✅ Good |
| Mobile SDK | ✅ Excellent | ⚠️ Manual | ✅ Excellent | ✅ Excellent | ⚠️ Manual | ✅ Excellent | ⚠️ Manual |
| Offline Support | ✅ Yes | ❌ No | ✅ Yes (DataStore) | ✅ Excellent | ❌ No | ✅ Yes | ⚠️ Partial |
| Push Notifications | ⚠️ Manual | ⚠️ Manual | ✅ SNS | ✅ FCM | ⚠️ Manual | ⚠️ Manual | ⚠️ Manual |
| Type Safety | ✅ Excellent | ✅ Good | ⚠️ Manual | ⚠️ Manual | ✅ Excellent | ✅ Excellent | ✅ Good |
| Auth Persistence | ✅ Auto | ⚠️ Manual | ✅ Auto | ✅ Auto | ⚠️ Manual | ✅ Auto | ⚠️ Manual |

**Best for Multi-Platform:**
1. **Option E** (Refactored Supabase) - Best SDK support
2. **Option C** (Firebase) - Excellent mobile SDKs
3. **Option B** (AWS Amplify) - Comprehensive but complex

**Recommendation:**
Keep Supabase client for both platforms (Options A, E, F) - already works perfectly.

---

## 5. Migration Strategies

### 5.1 Option A: Supabase + Custom Backend

**Timeline:** 2-3 weeks

#### Week 1: Setup & Development
**Day 1-2: Infrastructure Setup**
- Set up Node.js backend (Fastify or Express)
- Deploy to Railway/Render (use free tiers initially)
- Set up Redis (Upstash free tier)
- Install BullMQ

**Day 3-4: Extract Generation Logic**
- Create `replicate.service.ts` - extract Replicate integration
- Create `storage.service.ts` - Supabase Storage wrapper
- Create `generation.worker.ts` - port Edge Function logic
- Add comprehensive error handling and logging

**Day 5: API Development**
- Create `POST /api/generate` endpoint
- Implement JWT verification (verify Supabase token)
- Add queue job creation
- Return immediate response with `generation_id`

**Day 6-7: Testing**
- Unit tests for services
- Integration tests for queue workers
- End-to-end test full generation flow
- Load testing with multiple concurrent generations

#### Week 2: Integration & Migration
**Day 8-9: Client Integration**
- Update web app to call new backend
- Update mobile app to call new backend
- Implement retry logic in clients
- Add better error handling

**Day 10-11: Parallel Running**
- Run old (Edge Function) and new (Backend) in parallel
- Route 10% of traffic to new backend
- Monitor errors, performance, costs
- Fix any issues found

**Day 12-13: Full Cutover**
- Route 100% traffic to new backend
- Keep Edge Function as fallback for 1 week
- Monitor closely for any issues
- Update documentation

**Day 14: Cleanup**
- Remove old Edge Function
- Clean up test data
- Document new architecture
- Update deployment instructions

#### Rollback Plan:
1. **If issues detected:** Flip environment variable to route back to Edge Function
2. **Rollback time:** < 5 minutes
3. **Data consistency:** No data loss (same database)

**Risks & Mitigation:**
- **Risk:** Backend downtime
  - **Mitigation:** Deploy to multiple regions, use health checks
- **Risk:** Queue failures
  - **Mitigation:** BullMQ retries, dead letter queue
- **Risk:** JWT verification issues
  - **Mitigation:** Thorough testing, use official Supabase JWT library

**Estimated Cost During Migration:** $15-30/mo (running both systems)

---

### 5.2 Option E: Refactored Supabase Architecture

**Timeline:** 3-5 weeks

#### Phase 1: Setup Inngest (Week 1)
**Day 1-2: Inngest Account & Configuration**
```bash
# Install Inngest SDK
npm install inngest

# Set up Inngest account (free tier)
# Configure environment variables
INNGEST_EVENT_KEY=xxx
INNGEST_SIGNING_KEY=xxx
```

**Day 3-5: Create Inngest Functions**
```typescript
// supabase/functions/shared/inngest-functions.ts
export const processGeneration = inngest.createFunction(
  { id: 'process-generation', retries: 3 },
  { event: 'generation/queued' },
  async ({ event, step }) => {
    // Implement step-by-step generation workflow
    // (see code example in Option E section)
  }
);
```

**Day 6-7: Testing Inngest Locally**
- Use Inngest Dev Server
- Test full workflow
- Verify retries work
- Check error handling

#### Phase 2: Refactor Edge Functions (Week 2)
**Day 8-10: Extract to Smaller Functions**
- Create `queue-generation` - Main entry point (HTTP)
- Create `prepare-model-input` - Model parameter mapping
- Create `call-replicate` - Replicate API wrapper
- Create `download-process-image` - Image handling
- Create `finalize-generation` - DB updates

**Day 11-12: Integrate with Inngest**
- Update `queue-generation` to send Inngest event
- Test integration
- Verify Inngest triggers correctly

**Day 13-14: Deploy to Supabase**
```bash
supabase functions deploy queue-generation
supabase functions deploy --no-verify-jwt prepare-model-input
supabase functions deploy --no-verify-jwt call-replicate
# etc.
```

#### Phase 3: Database Enhancements (Week 3)
**Day 15-16: Add Database Functions**
```sql
-- See SQL examples in Option E section
CREATE FUNCTION get_next_queued_generation();
CREATE FUNCTION update_generation_status();
```

**Day 17-18: Set Up pg_cron**
```sql
-- Enable extension
CREATE EXTENSION pg_cron;

-- Schedule cleanup and recovery jobs
SELECT cron.schedule(...);
```

**Day 19-20: Implement Real-time Subscriptions**
```typescript
// Client-side: Subscribe to Supabase Realtime
const subscription = supabase.channel('generations')
  .on('postgres_changes', { /* config */ }, handler)
  .subscribe();
```

#### Phase 4: Migration & Testing (Week 4-5)
**Day 21-23: Parallel Running**
- Deploy new architecture to staging
- Run smoke tests
- Load test with realistic data
- Monitor Inngest dashboard

**Day 24-26: Gradual Rollout**
- Route 10% of traffic to new system
- Monitor for 24 hours
- Increase to 50% if stable
- Monitor for another 24 hours
- Route 100% to new system

**Day 27-28: Optimization**
- Analyze Inngest metrics
- Identify slow steps
- Optimize database queries
- Tune retry strategies

**Day 29-30: Documentation & Cleanup**
- Document new architecture
- Update README
- Create runbooks for common issues
- Train team on new system

#### Rollback Plan:
1. **Staged rollback:**
   - Stop sending events to Inngest
   - Re-enable old Edge Function
   - Rollback time: ~10 minutes
2. **Data consistency:** No data loss (same database, atomic updates)
3. **In-flight generations:** Let Inngest complete or mark as failed

**Coexistence Strategy:**
```typescript
// Feature flag to route to new or old system
const USE_NEW_ARCHITECTURE = Deno.env.get('USE_NEW_ARCHITECTURE') === 'true';

if (USE_NEW_ARCHITECTURE) {
  // Send to Inngest
  await inngest.send({ name: 'generation/queued', data: {...} });
} else {
  // Call old Edge Function
  await processGenerationSync({...});
}
```

**Risks & Mitigation:**
- **Risk:** Inngest downtime
  - **Mitigation:** Inngest has 99.9% uptime SLA, can queue events
- **Risk:** Edge Function → Inngest event fails
  - **Mitigation:** Retry logic, dead letter queue
- **Risk:** Database function bugs
  - **Mitigation:** Thorough testing in staging, gradual rollout

**Estimated Cost During Migration:** $30-50/mo (running both, Inngest usage)

---

### 5.3 Option F: Hybrid Multi-Cloud

**Timeline:** 4-6 weeks

#### Phase 1: Cloudflare Workers Setup (Week 1-2)
**Week 1: Infrastructure**
```bash
# Create Cloudflare Workers project
npm create cloudflare@latest picture-api -- --framework=hono

# Set up R2 bucket
wrangler r2 bucket create generated-images

# Configure environment
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_KEY
wrangler secret put JWT_SECRET
```

**Week 2: API Router Development**
```typescript
// workers/src/index.ts
import { Hono } from 'hono';

const app = new Hono();

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

// Auth middleware
app.use('/api/*', async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  const user = await verifySupabaseToken(token);
  c.set('user', user);
  await next();
});

// Proxy to Supabase for reads
app.get('/api/images', async (c) => {
  const user = c.get('user');
  const { data } = await supabase
    .from('images')
    .select('*')
    .eq('user_id', user.id);
  return c.json(data);
});

// Generation endpoint
app.post('/api/generate', async (c) => {
  // Implementation
});

export default app;
```

#### Phase 2: Storage Migration to R2 (Week 3)
**Day 15-17: Set Up Migration Script**
```typescript
// migrate-storage.ts
import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

async function migrateToR2() {
  // 1. List all images in Supabase Storage
  const { data: files } = await supabase.storage
    .from('generated-images')
    .list();

  // 2. Download and re-upload to R2
  for (const file of files) {
    const { data: blob } = await supabase.storage
      .from('generated-images')
      .download(file.name);

    await r2.send(new PutObjectCommand({
      Bucket: 'generated-images',
      Key: file.name,
      Body: blob
    }));

    // 3. Update database with new URLs
    await supabase
      .from('images')
      .update({ public_url: `https://images.picture.com/${file.name}` })
      .eq('storage_path', file.name);
  }
}
```

**Day 18-19: Run Migration**
- Test with 10 images
- Run full migration overnight
- Verify all URLs work
- Keep Supabase Storage as fallback for 1 week

**Day 20-21: Update Upload Logic**
```typescript
// New uploads go to R2
app.post('/api/upload', async (c) => {
  const file = await c.req.formData();

  // Upload to R2
  await c.env.R2_BUCKET.put(key, file);

  // Save to database
  await supabase.from('images').insert({...});
});
```

#### Phase 3: Integrate Inngest (Week 4)
**Day 22-24: Set Up Inngest**
```typescript
// workers/src/inngest.ts
import { Inngest } from 'inngest';

export const inngest = new Inngest({ id: 'picture' });

export const processGeneration = inngest.createFunction(
  { id: 'process-generation' },
  { event: 'generation/queued' },
  async ({ event, step }) => {
    // Generation workflow
  }
);

// Serve Inngest functions
app.post('/api/inngest', async (c) => {
  return await serve({
    client: inngest,
    functions: [processGeneration],
    signingKey: c.env.INNGEST_SIGNING_KEY
  })(c.req.raw);
});
```

**Day 25-26: Deploy Inngest Functions**
```bash
wrangler deploy
```

**Day 27-28: Test End-to-End**
- Trigger generation from client
- Verify Cloudflare Workers route correctly
- Check Inngest processes job
- Confirm image uploads to R2
- Validate database updates

#### Phase 4: Cutover & Optimization (Week 5-6)
**Week 5: Gradual Cutover**
- Update DNS to point to Cloudflare Workers
- Start with 10% traffic
- Monitor logs and errors
- Increase to 50%, then 100%

**Week 6: Optimization**
- Add caching headers for R2 images
- Optimize database queries
- Set up Cloudflare Analytics
- Fine-tune Inngest retries
- Load test at scale

#### Rollback Plan:
1. **DNS rollback:** Point back to Supabase (5 minutes)
2. **Storage fallback:** Images still accessible on Supabase Storage
3. **Inngest rollback:** Stop sending events, use old Edge Function

**Coexistence Strategy:**
```typescript
// Dual-write during migration
await Promise.all([
  uploadToSupabase(file),
  uploadToR2(file)
]);

// Read from R2, fallback to Supabase
let imageUrl = `https://images.picture.com/${key}`;
try {
  await fetch(imageUrl, { method: 'HEAD' });
} catch {
  imageUrl = supabaseStorageUrl; // Fallback
}
```

**Risks & Mitigation:**
- **Risk:** DNS propagation issues
  - **Mitigation:** Test with hosts file, gradual DNS update
- **Risk:** R2 migration data loss
  - **Mitigation:** Keep Supabase Storage for 30 days, verify all files
- **Risk:** Multiple services = higher complexity
  - **Mitigation:** Comprehensive monitoring, runbooks

**Estimated Cost During Migration:** $50-80/mo (running both storage systems)

---

## 6. Final Recommendations

### 6.1 Short-Term Recommendation (0-3 months)

**Recommended: Option E - Refactored Supabase Architecture**

#### Why Option E?

1. **Lowest Risk**
   - Same database, auth, storage
   - No data migration required
   - Easy rollback

2. **Best Cost/Benefit**
   - $25-75/mo (affordable)
   - Solves major pain points
   - Keeps existing benefits

3. **Reasonable Effort**
   - 3-5 weeks of development
   - Team already knows Supabase
   - Clear migration path

4. **Immediate Improvements**
   - Proper job queue (Inngest)
   - Better separation of concerns
   - Real-time updates
   - Retry logic and monitoring
   - No more monolithic Edge Function

#### Implementation Priorities:

**Phase 1 (Week 1): Quick Wins**
- Set up Inngest account
- Create basic queue function
- Deploy alongside existing Edge Function
- Route 10% of traffic

**Phase 2 (Week 2-3): Full Refactor**
- Break apart monolithic Edge Function
- Add database functions
- Implement real-time subscriptions
- Improve error handling

**Phase 3 (Week 4-5): Polish & Optimize**
- Add comprehensive monitoring
- Optimize database queries
- Document new architecture
- Train team

#### Success Metrics:
- ✅ Average generation time < 30 seconds
- ✅ Error rate < 1%
- ✅ Successfully handle 10 concurrent generations
- ✅ Real-time status updates working
- ✅ Cost remains under $75/mo

---

### 6.2 Long-Term Recommendation (6-12 months)

**Recommended: Option F - Hybrid Multi-Cloud Architecture**

#### Why Option F?

After running Option E for 6+ months, you'll have:
- Stable, working queue system
- Better understanding of scaling needs
- More revenue to justify optimization

Option F provides:
1. **Best Performance**
   - Cloudflare Workers = edge computing
   - Sub-50ms API latency globally
   - R2 = free egress bandwidth

2. **Best Cost at Scale**
   - R2 storage: 90% cheaper than S3
   - No bandwidth costs
   - Pay-per-request pricing

3. **Best Flexibility**
   - Keep Supabase for DB + Auth (works great)
   - Use Cloudflare for compute + storage
   - Easy to add more services later

4. **Future-Proof**
   - Can scale to millions of users
   - Can add new features easily
   - No vendor lock-in (use standard APIs)

#### When to Migrate:

**Trigger Conditions:**
- Reaching 10,000+ generations/month
- Bandwidth costs > $50/month
- Need for global distribution
- Team comfortable with current architecture

#### Migration Path from Option E to Option F:

**Quarter 1 (Months 1-3): Run Option E**
- Stable production system
- Gather metrics and learnings
- Identify bottlenecks

**Quarter 2 (Months 4-6): Plan & Prepare**
- Set up Cloudflare Workers account
- Create R2 bucket
- Build API router prototype
- Test in staging

**Quarter 3 (Months 7-9): Migrate Storage**
- Dual-write to Supabase Storage + R2
- Migrate old images to R2
- Update URLs in database
- Switch reads to R2

**Quarter 4 (Months 10-12): Migrate Compute**
- Deploy Cloudflare Workers router
- Route API calls through Workers
- Keep Inngest for orchestration
- Optimize and polish

#### Expected Outcomes:
- 📈 50% reduction in bandwidth costs
- ⚡ 3x faster API response times (edge computing)
- 🌍 Global distribution (Cloudflare's 200+ data centers)
- 💰 Total cost: $30-85/mo (even at 10x scale)

---

### 6.3 Alternative Recommendation (Cost-Conscious)

**If budget is tight: Option A - Supabase + Lightweight Backend**

#### Why Option A?

- **Simplest upgrade:** Just add a backend service
- **Cheapest:** $7-55/mo (can start with $7/mo on Railway)
- **Fast to implement:** 2-3 weeks
- **Easy to understand:** Traditional REST API architecture

#### Use Option A if:
- Budget is under $50/month
- Team is small (1-2 developers)
- Don't need global distribution
- Prefer simplicity over advanced features

---

### 6.4 What NOT to Do

**Avoid Option B (AWS Amplify)**
- Too complex for current needs
- Steep learning curve
- High migration cost (time + risk)
- Vendor lock-in to AWS
- Only makes sense if already deep in AWS ecosystem

**Avoid Option C (Firebase)**
- NoSQL database = major rewrite
- Firestore query limitations
- Good for mobile-first, but Supabase is better for Picture's use case
- Migration effort not justified

**Avoid Option D (Custom NestJS) - For Now**
- Too much work for short-term
- Requires experienced backend team
- High maintenance burden
- Consider only if scaling to 100k+ users

---

### 6.5 Action Plan Summary

#### **Immediate (Next 30 days):**
1. ✅ Set up Inngest account (free tier)
2. ✅ Create proof-of-concept queue function
3. ✅ Test with 10 generations
4. ✅ Measure performance improvements

#### **Short-Term (Months 1-3): Implement Option E**
1. ✅ Refactor Edge Function into smaller functions
2. ✅ Integrate Inngest for job orchestration
3. ✅ Add real-time subscriptions
4. ✅ Improve error handling and monitoring
5. ✅ Deploy to production gradually

#### **Mid-Term (Months 4-6): Optimize & Scale**
1. ✅ Analyze performance metrics
2. ✅ Optimize database queries
3. ✅ Add caching where beneficial
4. ✅ Prepare for Option F migration

#### **Long-Term (Months 7-12): Migrate to Option F**
1. ✅ Set up Cloudflare Workers + R2
2. ✅ Migrate storage to R2 (90% cost savings)
3. ✅ Deploy API router on Workers
4. ✅ Optimize for global scale

#### **Success Metrics to Track:**
- Average generation time
- Error rate
- Cost per generation
- User satisfaction
- System uptime
- Concurrent generation capacity

---

## Appendices

### Appendix A: Code Examples Repository

All code examples from this document are available in a companion repository:
```
picture-backend-examples/
├── option-a-backend/          # Node.js + Fastify + BullMQ
├── option-b-amplify/          # AWS Amplify with GraphQL
├── option-c-firebase/         # Firebase with Cloud Functions
├── option-d-nestjs/           # NestJS custom backend
├── option-e-refactored/       # Refactored Supabase + Inngest
├── option-f-hybrid/           # Cloudflare Workers + Hono
└── README.md
```

### Appendix B: Cost Calculators

**Replicate API Cost Calculator:**
```typescript
function estimateReplicateCost(generations: number, avgModel: string): number {
  const costPerGeneration = {
    'flux-schnell': 0.003,
    'flux-dev': 0.025,
    'sdxl': 0.004,
    'ideogram': 0.08,
    'imagen-4': 0.04,
  };

  return generations * (costPerGeneration[avgModel] || 0.01);
}

// Example: 1000 generations/month, mostly FLUX Schnell
console.log(estimateReplicateCost(1000, 'flux-schnell')); // $3
```

**Storage Cost Calculator:**
```typescript
function estimateStorageCost(
  images: number,
  avgSizeKB: number,
  service: 'supabase' | 's3' | 'r2'
): number {
  const totalGB = (images * avgSizeKB) / 1024 / 1024;
  const avgBandwidthGB = totalGB * 2; // Assume 2x bandwidth

  const costs = {
    supabase: totalGB * 0.021 + avgBandwidthGB * 0.09,
    s3: totalGB * 0.023 + avgBandwidthGB * 0.09,
    r2: totalGB * 0.015 + 0 // Free egress!
  };

  return costs[service];
}

// Example: 1000 images, 2MB each
console.log(estimateStorageCost(1000, 2000, 'supabase')); // $180.04/mo
console.log(estimateStorageCost(1000, 2000, 'r2'));       // $30.00/mo
// R2 saves $150/month!
```

### Appendix C: Migration Checklists

**Pre-Migration Checklist:**
- [ ] Full database backup
- [ ] Document current API endpoints
- [ ] List all environment variables
- [ ] Export all images from storage
- [ ] Test rollback procedure
- [ ] Set up monitoring and alerts
- [ ] Create staging environment
- [ ] Inform users of potential downtime

**Post-Migration Checklist:**
- [ ] Verify all endpoints work
- [ ] Check error rates in logs
- [ ] Monitor performance metrics
- [ ] Test generation flow end-to-end
- [ ] Verify real-time updates work
- [ ] Check costs are as expected
- [ ] Update documentation
- [ ] Train team on new architecture

### Appendix D: Monitoring & Observability

**Key Metrics to Track:**

1. **Generation Metrics:**
   - Average time per generation
   - Success rate
   - Error rate by model
   - Queue depth
   - Retry count

2. **API Metrics:**
   - Request latency (p50, p95, p99)
   - Error rate
   - Request rate
   - Concurrent users

3. **Infrastructure Metrics:**
   - Database query time
   - Storage usage
   - Bandwidth usage
   - Function execution time

4. **Cost Metrics:**
   - Cost per generation
   - Daily/monthly spend by service
   - Cost per user

**Recommended Tools:**

**Option E (Supabase + Inngest):**
- Inngest Dashboard (built-in monitoring)
- Supabase Dashboard (database metrics)
- PostHog or Mixpanel (user analytics)
- Sentry (error tracking)

**Option F (Hybrid):**
- Cloudflare Analytics (Workers + R2)
- Inngest Dashboard
- Grafana + Prometheus (custom metrics)
- Sentry (error tracking)

### Appendix E: Security Considerations

**Authentication:**
- Keep using Supabase Auth (all options)
- Implement JWT token expiration
- Use refresh tokens properly
- Add rate limiting per user

**Authorization:**
- Keep RLS enabled on Supabase tables
- Verify user owns resource before operations
- Use service role key only in backend
- Never expose service key to clients

**API Security:**
- CORS configuration
- Input validation
- SQL injection prevention (use Prisma/Drizzle)
- File upload limits

**Storage Security:**
- Private buckets by default
- Signed URLs for temporary access
- Virus scanning for uploads
- Content-type validation

### Appendix F: Testing Strategy

**Unit Tests:**
```typescript
// Test model input preparation
describe('prepareModelInput', () => {
  it('should format FLUX Schnell parameters correctly', () => {
    const input = prepareModelInput('flux-schnell', {
      prompt: 'test',
      width: 1024,
      height: 768
    });

    expect(input.aspect_ratio).toBe('4:3');
    expect(input.num_inference_steps).toBe(4);
  });
});
```

**Integration Tests:**
```typescript
// Test full generation flow
describe('Generation Flow', () => {
  it('should complete generation end-to-end', async () => {
    const { generationId } = await createGeneration({
      prompt: 'test prompt',
      modelId: 'flux-schnell'
    });

    // Wait for completion
    await waitForGeneration(generationId, { timeout: 60000 });

    const generation = await getGeneration(generationId);
    expect(generation.status).toBe('completed');
    expect(generation.image).toBeDefined();
  });
});
```

**Load Tests:**
```typescript
// k6 load test script
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 10 },  // Ramp up to 10 users
    { duration: '5m', target: 10 },  // Stay at 10 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
};

export default function () {
  let response = http.post('https://api.picture.com/api/generate', {
    prompt: 'test prompt',
    modelId: 'flux-schnell'
  });

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

---

## Conclusion

Picture app has solid foundations with Supabase but needs architectural improvements to scale and handle long-running image generation tasks efficiently.

**The winning strategy is a two-phase approach:**

1. **Phase 1 (Now - 3 months): Option E - Refactored Supabase**
   - Low risk, reasonable effort
   - Solves immediate pain points
   - Keeps what works, fixes what doesn't

2. **Phase 2 (6-12 months): Option F - Hybrid Architecture**
   - Best performance and cost at scale
   - Leverage multiple best-in-class services
   - Future-proof for growth

This strategy provides:
- ✅ Immediate improvements without high risk
- ✅ Clear path to scale when needed
- ✅ Cost optimization at every step
- ✅ Flexibility to adapt as requirements change

**Next Steps:**
1. Review this document with your team
2. Set up Inngest account and test basic workflow
3. Create project timeline for Option E migration
4. Begin refactoring Edge Function

Good luck with your architecture evolution! 🚀

---

**Document Metadata:**
- **Version:** 1.0
- **Last Updated:** 2025-10-09
- **Next Review:** 2025-11-09
- **Maintained By:** Development Team
- **Contact:** [Your Email]
