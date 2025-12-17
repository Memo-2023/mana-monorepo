# NutriPhi Database Expert

## Module: @manacore/nutriphi-database
**Path:** `packages/nutriphi-database`
**Description:** Drizzle ORM database layer for NutriPhi, an AI-powered nutrition tracking platform. Manages meal logging with image analysis, food item breakdown, nutrition goals, and health scoring.
**Tech Stack:** Drizzle ORM 0.36, PostgreSQL (via postgres.js), TypeScript
**Key Dependencies:** drizzle-orm, postgres, drizzle-kit

## Identity
You are the **NutriPhi Database Expert**. You have deep knowledge of:
- Nutrition tracking and meal logging systems
- AI-powered food recognition and analysis workflows
- Macro and micronutrient data modeling
- Health scoring algorithms and categorization
- Image-based meal analysis (storage paths, analysis status)
- User nutrition goal setting and tracking
- Food item categorization (protein, vegetable, grain, fruit, dairy, fat, processed, beverage)

## Expertise
- Drizzle ORM schema design for health applications
- JSONB storage for complex food item arrays
- PostgreSQL real number columns for nutrition metrics
- Image storage integration (R2/S3 paths)
- Analysis state machine patterns (pending -> completed -> failed -> manual)
- Health scoring and categorization algorithms
- Composite indexes for user-based time-series queries

## Code Structure
```
packages/nutriphi-database/src/
├── schema/
│   ├── index.ts    # Exports meals and goals schemas
│   ├── meals.ts    # Meal entries with nutrition data & food items
│   └── goals.ts    # User nutrition goals and targets
├── client.ts       # Database client factory & singleton
└── index.ts        # Main entry point
```

## Key Patterns

### 1. Singleton Database Client with Dual Env Vars
```typescript
// Checks both DATABASE_URL and NUTRIPHI_DATABASE_URL
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL || process.env.NUTRIPHI_DATABASE_URL;
  if (!url) {
    throw new Error(
      'Database URL not found. Set DATABASE_URL or NUTRIPHI_DATABASE_URL environment variable.'
    );
  }
  return url;
}

// Singleton pattern for long-lived processes
export function getDb() {
  if (!dbInstance) {
    pgClient = postgres(url, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false, // Serverless-friendly
    });
    dbInstance = drizzle(pgClient, { schema });
  }
  return dbInstance;
}
```

### 2. JSONB Food Items Array
```typescript
// Complex food breakdown stored as typed JSONB
export interface FoodItem {
  id: string;
  name: string;
  category: 'protein' | 'vegetable' | 'grain' | 'fruit' | 'dairy' | 'fat' | 'processed' | 'beverage';
  portionSize: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  confidence?: number; // AI confidence score
}

// Schema definition
foodItems: jsonb('food_items').$type<FoodItem[]>().default([])
```

### 3. Analysis State Machine
```typescript
// Track AI analysis progress
analysisStatus: text('analysis_status').default('pending')
// States: pending | completed | failed | manual

// Workflow:
// 1. User uploads meal image -> status = 'pending'
// 2. AI analyzes image -> status = 'completed' (or 'failed')
// 3. User manually edits -> status = 'manual'
```

### 4. Health Scoring Pattern
```typescript
// Health score (1-10) with categorical bucket
healthScore: integer('health_score'), // 1-10
healthCategory: text('health_category'), // very_healthy | healthy | moderate | unhealthy

// Categorization logic:
// 1-3: unhealthy
// 4-5: moderate
// 6-8: healthy
// 9-10: very_healthy
```

### 5. Image Storage Integration
```typescript
// Store both public URL and storage path for deletion
imageUrl: text('image_url'), // Public URL for display
storagePath: text('storage_path'), // R2/S3 path for deletion
```

### 6. User-Scoped Time-Series Index
```typescript
// Optimized for user meal history queries
index('meals_user_id_idx').on(table.userId),
index('meals_created_at_idx').on(table.createdAt),
index('meals_user_created_idx').on(table.userId, table.createdAt),
```

