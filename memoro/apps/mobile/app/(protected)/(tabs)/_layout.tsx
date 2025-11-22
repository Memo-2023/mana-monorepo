import React, { useState, useMemo, memo } from 'react';
import { Link, Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '~/features/theme/ThemeProvider';
import { HeaderButton } from '~/components/HeaderButton';
import { TabBarIcon } from '~/components/TabBarIcon';
import colors from '~/tailwind.config.js';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '~/components/atoms/Text';

// Styles außerhalb der Komponente - werden nur einmal erstellt
const staticStyles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    borderTopWidth: 0,
    borderWidth: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginHorizontal: 0,
    borderRadius: 0,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 16,
    marginLeft: 8,
    marginTop: 2,
    fontFamily: 'System',
  },
});

// CustomTabBar außerhalb als separate Komponente
const CustomTabBar = memo(({
  state,
  descriptors,
  navigation,
  menuBackgroundColor,
  activeTabBackgroundColor,
  hoverTabBackgroundColor,
  isDark
}: any) => {
  const insets = useSafeAreaInsets();
  const [hoveredTab, setHoveredTab] = useState<number | null>(null);

  return (
    <View style={[
      staticStyles.tabBarContainer,
      {
        backgroundColor: menuBackgroundColor,
        paddingBottom: insets.bottom,
        borderTopWidth: 0,
        borderBottomWidth: 0,
        elevation: 0,
        shadowOpacity: 0,
        marginTop: -1,
      }
    ]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.title || route.name;
        const isFocused = state.index === index;
        const isHovered = hoveredTab === index;

        // Icon für den Tab
        const iconColor = isDark ? '#FFFFFF' : '#000000';
        const icon = options.tabBarIcon ?
          <View style={{ opacity: isFocused ? 1.0 : 0.6 }}>
            {options.tabBarIcon({
              color: iconColor,
              focused: isFocused,
              size: 20
            })}
          </View> : null;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Hover-Props für Web
        const hoverProps = Platform.OS === 'web'
          ? {
            onMouseEnter: () => setHoveredTab(index),
            onMouseLeave: () => setHoveredTab(null),
          }
          : {};

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={[
              staticStyles.tabItem,
              {
                backgroundColor: isFocused ? activeTabBackgroundColor : (isHovered ? hoverTabBackgroundColor : 'transparent'),
              }
            ]}
            {...hoverProps}
          >
            <View style={staticStyles.tabContent}>
              {icon}
              <Text
                style={[
                  staticStyles.tabLabel,
                  {
                    color: isDark ? '#FFFFFF' : '#000000',
                    opacity: isFocused ? 1.0 : 0.6,
                    fontWeight: '500'
                  }
                ]}
              >
                {label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
});

CustomTabBar.displayName = 'CustomTabBar';

export default function TabLayout() {
  const { isDark, themeVariant } = useTheme();
  const { t } = useTranslation();

  // Memoize theme colors to prevent recalculation on every render
  const themeColors = useMemo(() => {
    const menuBackgroundColor = isDark
      ? (colors.theme?.extend?.colors?.dark as any)?.[themeVariant]?.menuBackground
      : (colors.theme?.extend?.colors as any)?.[themeVariant]?.menuBackground;

    const activeTabBackgroundColor = isDark
      ? (colors.theme?.extend?.colors?.dark as any)?.[themeVariant]?.contentBackgroundHover
      : (colors.theme?.extend?.colors as any)?.[themeVariant]?.contentBackgroundHover;

    const hoverTabBackgroundColor = activeTabBackgroundColor + '99';

    return {
      menuBackgroundColor,
      activeTabBackgroundColor,
      hoverTabBackgroundColor,
    };
  }, [isDark, themeVariant]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        animation: 'none',
        tabBarStyle: {
          backgroundColor: themeColors.menuBackgroundColor,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        sceneContainerStyle: {
          backgroundColor: themeColors.menuBackgroundColor,
          flex: 1
        },
        contentStyle: { backgroundColor: themeColors.menuBackgroundColor }
      }}
      tabBar={props => (
        <CustomTabBar
          {...props}
          menuBackgroundColor={themeColors.menuBackgroundColor}
          activeTabBackgroundColor={themeColors.activeTabBackgroundColor}
          hoverTabBackgroundColor={themeColors.hoverTabBackgroundColor}
          isDark={isDark}
        />
      )}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.record', 'Record'),
          tabBarIcon: ({ color, focused, size }) => <TabBarIcon name="mic-outline" color={color} focused={focused} size={size} />,
          headerRight: () => (
            <Link href="/(protected)/settings" asChild>
              <HeaderButton />
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="memos"
        options={{
          title: t('tabs.memos', 'Memos'),
          tabBarIcon: ({ color, focused, size }) => <TabBarIcon name="archive-outline" color={color} focused={focused} size={size} />,
        }}
      />
    </Tabs>
  );
}
