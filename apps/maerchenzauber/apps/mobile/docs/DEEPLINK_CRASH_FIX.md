# iOS Deeplink Crash Fix - Complete Debugging Journey

**Date**: 2025-11-02
**Platform**: iOS 26.0.1 (iPhone 13)
**App**: Märchenzauber v1.1.0
**Issue**: App crashes when opening character sharing deeplinks

## Executive Summary

The app was crashing when users opened deeplinks to shared characters (`maerchenzauber://share/character/{id}`). What appeared to be a single issue was actually **5 distinct crashes** that occurred sequentially during navigation. This document details the complete debugging journey, dead ends, and solutions.

---

## The Problem

### Initial Symptoms
- App crashes ~1 second after opening a character sharing deeplink
- Only happens on physical iOS devices (not simulator)
- User sees "Opening character..." loading screen, then crash
- No obvious error message in logs before crash

### Deeplink Flow
```
1. User clicks: maerchenzauber://share/character/{id}
2. App opens: app/share/character/[id].tsx
3. Should redirect to: app/character/preview/[characterId].tsx
4. Should display: Character preview screen
5. Actually: ❌ CRASH
```

---

## The Debugging Journey

### Crash #1: LinearGradient Rendering (FALSE LEAD)

**Symptoms**:
```
Thread 0 (Main):
RNSScreen setViewToSnapshot + 1416
UIKit snapshotViewAfterScreenUpdates + 148
```

**Initial Diagnosis**: ❌ WRONG
Misdiagnosed as LinearGradient rendering issue based on Stack Overflow comment.

**Action Taken**:
- Updated `expo-linear-gradient` from 14.0.1 → 15.0.7
- Added explicit layout bounds to all LinearGradient components
- Added `minHeight: 100` to login screen gradient

**Result**: Crash still occurred (but we fixed compatibility issues)

**Learning**: Don't trust Stack Overflow comments blindly - analyze the actual crash stack trace.

---

### Crash #2: CoreGraphics Image Deallocation

**Symptoms**:
```
Thread 0 (Main):
CoreGraphics vm_allocator_deallocate + 44
CoreGraphics image_finalize + 60
QuartzCore CA::Layer::~Layer() + 328
```

**Diagnosis**: ✅ CORRECT
Image loading race condition during rapid navigation - images being deallocated while CoreGraphics still rendering them.

**Root Cause**:
```typescript
<Image
  source={{ uri: currentImage }}
  transition={300}  // ❌ Transition conflicts with navigation
/>
```

**Solution**:
```typescript
<Image
  source={{ uri: currentImage }}
  transition={0}  // ✅ Disable transitions
  recyclingKey={characterId}  // ✅ Help expo-image reuse instances
  cachePolicy="memory-disk"  // ✅ Proper caching
/>
```

**Files Modified**:
- `app/character/preview/[characterId].tsx:360`

**Result**: Fixed image crashes, but navigation still crashed.

---

### Crash #3: RNSScreen Snapshot on Share Route

**Symptoms**:
```
Thread 0 (Main):
RNSScreen setViewToSnapshot + 1416
react-native-screens snapshot creation
```

**Diagnosis**: ✅ CORRECT
The `/share/` route wasn't inheriting the root Stack configuration that disables snapshots.

**Root Cause**:
```
app/
├── _layout.tsx          // Has freezeOnBlur: false
└── share/
    ├── _layout.tsx      // ❌ MISSING - needs its own config
    └── character/
        └── [id].tsx
```

**Solution 1**: Created dedicated Stack layout for share route
```typescript
// app/share/_layout.tsx
export default function ShareLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: Platform.OS === 'ios' ? 'none' : 'default',
        freezeOnBlur: false,  // ✅ Prevent snapshots
        presentation: 'transparentModal',  // ✅ Bypass native screens
      }}
    />
  );
}
```

