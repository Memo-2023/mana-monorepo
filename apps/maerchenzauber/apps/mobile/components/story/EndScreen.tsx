import React from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Text from '../atoms/Text';
import Button from '../atoms/Button';
import { getTimeOfDay } from '../../src/utils/timeOfDay';
import { getTimeOfDayTheme } from '../../src/constants/timeOfDayThemes';

interface EndScreenProps {
  onEnd: () => void;
  onRestart: () => void;
  onArchive: () => void;
  mockTimeOfDay?: 'morning' | 'day' | 'evening' | 'night'; // For testing different times
}

export default function EndScreen({
  onEnd,
  onRestart,
  onArchive,
  mockTimeOfDay,
}: EndScreenProps) {
  // Get current time of day and theme
  const timeOfDay = mockTimeOfDay || getTimeOfDay();
  const theme = getTimeOfDayTheme(timeOfDay);

  // Responsive font sizes
  const { width: windowWidth } = useWindowDimensions();
  const isTablet = windowWidth >= 768;
  const titleFontSize = isTablet ? 60 : 42;
  const subtitleFontSize = isTablet ? 20 : 16;

  return (
    <View style={styles.container}>
      {/* Title with dynamic message */}
      <View style={styles.titleContainer}>
        <Text
          variant="header"
          color={theme.textColor}
          style={[styles.title, { fontSize: titleFontSize }]}
        >
          {theme.title}
        </Text>
        {theme.subtitle && (
          <Text
            variant="subheader"
            color={theme.textColor}
            style={[styles.subtitle, { fontSize: subtitleFontSize }]}
          >
            {theme.subtitle}
          </Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <View style={styles.glassButtonWrapper}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint="dark" style={styles.glassButton}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.15)']}
                style={styles.buttonGradient}
              >
                <Button
                  title="Ende"
                  onPress={onEnd}
                  color="transparent"
                  variant="primary"
                  size="lg"
                  style={styles.button}
                  iconName="house"
                  iconSet="sf-symbols"
                  iconPosition="left"
                />
              </LinearGradient>
            </BlurView>
          ) : (
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.15)']}
              style={styles.glassButtonAndroid}
            >
              <Button
                title="Ende"
                onPress={onEnd}
                color="transparent"
                variant="primary"
                size="lg"
                style={styles.button}
                iconName="house"
                iconSet="sf-symbols"
                iconPosition="left"
              />
            </LinearGradient>
          )}
        </View>

        <View style={styles.glassButtonWrapper}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint="dark" style={styles.glassButton}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.18)', 'rgba(255, 255, 255, 0.08)']}
                style={styles.buttonGradient}
              >
                <Button
                  title="Nochmal"
                  onPress={onRestart}
                  color="transparent"
                  variant="primary"
                  size="lg"
                  style={styles.button}
                  iconName="arrow.clockwise"
                  iconSet="sf-symbols"
                  iconPosition="left"
                />
              </LinearGradient>
            </BlurView>
          ) : (
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.18)', 'rgba(255, 255, 255, 0.08)']}
              style={styles.glassButtonAndroid}
            >
              <Button
                title="Nochmal"
                onPress={onRestart}
                color="transparent"
                variant="primary"
                size="lg"
                style={styles.button}
                iconName="arrow.clockwise"
                iconSet="sf-symbols"
                iconPosition="left"
              />
            </LinearGradient>
          )}
        </View>

        <View style={styles.glassButtonWrapper}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint="dark" style={styles.glassButton}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.04)']}
                style={styles.buttonGradient}
              >
                <Button
                  title="Archivieren"
                  onPress={onArchive}
                  color="transparent"
                  variant="primary"
                  size="lg"
                  style={styles.button}
                  iconName="archivebox"
                  iconSet="sf-symbols"
                  iconPosition="left"
                />
              </LinearGradient>
            </BlurView>
          ) : (
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.04)']}
              style={styles.glassButtonAndroid}
            >
              <Button
                title="Archivieren"
                onPress={onArchive}
                color="transparent"
                variant="primary"
                size="lg"
                style={styles.button}
                iconName="archivebox"
                iconSet="sf-symbols"
                iconPosition="left"
              />
            </LinearGradient>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 1,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
    fontFamily: 'Grandstander_700Bold',
    marginBottom: 16,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.95,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  actionsContainer: {
    width: '100%',
    paddingHorizontal: 24,
    marginBottom: 40,
    zIndex: 1,
  },
  glassButtonWrapper: {
    width: '100%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  glassButton: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    backgroundColor: 'transparent',
  },
  glassButtonAndroid: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  buttonGradient: {
    // Use alignSelf: 'stretch' instead of width: '100%' to prevent CoreGraphics crashes
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 200, // Ensure CoreGraphics has valid dimensions
  },
  button: {
    width: '100%',
    backgroundColor: 'transparent',
  },
});
