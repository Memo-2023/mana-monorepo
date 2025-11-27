# TypeScript Type Check Analysis Report

**Generated:** 2025-11-27
**Total Errors:** 673 errors across 11 projects
**CI Status:** FAILING (exit code 1)

---

## Executive Summary

The CI/CD pipeline is failing at the "Type Check" step due to 673 TypeScript errors distributed across 11 projects. The errors fall into clear patterns that can be addressed systematically.

### High-Level Issues

1. **Missing Dependencies** - 56 errors (TS2307)
2. **Missing Properties** - 102 errors (TS2339)
3. **Type Mismatches** - 75 errors (TS2304, TS2322)
4. **Configuration Issues** - 2 errors (Vitest config, Turbo.json)

---

## 1. Error Distribution by Project

### Critical (High Error Count)

| Project | Errors | Priority | Status |
|---------|--------|----------|--------|
| `apps/maerchenzauber/apps/mobile` | 278 | P0 | BLOCKING |
| `apps/picture/apps/web` | 115 | P0 | BLOCKING |
| `apps/picture/apps/mobile` | 111 | P0 | BLOCKING |
| `apps/presi/apps/mobile` | 74 | P1 | BLOCKING |
| `apps/maerchenzauber/apps/backend` | 33 | P1 | BLOCKING |
| `apps/nutriphi/apps/mobile` | 29 | P2 | BLOCKING |
| `apps/chat/apps/web` | 26 | P2 | BLOCKING |

### Low Impact (Minor Issues)

| Project | Errors | Priority | Status |
|---------|--------|----------|--------|
| `games/voxel-lava/apps/web` | 3 | P3 | Minor |
| `packages/test-config` | 2 | P3 | Minor |
| `apps/wisekeep/apps/web` | 1 | P4 | Trivial |
| `apps/nutriphi/apps/web` | 1 | P4 | Trivial |

---

## 2. Error Categorization by Type

### Top Error Codes (by frequency)

| Code | Count | Type | Description |
|------|-------|------|-------------|
| TS2339 | 102 | Property | Property does not exist on type |
| TS2304 | 75 | Type | Cannot find name/type |
| TS2322 | 63 | Assignment | Type not assignable to type |
| TS2307 | 56 | Module | Cannot find module |
| TS2769 | 53 | Overload | No overload matches call |
| TS2551 | 49 | Property | Property does not exist (suggestion) |
| TS2345 | 26 | Argument | Argument type not assignable |
| TS7006 | 24 | Implicit Any | Parameter has implicit 'any' |
| TS7031 | 17 | Index | Not all paths return value |
| TS18048 | 9 | Nullable | Possibly undefined |
| TS18046 | 9 | Nullable | Possibly null/undefined |

---

## 3. Pattern Analysis

### 3.1 Missing Module Patterns (TS2307: 56 occurrences)

#### Missing Internal Packages (CRITICAL)

```
10×  @mana-core/nestjs-integration
```

**Impact:** Breaks `apps/maerchenzauber/apps/backend`
**Files Affected:**
- `src/app.module.ts`
- `src/character/character.controller.ts`
- `src/creators/creators.controller.ts`
- `src/feedback/feedback.controller.ts`
- `src/story/story.controller.ts`
- Multiple test files

**Root Cause:** Package likely exists but not properly exported or installed
**Fix:** Verify package exists in `packages/` and is properly referenced in package.json

#### Firebase Dependencies (CRITICAL)

```
7×  ../firebaseConfig
4×  firebase/firestore
2×  firebase/auth
2×  firebase/storage
1×  firebase-admin
```

**Impact:** Breaks mobile apps (presi, maerchenzauber)
**Root Cause:** Firebase imports in code but Firebase SDK not installed or incomplete migration to Supabase
**Fix Strategy:**
- **Option 1:** Complete Firebase → Supabase migration (remove all Firebase code)
- **Option 2:** Add Firebase dependencies to package.json
- **Recommended:** Option 1 (align with architecture)

