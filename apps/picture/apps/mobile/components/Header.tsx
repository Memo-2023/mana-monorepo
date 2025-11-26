import { View, Pressable, Platform, Modal, ViewStyle, TextStyle } from 'react-native';
import { useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '~/contexts/AuthContext';
import { useTheme } from '~/contexts/ThemeContext';
import { Icon } from './Icon';
import { Text } from './Text';

// Only import ContextMenu on native platforms
let ContextMenu: any = null;
if (Platform.OS !== 'web') {
  ContextMenu = require('react-native-context-menu-view').default;
}

type HeaderProps = {
  title?: string;
  showBackButton?: boolean;
  rightContent?: React.ReactNode;
};

export function Header({ title, showBackButton = false, rightContent }: HeaderProps) {
  const router = useRouter();
  const segments = useSegments();
  const { user, signOut } = useAuth();
  const { theme } = useTheme();
  const [webMenuVisible, setWebMenuVisible] = useState(false);
  
  // Determine current route for menu highlighting
  const currentRoute = segments.join('/');
  
  // Define menu items based on auth status
  const menuItems = user ? [
    {
      title: 'Galerie',
      systemIcon: Platform.OS === 'ios' ? 'house' : undefined,
      route: '/(tabs)',
      destructive: false,
    },
    {
      title: 'Generieren',
      systemIcon: Platform.OS === 'ios' ? 'paintbrush' : undefined,
      route: '/(tabs)/generate',
      destructive: false,
    },
    {
      title: 'Entdecken',
      systemIcon: Platform.OS === 'ios' ? 'sparkles' : undefined,
      route: '/(tabs)/explore',
      destructive: false,
    },
    {
      title: 'Tags verwalten',
      systemIcon: Platform.OS === 'ios' ? 'tag' : undefined,
      route: '/tags',
      destructive: false,
    },
    {
      title: 'Profil',
      systemIcon: Platform.OS === 'ios' ? 'person' : undefined,
      route: '/(tabs)/profile',
      destructive: false,
    },
  ] : [
    {
      title: 'Anmelden',
      systemIcon: Platform.OS === 'ios' ? 'lock' : undefined,
      route: '/(auth)/login',
      destructive: false,
    },
    {
      title: 'Registrieren',
      systemIcon: Platform.OS === 'ios' ? 'person.badge.plus' : undefined,
      route: '/(auth)/register',
      destructive: false,
    },
  ];

  const handleMenuPress = (index: number) => {
    const item = menuItems[index];
    if (!item || item.disabled) return;
    
    if (item.route === 'signout') {
      signOut();
    } else if (item.route) {
      router.push(item.route as any);
    }
    
    // Close web menu if open
    if (Platform.OS === 'web') {
      setWebMenuVisible(false);
    }
  };

  // Web menu component - using absolute positioning for better web compatibility
  const WebMenu = () => {
    if (!webMenuVisible) return null;

    const backdropStyle: ViewStyle = {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 999,
      backgroundColor: 'transparent',
    } as any;

    const menuStyle: ViewStyle = {
      position: 'absolute',
      right: 0,
      top: 50,
      zIndex: 1000,
      minWidth: 200,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      ...theme.shadows.md,
    };

    return (
      <>
        {/* Backdrop */}
        <Pressable
          style={backdropStyle}
          onPress={() => {
            console.log('Backdrop clicked - closing menu');
            setWebMenuVisible(false);
          }}
        />
        {/* Menu */}
        <View style={menuStyle}>
          {menuItems.filter(item => !item.disabled).map((item, index) => {
            const actualIndex = menuItems.findIndex(mi => mi === item);

            const menuItemStyle: ViewStyle = {
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderTopWidth: item.destructive ? 1 : 0,
              borderTopColor: theme.colors.border,
            };

            return (
              <Pressable
                key={index}
                onPress={() => {
                  console.log('Menu item clicked:', item.title, item.route);
                  handleMenuPress(actualIndex);
                }}
                style={({ pressed }) => [
                  menuItemStyle,
                  pressed && { opacity: theme.opacity.pressed },
                ]}
              >
                <Text
                  variant="body"
                  color={item.destructive ? 'error' : 'primary'}
                >
                  {item.title}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </>
    );
  };

  const headerContainerStyle: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  };

  return (
    <View style={headerContainerStyle}>
      <View className="flex-row items-center justify-between px-4 py-3">
        {/* Left side - Back button or title */}
        <View className="flex-row items-center flex-1">
          {showBackButton ? (
            <Pressable
              onPress={() => router.back()}
              className="mr-3 p-2 -ml-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={({ pressed }) => [
                pressed && { opacity: theme.opacity.pressed },
              ]}
            >
              <Icon name="chevron-back" size={24} color={theme.colors.primary.default} />
            </Pressable>
          ) : null}

          {/* Title */}
          {title && (
            <Text variant="h4" color="primary">
              {title}
            </Text>
          )}
        </View>

        {/* Right side - Menu and custom content */}
        <View className="flex-row items-center">
          {rightContent && (
            <View className="flex-row items-center mr-2">
              {rightContent}
            </View>
          )}
          {!showBackButton && (
            Platform.OS === 'web' ? (
              <>
                <Pressable
                  className="p-2 -mr-2"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  onPress={() => {
                    console.log('Menu button clicked');
                    setWebMenuVisible(true);
                  }}
                  style={({ pressed }) => [
                    pressed && { opacity: theme.opacity.pressed },
                  ]}
                >
                  <Icon name="menu" size={24} color={theme.colors.primary.default} />
                </Pressable>
                <WebMenu />
              </>
            ) : ContextMenu ? (
              <ContextMenu
                actions={menuItems.map(item => ({
                  title: item.title,
                  systemIcon: item.systemIcon,
                  destructive: item.destructive,
                  disabled: item.disabled,
                }))}
                onPress={(e: any) => {
                  handleMenuPress(e.nativeEvent.index);
                }}
                dropdownMenuMode={true}
              >
                <Pressable
                  className="p-2 -mr-2"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="menu" size={24} color={theme.colors.primary.default} />
                </Pressable>
              </ContextMenu>
            ) : null
          )}
        </View>
      </View>
    </View>
  );
}