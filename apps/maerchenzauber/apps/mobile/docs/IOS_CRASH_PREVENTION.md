# iOS Crash Prevention - Quick Reference

**Last Updated**: 2025-11-02

This is a quick reference for common iOS crash patterns and how to prevent them. For the complete debugging journey, see [DEEPLINK_CRASH_FIX.md](./DEEPLINK_CRASH_FIX.md).

---

## 1. LinearGradient Crashes

### ❌ DON'T DO THIS:
```typescript
import { LinearGradient } from 'expo-linear-gradient';

const styles = StyleSheet.create({
  gradient: {
    width: '100%',  // Can be undefined during navigation!
    height: 100,
  }
});

<LinearGradient
  colors={['#000', '#fff']}
  style={styles.gradient}
/>
```

**Why it crashes**: During navigation (especially deeplinks), `width: '100%'` can be undefined before parent layout resolves. CoreGraphics crashes trying to render with invalid dimensions.

### ✅ DO THIS INSTEAD:
```typescript
const styles = StyleSheet.create({
  gradient: {
    alignSelf: 'stretch',  // More reliable than width: '100%'
    minWidth: 200,  // Ensure valid dimensions for CoreGraphics
    height: 100,
  }
});

<LinearGradient
  colors={['#000', '#fff']}
  style={styles.gradient}
/>
```

**Crash signature**: `CoreGraphics CGContextDrawLinearGradient + 236`

---

## 2. Image Loading During Navigation

### ❌ DON'T DO THIS:
```typescript
import { Image } from 'expo-image';

<Image
  source={{ uri: imageUrl }}
  transition={300}  // Conflicts with navigation animations!
/>
```

**Why it crashes**: Image transitions can conflict with navigation transitions, causing CoreGraphics to deallocate images while still rendering.

### ✅ DO THIS INSTEAD:
```typescript
<Image
  source={{ uri: imageUrl }}
  transition={0}  // Disable for navigation screens
  recyclingKey={uniqueId}  // Help expo-image reuse instances
  cachePolicy="memory-disk"  // Proper caching
/>
```

**Crash signature**: `CoreGraphics image_finalize`, `CA::Layer::~Layer()`

---

## 3. Navigation Snapshots

### ❌ DON'T DO THIS:
```typescript
// Missing _layout.tsx in directory
app/
└── myfeature/
    └── screen.tsx  // No layout config!
```

**Why it crashes**: react-native-screens creates snapshots for transitions. Without proper config, snapshots fail on complex views (gradients, blurs, images).

### ✅ DO THIS INSTEAD:
```typescript
// app/myfeature/_layout.tsx
import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function MyFeatureLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        freezeOnBlur: false,  // Prevent snapshot crashes
        animation: Platform.OS === 'ios' ? 'default' : 'slide_from_right',
      }}
    />
  );
}
```

**Crash signature**: `RNSScreen setViewToSnapshot`, `snapshotViewAfterScreenUpdates`

---

## 4. Loading Screens During Navigation

### ❌ DON'T DO THIS:
```typescript
export default function DeeplinkHandler() {
  const [loading, setLoading] = useState(true);

  return loading ? (
    <LoadingScreen />  // Creates snapshot, then redirects = crash
  ) : (
    <Redirect href="/target" />
  );
}
```

**Why it crashes**: Mounting a loading screen that immediately redirects causes snapshot creation mid-navigation.

### ✅ DO THIS INSTEAD:
```typescript
export default function DeeplinkHandler() {
  return <Redirect href="/target" />;  // Direct redirect, no snapshot
}
```

---

## 5. Component Props

### ❌ DON'T DO THIS:
```typescript
<MagicalLoadingScreen />  // Missing required prop!
```

**Why it crashes**: Component tries to access array with undefined key.

### ✅ DO THIS INSTEAD:
```typescript
<MagicalLoadingScreen context="character" />  // Proper context
```

---

## Code Review Checklist

Before merging iOS-related code, verify:

- [ ] No `LinearGradient` uses `width: '100%'` or `height: '100%'`
- [ ] All `LinearGradient` styles have `minWidth` and/or `minHeight`
- [ ] Navigation screens have `transition={0}` on `expo-image` components
- [ ] All route directories have `_layout.tsx` with `freezeOnBlur: false`
- [ ] No loading screens immediately before `<Redirect>`
- [ ] All custom components have required props documented

---

## Testing Requirements

Before deploying iOS changes:

1. **Test on physical device** (not just simulator)
2. **Test deeplinks**: Cold start (app closed) and warm start (background)
3. **Test navigation**: Between multiple screens rapidly
4. **Test with slow network**: Enable network conditioning
5. **Check crash logs**: Use Xcode Organizer or TestFlight feedback

---

## Quick Diagnostics

### App crashes during navigation?
1. Check for `LinearGradient` with `width: '100%'`
2. Check for `expo-image` with `transition > 0`
3. Check crash log for "CGContext" or "RNSScreen"

### App crashes on deeplink?
1. Verify route has `_layout.tsx`
2. Check for intermediate loading screens
3. Test with direct `<Redirect>`

### App crashes showing loading screen?
1. Check component has all required props
2. Verify arrays/objects aren't undefined
3. Add null checks before array access

---

## Common Error Messages

| Error Message | Likely Cause | Solution |
|--------------|--------------|----------|
| `CGContextDrawLinearGradient` | LinearGradient invalid dimensions | Use `alignSelf: 'stretch'` + `minWidth` |
| `RNSScreen setViewToSnapshot` | Missing Stack config or complex view | Add `_layout.tsx` with `freezeOnBlur: false` |
| `image_finalize` | Image deallocated during render | Disable transitions, add recycling key |
| `Cannot convert undefined to object` | Missing prop or undefined array | Add required props, null checks |

---

## Resources

- [Complete debugging guide](./DEEPLINK_CRASH_FIX.md)
- [expo-router docs](https://docs.expo.dev/router/introduction/)
- [expo-image transitions](https://docs.expo.dev/versions/latest/sdk/image/)
- [react-native-screens](https://github.com/software-mansion/react-native-screens)

---

## Need Help?

If you encounter a crash not covered here:

1. **Get the full crash log** from Xcode Organizer or TestFlight
2. **Identify the crash signature** (function names in stack trace)
3. **Document reproduction steps** (exact user actions)
4. **Check recent changes** to navigation or layout code
5. **Add to this document** once resolved!
