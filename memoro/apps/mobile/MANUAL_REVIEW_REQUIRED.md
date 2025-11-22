# Manual Review Required - Unused Code Analysis

## Overview
This document lists code items that could potentially be removed but require manual review by the development team before deletion. These items have been identified as potentially unused but carry some risk or uncertainty.

**Generated**: 2025-09-25
**Project**: Memoro App

---

## 🟡 Moderate Risk Items - Review Before Deletion

### 1. Potentially Unused Assets

#### **`/assets/Memoro-Logo.svg`**
- **Status**: No code references found
- **Risk**: May be used by design team or marketing materials
- **Action Required**: Verify with design/product team before deletion
- **Review Questions**:
  - Is this logo used in any external materials?
  - Is this a backup/alternative version needed for branding?

#### **`/assets/videos/loadingstripes-yellow.mp4`**
- **Status**: No JavaScript/TypeScript references found
- **Risk**: May be referenced in native iOS/Android code or planned features
- **Action Required**: Check native code and product roadmap
- **Review Questions**:
  - Is this video referenced in iOS/Android native modules?
  - Is this planned for an upcoming loading animation feature?

### 2. Feature Components

#### **`/features/tags/FloatingTagCreator.tsx`**
- **Status**: Component exists but no imports found
- **Risk**: May be a planned feature not yet implemented
- **Action Required**: Verify with product team about tag management roadmap
- **Review Questions**:
  - Is this part of the upcoming tag management feature?
  - Was this an experimental feature that was abandoned?

### 3. Utility Files

#### **`/utils/speakerUtils.ts`**
- **Status**: Contains diarization utilities but no active usage
- **Risk**: Prepared for future speaker identification features
- **Action Required**: Confirm if speaker diarization is on the roadmap
- **Review Questions**:
  - Is speaker diarization/identification planned?
  - Should this be moved to a "future-features" branch?

### 4. Service Files

#### **`/features/audioRecording/audioRecording.service.ts`**
- **Status**: Old audio recording service, mostly replaced by audioRecordingV2
- **Risk**: May still be used in edge cases or migration paths
- **Action Required**: Verify complete migration to V2
- **Review Questions**:
  - Are all recording features migrated to V2?
  - Can users with old recordings still access them?
  - Is this needed for backward compatibility?

### 5. Migration Hooks

#### **`/hooks/useMigrations.ts`** & **`/hooks/migrations/memoMigrations.ts`**
- **Status**: Migration utilities that may have completed their purpose
- **Risk**: May be needed for users upgrading from older versions
- **Action Required**: Verify if migrations are still needed
- **Review Questions**:
  - Are there users who still need these migrations?
  - Can these be removed after a certain app version?

---

## 🟠 Code Quality Items - Refactoring Needed

### 1. Deprecated File Still in Use

#### **`/utils/timeFormatter.ts`**
- **Status**: Marked as `@deprecated` but still imported in 3 files
- **Current Usage**:
  - `/features/audioPlayer/useAudioPlayer.ts`
  - `/features/storage/fileStorage.service.web.ts`
  - `/features/storage/fileStorage.service.ts`
- **Action Required**: Complete migration to `/utils/formatters.ts`
- **Steps**:
  1. Update the 3 files to use the new formatters
  2. Test audio player and file storage functionality
  3. Delete deprecated file

### 2. Commented Out Code

#### **`/app/(protected)/(tabs)/memos.tsx`**
- Line 37: `// import PromptBar from '~/components/molecules/PromptBar'; // Entfernt`
- Variables: `// const [promptValue, setPromptValue] = useState(''); // Entfernt`
- **Action Required**: Remove if PromptBar feature is permanently removed

#### **`/features/memos/hooks/useMemoState.ts`**
- Line 152: Commented out memory update timeouts
- **Action Required**: Verify if this optimization is no longer needed

#### **`/components/atoms/RecordingButton.tsx`**
- Commented imports and status checks from old audio service
- **Action Required**: Clean up after confirming V2 migration is complete

### 3. TypeScript `any` Types

Multiple files have `TODO` comments about replacing `any` types:
- `/app/(protected)/(memo)/components/MemoTranscript.tsx`
- `/app/(protected)/(memo)/components/MemoModals.tsx`
- `/app/(protected)/(memo)/components/MemoHeader.tsx`

**Action Required**: Define proper TypeScript interfaces for:
- Memo objects
- Memory objects
- Location data
- Processing metadata

### 4. Temporarily Disabled Features

#### Spaces Feature (Multiple Files)
- `/features/spaces/hooks/useSpaces.ts:173`
- `/features/spaces/components/SpaceSelectorRecording.tsx:36`
- `/features/spaces/components/SpaceLinkSelector.tsx:97`

**Status**: "TODO: Temporarily disabled until spaces feature is fully implemented"
**Action Required**: Decide whether to:
- Complete the spaces feature
- Remove it entirely if not on roadmap
- Move to a feature branch

---

## 🟢 Statistics Components - Already Cleaned

The following skeleton components were found unused but kept for documentation:
- `WeekCardSkeleton.tsx` - Could be removed if weekly statistics won't use skeletons
- `WeeklyChartSkeleton.tsx` - Could be removed if chart loading states are handled differently
- `ShimmerPlaceholder.tsx` - Utility component that could be removed

These are low-risk deletions if the statistics feature has moved to different loading states.

---

## Recommended Review Process

### Step 1: Team Review Session
Schedule a 30-minute review with:
- Lead Developer
- Product Manager
- Design Lead (for asset questions)

### Step 2: Decision Matrix
For each item, decide:
- **Keep**: Still needed or will be needed soon
- **Delete**: Confirmed unused and safe to remove
- **Archive**: Move to archive branch for potential future use
- **Refactor**: Needs cleanup but functionality should remain

### Step 3: Implementation
1. Create a cleanup branch
2. Address items based on decisions
3. Run full test suite
4. Deploy to staging for verification
5. Monitor for any issues before production deployment

### Step 4: Future Prevention
Consider implementing:
- Regular cleanup sprints (quarterly)
- ESLint rules for unused code detection
- Code review checklist including unused code check
- Documentation for deprecated code removal process

---

## Quick Reference Commands

```bash
# Find all imports of a specific file
rg "from.*FloatingTagCreator" --type ts --type tsx

# Check if an asset is used
rg "Memoro-Logo\.svg" --type ts --type tsx --type js --type jsx

# List all TODO comments
rg "TODO" --type ts --type tsx

# Find all deprecated markers
rg "@deprecated" --type ts --type tsx

# Run ESLint to find unused variables
npx eslint . --ext .ts,.tsx --rule "no-unused-vars: error"
```

---

**Note**: This document should be reviewed within the next sprint to prevent technical debt accumulation. Items not addressed within 2 sprints should be escalated for a keep/delete decision.