**Solution 2**: Bypassed screen rendering entirely
```typescript
// app/share/character/[id].tsx - BEFORE
export default function ShareCharacterDeeplink() {
  const [loading, setLoading] = useState(true);
  return loading ? <LoadingScreen /> : <Redirect />;  // ❌ Creates snapshot
}

// AFTER
export default function ShareCharacterDeeplink() {
  return <Redirect href={`/character/preview/${id}`} />;  // ✅ No snapshot
}
```

**Files Created/Modified**:
- Created: `app/share/_layout.tsx`
- Modified: `app/share/character/[id].tsx`

**Result**: Snapshot crashes resolved, but app still crashed!

---

### Crash #4: THE ACTUAL LinearGradient Crash

**Symptoms**:
```
Thread 0 (Main):
5   CoreGraphics    CGContextDrawLinearGradient + 236
6   Mrchenzauber    LinearGradientLayer.draw(in:) + 932
7   Mrchenzauber    LinearGradientLayer.display() + 420
```

**Diagnosis**: ✅ CORRECT (Finally!)
LinearGradient components using `width: '100%'` had **undefined dimensions** during navigation before parent layout was fully calculated.

**Root Cause**:
```typescript
// During navigation, this sequence happens:
1. Component mounts
2. LinearGradient tries to render
3. Parent layout hasn't resolved yet
4. width: '100%' = undefined/0/NaN
5. CoreGraphics crashes trying to render gradient with invalid dimensions
```

**Why This Happens During Deeplinks**:
- Deeplink navigation bypasses normal React Native navigation lifecycle
- Components mount before layout calculations complete
- Normal navigation has timing that masks this issue

**Solution Pattern**:
```typescript
// ❌ BEFORE - Crash during navigation
const styles = StyleSheet.create({
  gradientStyle: {
    width: '100%',  // Can be undefined during layout
    justifyContent: 'center',
  }
});

// ✅ AFTER - Safe during navigation
const styles = StyleSheet.create({
  gradientStyle: {
    alignSelf: 'stretch',  // More reliable than width: '100%'
    minWidth: 200,  // Ensures CoreGraphics has valid dimensions
    justifyContent: 'center',
  }
});
```

**Files Fixed** (3 components):

1. **app/login.tsx:1141** - `manaInfoBanner`
   ```typescript
   manaInfoBanner: {
     alignSelf: 'stretch',  // Changed from width: '100%'
     minWidth: 200,
     minHeight: 100,
   }
   ```
   Also removed `locations={[0, 0.7, 1]}` prop for simpler gradient distribution.

2. **components/story/EndScreen.tsx:280** - `buttonGradient`
   ```typescript
   buttonGradient: {
     alignSelf: 'stretch',  // Changed from width: '100%'
     minWidth: 200,
   }
   ```

3. **components/molecules/PremiumCuddlyToyCard.tsx:119** - `gradientBackground`
   ```typescript
   gradientBackground: {
     alignSelf: 'stretch',  // Changed from width: '100%'
     minWidth: 200,
   }
   ```

**Result**: CoreGraphics crashes resolved!

---

### Crash #5: MagicalLoadingScreen Missing Prop

**Symptoms**:
```
ERROR  [TypeError: Cannot convert undefined value to object]
Code: MagicalLoadingScreen.tsx:173
{phrases[currentPhrase]}
```

**Diagnosis**: ✅ CORRECT
Simple prop missing - `MagicalLoadingScreen` requires `context` prop to determine which phrases to show.

**Root Cause**:
```typescript
// app/character/preview/[characterId].tsx:315
return <MagicalLoadingScreen />;  // ❌ Missing context prop

// This caused:
const phrases = magicalPhrases[undefined];  // undefined
phrases[currentPhrase]  // ❌ Cannot convert undefined to object
```

**Solution**:
```typescript
return <MagicalLoadingScreen context="character" />;  // ✅ Fixed
```

**Files Modified**:
- `app/character/preview/[characterId].tsx:315`