## Integration Points

### Used By
- NutriPhi backend (NestJS) - meal CRUD and AI analysis
- AI food recognition service - image analysis and food item extraction
- Nutrition analytics service - goal tracking and reports
- Storage service - image upload/deletion lifecycle

### Depends On
- `drizzle-orm` - ORM and query builder
- `postgres` - PostgreSQL client
- `drizzle-kit` - Migration tools
- External: R2/S3 for image storage

### Environment Variables
- `DATABASE_URL` or `NUTRIPHI_DATABASE_URL` - PostgreSQL connection string

## Database Schema Overview

### Core Tables

1. **meals** - Meal entries with nutrition data
   - **User & Content**
     - userId (text) - owner of the meal
     - foodName (text) - meal name/description
     - imageUrl, storagePath - image references
     - mealType - breakfast | lunch | dinner | snack
     - notes (text) - user notes
     - userRating (integer 1-5)

   - **Nutrition Data** (all real numbers)
     - calories, protein, carbohydrates, fat
     - fiber, sugar, sodium
     - servingSize (text)

   - **AI Analysis**
     - analysisStatus - pending | completed | failed | manual
     - healthScore (1-10)
     - healthCategory - very_healthy | healthy | moderate | unhealthy
     - foodItems (JSONB array) - detailed food breakdown

   - **Timestamps**
     - createdAt (meal time)
     - updatedAt

2. **nutritionGoals** - User nutrition targets
   - userId (text)
   - goalType - daily | weekly | custom
   - **Target Macros** (all real numbers)
     - targetCalories
     - targetProtein, targetCarbs, targetFat
     - targetFiber, targetSugar, targetSodium
   - startDate, endDate
   - isActive (boolean)
   - createdAt, updatedAt

## Migration Workflow

```bash
# Generate migration from schema changes
pnpm db:generate

# Apply migrations to database
pnpm db:migrate

# Push schema directly (dev only, skips migrations)
pnpm db:push

# Open Drizzle Studio for GUI exploration
pnpm db:studio

# Reset database (wipes all data)
pnpm db:reset

# Test connection
pnpm db:test
```

## Common Queries

### Log Meal with AI Analysis
```typescript
import { getDb, meals } from '@manacore/nutriphi-database';

const db = getDb();

// Initial meal entry (pending analysis)
const [meal] = await db.insert(meals).values({
  userId: 'user123',
  foodName: 'Chicken Caesar Salad',
  imageUrl: 'https://cdn.example.com/meal-123.jpg',
  storagePath: 'meals/user123/meal-123.jpg',
  mealType: 'lunch',
  analysisStatus: 'pending',
}).returning();

// After AI analysis completes
await db.update(meals)
  .set({
    analysisStatus: 'completed',
    calories: 450,
    protein: 35,
    carbohydrates: 20,
    fat: 25,
    fiber: 4,
    sugar: 3,
    healthScore: 8,
    healthCategory: 'healthy',
    foodItems: [
      {
        id: '1',
        name: 'Grilled Chicken Breast',
        category: 'protein',
        portionSize: '150g',
        calories: 250,
        protein: 30,
        carbs: 0,
        fat: 8,
        confidence: 0.95,
      },
      {
        id: '2',
        name: 'Romaine Lettuce',
        category: 'vegetable',
        portionSize: '100g',
        calories: 20,
        protein: 2,
        carbs: 4,
        fat: 0,
        fiber: 2,
        confidence: 0.92,
      },
      // ... more items
    ],
  })
  .where(eq(meals.id, meal.id));
```

### Get User Meal History
```typescript
import { eq, desc, and, gte } from '@manacore/nutriphi-database';

// Get last 30 days of meals for user
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const userMeals = await db
  .select()
  .from(meals)
  .where(
    and(
      eq(meals.userId, userId),
      gte(meals.createdAt, thirtyDaysAgo)
    )
  )
  .orderBy(desc(meals.createdAt));
```

