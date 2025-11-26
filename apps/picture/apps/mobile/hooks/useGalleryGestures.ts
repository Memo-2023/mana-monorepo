import { useRef } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ViewMode } from '~/types/gallery';
import { PINCH_DEBOUNCE_MS, PINCH_OUT_SCALE, PINCH_IN_SCALE } from '~/constants/gallery';

type UseGalleryGesturesProps = {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
};

export function useGalleryGestures({ viewMode, onViewModeChange }: UseGalleryGesturesProps) {
  const lastGestureTime = useRef(0);

  // Handler for view mode changes with haptic feedback
  const handleViewModeChange = (newMode: ViewMode) => {
    onViewModeChange(newMode);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
      // Silently fail if haptics not available
    });
  };

  // Pinch gesture for view mode switching (iOS Photos-like)
  const pinchGesture = Gesture.Pinch()
    .onEnd((event) => {
      'worklet';
      const now = Date.now();
      // Debounce: Prevent rapid switches
      if (now - lastGestureTime.current < PINCH_DEBOUNCE_MS) return;

      lastGestureTime.current = now;

      // Pinch-Out (scale > threshold): Zoom in = fewer columns (larger images)
      if (event.scale > PINCH_OUT_SCALE) {
        if (viewMode === 'grid5') {
          runOnJS(handleViewModeChange)('grid3');
        } else if (viewMode === 'grid3') {
          runOnJS(handleViewModeChange)('single');
        }
      }
      // Pinch-In (scale < threshold): Zoom out = more columns (smaller images)
      else if (event.scale < PINCH_IN_SCALE) {
        if (viewMode === 'single') {
          runOnJS(handleViewModeChange)('grid3');
        } else if (viewMode === 'grid3') {
          runOnJS(handleViewModeChange)('grid5');
        }
      }
    });

  return {
    pinchGesture,
    handleViewModeChange,
  };
}