#### Missing React Native Dependencies (HIGH)

```
5×  react-native-blurhash
2×  react-native-vector-icons/MaterialIcons
2×  react-native-svg
1×  @react-native-async-storage/async-storage
```

**Impact:** Breaks mobile app UI components
**Fix:** Add missing dependencies to mobile app package.json files

#### Test Dependencies (MEDIUM)

```
6×  @jest/globals
```

**Impact:** Test files fail type checking
**Fix:** Add `@jest/globals` to devDependencies

#### Other Missing Modules (LOW)

```
3×  dotenv
1×  axios
1×  @picture/design-tokens
```

**Fix:** Add to respective package.json files

---

### 3.2 Missing Property Patterns (TS2339: 102 occurrences)

#### Theme System Issues (CRITICAL - 6 occurrences)

```typescript
// apps/presi/apps/mobile
Property 'border' does not exist on type 'ThemeColors'
Property 'background' does not exist on type 'ThemeColors'
```

**Files Affected:**
- `components/common/ContextMenu.tsx`
- `components/forms/CreateDeckForm.tsx`
- `components/slides/SlideEditor.tsx`
- `components/decks/DeckShareSettings.tsx`

**Root Cause:** Theme type definition incomplete or outdated
**Fix:** Update `ThemeProvider.tsx` or theme types to include missing properties

#### Auth/User Property Mismatches (HIGH - 11 occurrences)

```typescript
// Common patterns:
Property 'sub' does not exist on type 'User'             (5×)
Property 'uid' does not exist on type 'User'             (3×)
Property 'isAuthenticated' does not exist on type        (3×)
Property 'deckCount' does not exist on type 'object'     (1×)
```

**Root Cause:** Mismatch between Mana Core Auth user type and Supabase/Firebase user types
**Fix:** Create proper type definitions for auth user objects

#### API Response Type Mismatches (HIGH - 15 occurrences)

```typescript
Property 'data' does not exist on type 'Result<any[]>'   (15×)
```

**Root Cause:** Result type wrapper not matching API response expectations
**Fix:** Update Result type or unwrap responses properly

#### UI State Properties (MEDIUM - 7 occurrences)

```typescript
Property 'hovered' does not exist on type 'PressableStateCallbackType'  (5×)
Property 'disabled' does not exist on type                               (3×)
```

**Root Cause:** React Native types version mismatch or incorrect usage
**Fix:** Check React Native version compatibility

---

### 3.3 Type Assignment Issues (TS2322: 63 occurrences)

#### Chat App Type Conflicts (26 errors in chat/apps/web)

**Pattern:**
```typescript
Type 'Model[]' is not assignable to type 'AIModel[]'
Type 'Conversation[]' is not assignable to type 'Conversation[]'
Type 'Template' is not assignable to type 'Template'
```

**Root Cause:** Duplicate type definitions (one in API layer, one in types package)
**Files Affected:**
- `src/lib/stores/chat.svelte.ts`
- `src/lib/stores/conversations.svelte.ts`
- `src/lib/stores/templates.svelte.ts`
- `src/lib/components/templates/TemplateForm.svelte`
- `src/routes/(protected)/chat/+page.svelte`
- `src/routes/(protected)/chat/[id]/+page.svelte`

**Fix:** Unify type definitions - use single source of truth

#### Picture App Type Conflicts (115 errors in picture/apps/web)

Similar pattern to chat app - likely duplicate type definitions.

---

### 3.4 Configuration Issues (2 errors)

#### Vitest Config - `packages/test-config`

```typescript
vitest.config.base.ts(75,5): error TS2769:
  Object literal may only specify known properties,
  and 'watchExclude' does not exist in type 'InlineConfig'.

vitest.config.svelte.ts(70,5): error TS2769:
  Same error
```