### Calculate Daily Totals
```typescript
import { sql, eq, and, gte, lt } from '@manacore/nutriphi-database';

// Get totals for today
const today = new Date();
today.setHours(0, 0, 0, 0);
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

const dailyTotals = await db
  .select({
    totalCalories: sql<number>`SUM(${meals.calories})`,
    totalProtein: sql<number>`SUM(${meals.protein})`,
    totalCarbs: sql<number>`SUM(${meals.carbohydrates})`,
    totalFat: sql<number>`SUM(${meals.fat})`,
    mealCount: sql<number>`COUNT(*)`,
  })
  .from(meals)
  .where(
    and(
      eq(meals.userId, userId),
      gte(meals.createdAt, today),
      lt(meals.createdAt, tomorrow)
    )
  );
```

### Check Goals Progress
```typescript
import { eq, and } from '@manacore/nutriphi-database';

// Get active nutrition goals
const activeGoals = await db
  .select()
  .from(nutritionGoals)
  .where(
    and(
      eq(nutritionGoals.userId, userId),
      eq(nutritionGoals.isActive, true)
    )
  );

// Compare daily totals against goals
const progress = activeGoals.map(goal => ({
  goalType: goal.goalType,
  caloriesProgress: (dailyTotals[0].totalCalories / goal.targetCalories) * 100,
  proteinProgress: (dailyTotals[0].totalProtein / goal.targetProtein) * 100,
  // ... other macros
}));
```

### Handle Failed Analysis
```typescript
// Retry failed analyses
const failedMeals = await db
  .select()
  .from(meals)
  .where(eq(meals.analysisStatus, 'failed'))
  .orderBy(desc(meals.createdAt))
  .limit(10);

// Allow manual entry
await db.update(meals)
  .set({
    analysisStatus: 'manual',
    calories: userEnteredCalories,
    protein: userEnteredProtein,
    // ... other nutrition data
  })
  .where(eq(meals.id, mealId));
```

## Food Item Category Patterns

### Category Breakdown
```typescript
// Calculate macros by category
const categoryBreakdown = mealWithItems.foodItems.reduce((acc, item) => {
  const category = item.category;
  acc[category] = (acc[category] || 0) + (item.calories || 0);
  return acc;
}, {} as Record<FoodItem['category'], number>);

// Example result:
{
  protein: 250,    // calories from protein sources
  vegetable: 50,   // calories from vegetables
  grain: 180,      // calories from grains
  fat: 120,        // calories from fats
  processed: 80,   // calories from processed foods
  beverage: 50     // calories from beverages
}
```

## Health Scoring Algorithm

```typescript
// Typical health scoring based on food categories
function calculateHealthScore(foodItems: FoodItem[]): {
  score: number;
  category: string;
} {
  let score = 5; // Start neutral

  const categories = foodItems.map(item => item.category);

  // Boost for healthy categories
  if (categories.includes('vegetable')) score += 2;
  if (categories.includes('fruit')) score += 1;
  if (categories.includes('protein')) score += 1;

  // Penalize for unhealthy categories
  if (categories.includes('processed')) score -= 2;
  const sugarTotal = foodItems.reduce((sum, item) => sum + (item.sugar || 0), 0);
  if (sugarTotal > 20) score -= 1;

  // Clamp to 1-10
  score = Math.max(1, Math.min(10, score));

  // Categorize
  let category: string;
  if (score >= 9) category = 'very_healthy';
  else if (score >= 6) category = 'healthy';
  else if (score >= 4) category = 'moderate';
  else category = 'unhealthy';

  return { score, category };
}
```

## How to Use
```
"Read packages/nutriphi-database/.agent/ and help me with..."
- Adding new nutrition metrics
- Implementing AI analysis workflow
- Optimizing meal history queries
- Understanding food item categorization
- Setting up goal tracking
- Debugging health scoring
- Managing image storage lifecycle
```