**Result**: All crashes resolved! ✅

---

### Crash #6: TimeOfDayBackground LinearGradient (Universal Links)

**Date**: 2025-11-04
**Context**: Universal links implementation for character sharing

**Symptoms**:
```
Thread 0 (Main):
9   Mrchenzauber     LinearGradientLayer.display() + 64  ← CRASH
3   CoreGraphics     ripc_DrawShading + 6864
```

**Diagnosis**: ✅ CORRECT
Another LinearGradient component with `width: '100%'` and `height: '100%'` causing the same crash pattern as Crash #4, but this time in a different component during app startup.

**Root Cause**:
```typescript
// components/atoms/TimeOfDayBackground.tsx:66-74
gradient: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: '100%',  // ❌ Caused crash during navigation
  height: '100%', // ❌ Caused crash during navigation
}
```

**Why This Crashed**:
When a component has `position: 'absolute'` with all four edges defined (`top`, `left`, `right`, `bottom`), the `width` and `height` properties are redundant. During rapid navigation or startup, these percentage-based dimensions can be undefined/0/NaN before parent layout is calculated, causing CoreGraphics to crash.

**Solution**:
```typescript
// components/atoms/TimeOfDayBackground.tsx:66-74
gradient: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  // Removed width/height - absolute positioning with all edges defined
  // is more reliable and prevents CoreGraphics crashes during navigation
}
```

**Files Modified**:
- `components/atoms/TimeOfDayBackground.tsx:66-74`

**Result**: App startup crashes resolved! ✅

**Learning**: When absolutely positioning an element with all edges defined, NEVER add `width` or `height` properties. The layout system automatically calculates dimensions from the edge constraints.

---

### Issue #7: Expo Router Duplicate Screen Names

**Date**: 2025-11-04
**Context**: Universal links route configuration

**Symptoms**:
```
ERROR: A navigator cannot contain multiple 'Screen' components
with the same name (found duplicate screen named 'character/[id]')
```

**Diagnosis**: ✅ CORRECT
Expo-router was finding duplicate route definitions due to having both a file and a directory with the same dynamic segment name.

**Root Cause**:
```
app/
├── character/
│   ├── [id].tsx              ← Screen: character/[id]
│   └── [id]/                 ← CONFLICT! Also creates character/[id]
│       └── [shareCode].tsx
```

And similarly:
```
app/share/character/
├── [id].tsx                  ← Screen: share/character/[id]
└── [id]/                     ← CONFLICT! Also creates share/character/[id]
    └── [shareCode].tsx
```

**Why This Happens**:
Expo-router generates screen names from file paths. When you have both:
- A file: `character/[id].tsx`
- A directory: `character/[id]/`

Both register as the same screen name `character/[id]`, causing a conflict.

**Solution**:
Remove the unnecessary file routes and keep only the nested routes:
```
app/
├── character/
│   └── [id].tsx              ← Character detail screen (kept)
└── share/character/
    └── [id]/                 ← Directory for deep link routes
        ├── _layout.tsx       ← Crash prevention layout
        └── [shareCode].tsx   ← Deep link handler (kept)
```

**Files Removed**:
- ✅ Deleted: `app/character/[id]/[shareCode].tsx` (duplicate)
- ✅ Deleted: `app/share/character/[id].tsx` (unnecessary)

**Important**: After removing route files, you MUST clear Metro cache:
```bash
rm -rf .expo node_modules/.cache
watchman watch-del-all
npx expo start --clear
```

**Result**: Route conflicts resolved! ✅

**Learning**:
1. Never have both a file and directory with the same dynamic segment name
2. Metro aggressively caches route configuration - always clear cache after route changes
3. Use `watchman watch-del-all` to clear file system watch caches

---

## Summary of Solutions