**Root Cause:** `watchExclude` removed or renamed in Vitest v3.0+
**Fix:** Remove `watchExclude` or replace with current API

#### Turbo.json - `apps/presi/turbo.json`

```
Invalid turbo.json configuration
No "extends" key found.
```

**Root Cause:** Local turbo.json overriding root config without extending
**Fix:** Add `"extends": "../../turbo.json"` to presi/turbo.json

---

## 4. Prioritized Fix Recommendations

### Phase 1: Blockers (P0 - Required for CI to pass)

#### 1.1 Fix Turbo Configuration (10 min)

**File:** `/Users/wuesteon/dev/mana_universe/manacore-monorepo/apps/presi/turbo.json`

**Action:** Add extends key
```json
{
  "extends": "../../turbo.json",
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    // ... existing config
  }
}
```

**Alternative:** Delete `apps/presi/turbo.json` entirely if no custom config needed.

#### 1.2 Fix Test Config (15 min)

**Files:**
- `packages/test-config/vitest.config.base.ts`
- `packages/test-config/vitest.config.svelte.ts`

**Action:** Remove `watchExclude` property (deprecated in Vitest 3.0)

#### 1.3 Add Missing NestJS Integration Package (30 min)

**Investigation needed:**
- Check if `@mana-core/nestjs-integration` exists in workspace
- If not, create it or use correct package name
- Update all imports in `apps/maerchenzauber/apps/backend`

### Phase 2: Critical Fixes (P0/P1 - Major functionality)

#### 2.1 Complete Firebase Migration (2-4 hours per app)

**Affected Apps:**
- `apps/presi/apps/mobile`
- `apps/maerchenzauber/apps/mobile`

**Actions:**
1. Remove all Firebase imports
2. Replace with Supabase equivalents
3. Update auth flows to use Mana Core Auth
4. Remove `firebaseConfig` files
5. Update storage to use Supabase Storage

**Files to delete:**
- `firebaseConfig.ts` (all instances)
- `services/auth.ts` (Firebase-based)
- `services/firestore.ts`
- `services/storage.ts` (Firebase-based)

**Files to update:**
- Replace with Supabase/Mana Core equivalents

#### 2.2 Add Missing React Native Dependencies (15 min)

**Packages to install:**

```bash
# For maerchenzauber/apps/mobile
pnpm add react-native-blurhash react-native-vector-icons --filter @maerchenzauber/mobile

# For presi/apps/mobile
pnpm add react-native-vector-icons @react-native-async-storage/async-storage --filter @presi/mobile

# For picture/apps/mobile
pnpm add react-native-blurhash react-native-svg --filter @picture/mobile
```

#### 2.3 Fix Chat App Type Conflicts (1-2 hours)

**Strategy:**
1. Identify canonical type location (choose one):
   - `apps/chat/packages/chat-types/` (recommended)
   - `apps/chat/apps/web/src/lib/services/api.ts`

2. Delete duplicate definitions

3. Update all imports to use canonical source

**Types to unify:**
- `AIModel` / `Model`
- `Conversation`
- `Template`
- `Message`
- `Document`
- `Space`

#### 2.4 Fix Picture App Type Conflicts (1-2 hours)

Similar approach to Chat app - unify type definitions.

### Phase 3: Medium Priority (P2 - Quality improvements)

#### 3.1 Fix Theme System (30 min)

**File:** `apps/presi/apps/mobile/components/ThemeProvider.tsx`

**Action:** Add missing properties to theme type definition
```typescript
interface ThemeColors {
  // ... existing properties
  border: string;
  background: string;
}
```

#### 3.2 Fix Auth Type Mismatches (1 hour)

**Create unified auth types:**

```typescript
// packages/shared-auth/src/types.ts
export interface ManaUser {
  id: string;
  sub: string;        // JWT subject
  uid: string;        // User ID (alias for id)
  email: string;
  // ... other properties
}
```

Update all auth stores to use this type.

