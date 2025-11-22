import React from 'react';
import { BlurView } from 'expo-blur';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Text from '../atoms/Text';
import Icon from '../atoms/Icon';
import { useDebugBorders } from '../../hooks/useDebugBorders';
import ManaCounter from './ManaCounter';
import HeaderMenu from './HeaderMenu';



interface CommonHeaderProps {
  title: string;
  showBackButton?: boolean;
  showSettingsButton?: boolean;
  showManaButton?: boolean;
  onBack?: () => void;
  onSettingsPress?: () => void;
  onManaPress?: () => void;
  rightComponent?: React.ReactNode;
  level?: number;
  showAppIcon?: boolean;
  showLogo?: boolean;
}

export default function CommonHeader({
  title,
  showBackButton = true,
  showSettingsButton = false,
  showManaButton = false,
  onBack,
  onSettingsPress,
  onManaPress,
  rightComponent,
  level,
  showAppIcon = false,
  showLogo = false
}: CommonHeaderProps) {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const isWideScreen = windowWidth > 1000;
  const isTablet = windowWidth >= 768;

  // Responsive font size for title
  const titleFontSize = isTablet ? 26 : 18;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleSettings = () => {
    if (onSettingsPress) {
      onSettingsPress();
    } else {
      router.push('/settings');
    }
  };

  const handleMana = () => {
    if (onManaPress) {
      onManaPress();
    } else {
      router.push('/subscription');
    }
  };

  // Verschiedene Debug-Borders für unterschiedliche Bereiche
  const containerDebug = useDebugBorders('#00FF00', { borderStyle: 'dashed' });
  const leftSectionDebug = useDebugBorders('#FF0000', { borderStyle: 'dashed' });
  const titleDebug = useDebugBorders('#0000FF', { borderStyle: 'dashed' });
  const blurDebug = useDebugBorders('#FF00FF', { borderStyle: 'dashed' });
  const rightSectionDebug = useDebugBorders('#FF00FF');
  const buttonDebug = useDebugBorders('#FFA500');

  const headerContent = (
    <>
      <View style={[styles.leftSection, leftSectionDebug]}>
        {showBackButton && (
          <TouchableOpacity
            onPress={handleBack}
            style={[styles.iconButton, buttonDebug]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon set="ionicons" name="chevron-back" size={24} color="#ffffff" />
          </TouchableOpacity>
        )}
        {showManaButton && (
          <ManaCounter onPress={handleMana} size="small" />
        )}
        {showLogo && (
          <View style={styles.logoContainer}>
            <ManaCounter onPress={handleMana} size="small" />
          </View>
        )}
      </View>
      <View style={[styles.centerSection, titleDebug]}>
        <View style={styles.titleContainer}>
          <Text
            style={[
              styles.title,
              { fontSize: titleFontSize },
              !showBackButton && styles.titleWithoutBack,
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
            {...(Platform.OS === 'android' ? { includeFontPadding: false } : {})}
          >
            {title}
          </Text>
        </View>
      </View>
      <View style={[styles.rightSection, rightSectionDebug]}>
        {rightComponent}
        {showSettingsButton && (
          <HeaderMenu
            onSettingsPress={handleSettings}
            onArchivePress={() => router.push('/archive')}
            onHelpPress={() => router.push('/help')}
            onManaPress={handleMana}
            onFeedbackPress={() => router.push('/feedback')}
          />
        )}
      </View>
    </>
  );

  return (
    <View style={[styles.headerWrapper, containerDebug]}>
      {isWeb && isWideScreen ? (
        <View style={[styles.container, styles.webContainer, containerDebug]}>
          {headerContent}
        </View>
      ) : Platform.OS === 'android' ? (
        <View
          style={[
            styles.blurContainer,
            styles.androidHeader,
            { paddingTop: insets.top + 4 },
            blurDebug
          ]}
        >
          <View style={[styles.container, containerDebug]}>
            {headerContent}
          </View>
        </View>
      ) : (
        <BlurView
          intensity={250}
          tint="dark"
          style={[
            styles.blurContainer,
            { paddingTop: insets.top + 8 },
            blurDebug
          ]}
        >
          <View style={[styles.container, containerDebug]}>
            {headerContent}
          </View>
        </BlurView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  debug: {
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    ...(Platform.OS === 'web' ? {
      paddingTop: 0,
      paddingHorizontal: 16,
    } : {}),
  },
  blurContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    // paddingTop wird jetzt dynamisch über useSafeAreaInsets gesetzt
  },
  androidHeader: {
    backgroundColor: 'rgba(24, 24, 24, 0.95)',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    marginTop: Platform.OS === 'web' ? 0 : Platform.OS === 'android' ? 4 : 8,
    alignSelf: 'center',
    height: 48,
    width: '100%',
    maxWidth: 900,
    paddingHorizontal: 0,
  },
  webContainer: {
    marginTop: 0,
    paddingTop: 8,
    maxWidth: 1400,
    width: '100%',
  },
  leftSection: {
    flex: 0.8,
    minWidth: 40,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row',
    gap: 8,
  },
  centerSection: {
    flex: 2,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  rightSection: {
    flex: 0.8,
    minWidth: 40,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexDirection: 'row',
    gap: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...(Platform.OS === 'android'
      ? { fontFamily: 'Grandstander_700Bold', paddingTop: 0, lineHeight: 26 }
      : { fontFamily: 'Grandstander_700Bold', fontWeight: '700' as const, paddingTop: 5 }
    ),
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.00)',
  },
  titleWithoutBack: {
  },
  logoContainer: {
    marginRight: 0,
  },
});