| Issue | Root Cause | Solution | Files |
|-------|------------|----------|-------|
| Image crashes | Transition animation conflicts with navigation | Disable transitions, add recycling keys | `character/preview/[characterId].tsx` |
| Snapshot crashes | Share route missing Stack config | Created `share/_layout.tsx` with snapshot prevention | `share/_layout.tsx` (new) |
| Navigation crashes | Loading screen triggers snapshot creation | Use immediate `<Redirect>` instead | `share/character/[id].tsx` |
| LinearGradient crashes | `width: '100%'` undefined during layout | Use `alignSelf: 'stretch'` + `minWidth` | `login.tsx`, `EndScreen.tsx`, `PremiumCuddlyToyCard.tsx` |
| Loading screen crash | Missing required prop | Add `context="character"` prop | `character/preview/[characterId].tsx` |
| TimeOfDayBackground crash | `width/height: '100%'` on absolute positioned gradient | Remove width/height, use edge constraints only | `TimeOfDayBackground.tsx` |
| Route naming conflict | Duplicate screen names in expo-router | Remove conflicting file routes, clear Metro cache | Route structure cleanup |

---

## Key Technical Learnings

### 1. React Native Navigation Lifecycle
- Deeplinks bypass normal navigation timing
- Components can mount before layout calculations complete
- Always ensure components handle undefined dimensions gracefully

### 2. expo-router File-Based Routing
- Each directory can have its own `_layout.tsx`
- Child layouts don't automatically inherit parent Stack settings
- Use `freezeOnBlur: false` to prevent snapshot crashes

### 3. react-native-screens Snapshots
- iOS creates snapshots during screen transitions for animations
- Snapshots can fail when:
  - Views have complex gradients/blurs during rapid navigation
  - Layout isn't fully resolved
  - Images are loading/unloading
- Solutions:
  - `freezeOnBlur: false` - Disable freezing
  - `animation: 'none'` - Disable animations
  - `presentation: 'transparentModal'` - Bypass native screens
  - Use `<Redirect>` to avoid rendering intermediate screens

### 4. expo-linear-gradient Rendering
- `width: '100%'` can be undefined during navigation
- `alignSelf: 'stretch'` is more reliable
- Always provide minimum dimensions for CoreGraphics:
  ```typescript
  minWidth: 200,  // Ensures valid render bounds
  minHeight: 100
  ```
- Avoid `locations` prop unless necessary - simpler is safer

### 5. expo-image Best Practices for Navigation
```typescript
<Image
  source={{ uri }}
  transition={0}  // Disable for rapid navigation
  recyclingKey={uniqueId}  // Help expo-image reuse instances
  cachePolicy="memory-disk"  // Proper caching
/>
```

### 6. Debugging Complex Issues
- One symptom can have multiple root causes
- Fix each issue, test, document what changed
- Don't assume first diagnosis is correct
- Stack traces show **where** it crashes, not always **why**

---

## Testing Checklist

After implementing fixes, test:

- [ ] Cold start deeplink (app not running)
- [ ] Warm start deeplink (app in background)
- [ ] Multiple deeplinks in succession
- [ ] Slow network conditions
- [ ] Physical iOS device (not just simulator)
- [ ] Different iOS versions if possible

---

## Prevention for Future Development

### Code Review Guidelines

1. **Never use `width: '100%'` with LinearGradient**
   ```typescript
   // ❌ AVOID
   <LinearGradient style={{ width: '100%' }} />

   // ✅ USE
   <LinearGradient style={{ alignSelf: 'stretch', minWidth: 200 }} />
   ```

2. **Never use width/height on absolute positioned elements with all edges defined**
   ```typescript
   // ❌ AVOID
   style={{
     position: 'absolute',
     top: 0,
     left: 0,
     right: 0,
     bottom: 0,
     width: '100%',  // Redundant and can cause crashes
     height: '100%', // Redundant and can cause crashes
   }}

   // ✅ USE
   style={{
     position: 'absolute',
     top: 0,
     left: 0,
     right: 0,
     bottom: 0,
     // Width/height automatically calculated from edges
   }}
   ```