#### 3.3 Add Missing Test Dependencies (10 min)

```bash
pnpm add -D @jest/globals --filter @maerchenzauber/backend
```

### Phase 4: Low Priority (P3/P4 - Polish)

#### 4.1 Fix Implicit Any Types (30 min)

24 occurrences of parameters with `any` type - add proper types.

#### 4.2 Fix Voxel-Lava Minor Issues (15 min)

3 errors related to:
- `LevelMetadata.userId` nullable vs non-nullable
- `AuthService.updatePassword` missing method

#### 4.3 Fix Nutriphi/Wisekeep Minor Issues (10 min)

1-2 trivial type errors each.

---

## 5. Systematic Fix Patterns

### Pattern 1: Missing Module Dependencies

**Detection:**
```bash
grep "error TS2307" cicd/type-check-output.txt
```

**Fix Template:**
1. Identify package name
2. Run: `pnpm add <package> --filter <app-name>`
3. Verify import paths are correct

### Pattern 2: Type Import Conflicts

**Detection:**
```bash
grep "is not assignable to type" cicd/type-check-output.txt
```

**Fix Template:**
1. Find both type definitions
2. Choose canonical source
3. Delete duplicate
4. Update imports

### Pattern 3: Missing Properties on Types

**Detection:**
```bash
grep "Property '.*' does not exist" cicd/type-check-output.txt
```

**Fix Template:**
1. Locate type definition
2. Add missing property with correct type
3. Or remove usage if property doesn't belong

---

## 6. Estimated Fix Timeline

| Phase | Work | Time Estimate |
|-------|------|---------------|
| Phase 1 (Blockers) | Config fixes, missing packages | 1-2 hours |
| Phase 2 (Critical) | Firebase migration, type unification | 8-12 hours |
| Phase 3 (Medium) | Theme system, auth types | 2-3 hours |
| Phase 4 (Low) | Polish, minor fixes | 1-2 hours |
| **TOTAL** | | **12-19 hours** |

### Recommended Approach

**Option A: Quick Pass (Get CI Green - 4-6 hours)**
1. Fix turbo.json (Phase 1.1)
2. Fix test-config (Phase 1.2)
3. Add missing dependencies (Phase 2.2)
4. Temporarily exclude problematic apps from type-check in turbo.json
5. File issues for remaining errors

**Option B: Comprehensive Fix (Full resolution - 12-19 hours)**
1. Execute all phases in order
2. Systematic elimination of all errors
3. Update documentation
4. Add type checking to pre-commit hooks

---

## 7. Files Requiring Immediate Attention

### Configuration Files (BLOCKING)

```
/apps/presi/turbo.json                                    [ADD extends key]
/packages/test-config/vitest.config.base.ts               [REMOVE watchExclude]
/packages/test-config/vitest.config.svelte.ts             [REMOVE watchExclude]
```

### Missing Dependencies (BLOCKING)

```
/apps/maerchenzauber/apps/backend/package.json            [ADD @mana-core/nestjs-integration]
/apps/maerchenzauber/apps/mobile/package.json             [ADD react-native-blurhash]
/apps/presi/apps/mobile/package.json                      [ADD react-native-vector-icons]
/apps/picture/apps/mobile/package.json                    [ADD react-native-blurhash, react-native-svg]
```

### Type Conflicts (HIGH PRIORITY)

```
/apps/chat/apps/web/src/lib/services/api.ts               [DEDUPE types]
/apps/chat/packages/chat-types/src/index.ts               [CANONICAL source]
/apps/picture/apps/web/                                   [DEDUPE types]
```

### Firebase Migration (HIGH PRIORITY)

```
/apps/presi/apps/mobile/firebaseConfig.ts                 [DELETE - migrate to Supabase]
/apps/presi/apps/mobile/services/auth.ts                  [DELETE - use Mana Core Auth]
/apps/presi/apps/mobile/services/firestore.ts             [DELETE - use Supabase]
/apps/presi/apps/mobile/services/storage.ts               [DELETE - use Supabase Storage]
/apps/maerchenzauber/apps/mobile/firebaseConfig.ts        [DELETE]
```

---

## 8. Next Steps

### Immediate Actions (within 24 hours)

1. ✅ **Fix Turbo Config** - Unblock type-check command
2. ✅ **Fix Test Config** - Remove deprecated Vitest options
3. ⬜ **Investigate @mana-core/nestjs-integration** - Find or create package
4. ⬜ **Add missing dependencies** - Unblock mobile apps

### Short-term (within 1 week)

5. ⬜ **Complete Firebase migration** - Align with architecture
6. ⬜ **Unify Chat app types** - Fix 26 errors
7. ⬜ **Unify Picture app types** - Fix 115 errors

### Medium-term (within 2 weeks)

8. ⬜ **Fix theme system** - Standardize across apps
9. ⬜ **Fix auth types** - Create canonical ManaUser type
10. ⬜ **Add pre-commit type checking** - Prevent regressions

---

## 9. Recommendations for Prevention

1. **Enable type checking in pre-commit hooks**
   - Add to Husky configuration
   - Run on changed files only for speed

2. **Add type checking to PR template checklist**
   - Require `pnpm type-check` to pass
   - Add to GitHub Actions PR checks

3. **Establish canonical type locations**
   - Document where shared types live
   - Prevent duplicate type definitions
   - Use `@manacore/shared-types` for cross-app types

4. **Regular dependency audits**
   - Check for missing peer dependencies
   - Verify all imports resolve correctly
   - Update TypeScript regularly

5. **Architectural alignment**
   - Complete Firebase → Supabase migration
   - Standardize auth implementation
   - Consistent theme system across apps

---

## Appendix A: Error Code Reference

| Code | Category | Description | Common Fixes |
|------|----------|-------------|--------------|
| TS2307 | Module | Cannot find module | Add dependency, fix import path |
| TS2339 | Property | Property does not exist | Add property to type, fix property name |
| TS2322 | Assignment | Type not assignable | Fix type mismatch, use type assertion |
| TS2304 | Type | Cannot find name | Import type, fix typo |
| TS2769 | Overload | No matching overload | Fix function arguments |
| TS2551 | Property | Property missing (with suggestion) | Use suggested property |
| TS7006 | Any | Implicit any | Add type annotation |
| TS2345 | Argument | Wrong argument type | Fix argument type |

---

## Appendix B: Full Error Counts

```
102  TS2339  Property does not exist on type
 75  TS2304  Cannot find name
 63  TS2322  Type is not assignable to type
 56  TS2307  Cannot find module
 53  TS2769  No overload matches this call
 49  TS2551  Property does not exist (suggestion)
 26  TS2345  Argument type not assignable
 24  TS7006  Parameter implicitly has 'any' type
 17  TS7031  Not all code paths return a value
  9  TS18048 Possibly 'undefined'
  9  TS18046 Possibly 'null' or 'undefined'
  6  TS2694  Namespace has no exported member
  5  TS2741  Property is missing in type
  4  TS7019  Rest parameter implicitly has 'any[]' type
  4  TS2683  'this' implicitly has type 'any'
  4  TS2353  Object literal may only specify known properties
  3  TS2580  Cannot find name (suggestion)
  3  TS2459  Module declares locally but is not exported
  3  TS2305  Module has no exported member
  2  TS2454  Variable is used before being assigned
  2  TS2448  Block-scoped variable used before declaration
  1  TS7053  Element implicitly has 'any' type
  1  TS2801  Expected 1 arguments, but got 2
  1  TS2774  Condition will always return true
  1  TS2740  Type is missing properties
  1  TS2445  Property is protected
  1  TS2352  Conversion may be a mistake
  1  TS2349  Cannot invoke expression
  1  TS1149  Class expression expected
```

---

**Report End**