3. **Always provide context prop to MagicalLoadingScreen**
   ```typescript
   // ❌ AVOID
   <MagicalLoadingScreen />

   // ✅ USE
   <MagicalLoadingScreen context="character" />
   ```

4. **Disable image transitions for navigation screens**
   ```typescript
   // ❌ RISKY
   <Image transition={300} />

   // ✅ SAFE
   <Image transition={0} recyclingKey={id} />
   ```

5. **Configure Stack settings in every _layout.tsx**
   ```typescript
   export default function Layout() {
     return (
       <Stack
         screenOptions={{
           freezeOnBlur: false,  // Prevent snapshots
           animation: Platform.OS === 'ios' ? 'default' : 'slide_from_right',
         }}
       />
     );
   }
   ```

6. **Avoid expo-router file/directory naming conflicts**
   ```typescript
   // ❌ AVOID - Creates duplicate screens
   app/
   ├── character/
   │   ├── [id].tsx        ← Screen: character/[id]
   │   └── [id]/           ← CONFLICT: Also character/[id]
   │       └── detail.tsx

   // ✅ USE - Clear separation
   app/
   ├── character/
   │   └── [id].tsx        ← Screen: character/[id]
   └── character-detail/
       └── [id]/           ← Screen: character-detail/[id]
           └── detail.tsx
   ```

7. **Always clear Metro cache after route changes**
   ```bash
   # After adding/removing route files:
   rm -rf .expo node_modules/.cache
   watchman watch-del-all
   npx expo start --clear
   ```

### Automated Testing

Add E2E test for deeplink navigation:
```typescript
describe('Deeplink Navigation', () => {
  it('should open character preview without crashing', async () => {
    await device.launchApp({
      url: 'maerchenzauber://share/character/test-id'
    });
    await expect(element(by.id('character-preview'))).toBeVisible();
  });
});
```

---

## Related Files

### Modified Files
- `app/_layout.tsx` - Navigation timeout increased
- `app/login.tsx` - LinearGradient dimensions fixed
- `app/character/preview/[characterId].tsx` - Image transitions disabled, MagicalLoadingScreen prop added
- `components/story/EndScreen.tsx` - LinearGradient dimensions fixed
- `components/molecules/PremiumCuddlyToyCard.tsx` - LinearGradient dimensions fixed
- `package.json` - Updated expo-linear-gradient to 15.0.7

### Created Files
- `app/share/_layout.tsx` - Stack configuration for share routes
- `docs/DEEPLINK_CRASH_FIX.md` - This document

---

## References

- [expo-router Documentation](https://docs.expo.dev/router/introduction/)
- [react-native-screens Stack Options](https://reactnavigation.org/docs/stack-navigator/)
- [expo-linear-gradient Documentation](https://docs.expo.dev/versions/latest/sdk/linear-gradient/)
- [expo-image Transitions](https://docs.expo.dev/versions/latest/sdk/image/)

---

## Conclusion

What seemed like a single crash was actually **7 distinct issues** across two debugging sessions:

**Session 1 (2025-11-02):**
1. Image transition race conditions
2. Missing Stack layout configuration
3. Snapshot creation during intermediate screens
4. LinearGradient rendering with undefined dimensions
5. Missing required component prop

**Session 2 (2025-11-04 - Universal Links):**
6. TimeOfDayBackground LinearGradient crash (same pattern as #4)
7. Expo-router duplicate screen names

The key to solving this was:
- **Methodical testing** after each fix
- **Documenting each crash** with stack traces
- **Not assuming** the first diagnosis was correct
- **Understanding** the React Native/iOS rendering pipeline
- **Aggressive cache clearing** when changing routes

**Total time**: ~6 hours of debugging (across 2 sessions)
**Total issues fixed**: 7
**Final result**: ✅ Stable deeplink navigation on iOS + Universal links working
