import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Pressable, Dimensions } from 'react-native';
import Icon from '~/components/atoms/Icon';
import { useTheme } from '~/features/theme/ThemeProvider';

interface AndroidContextMenuProps {
  actions: Array<{
    title: string;
    iconName?: string;
    iconColor?: string;
    id: string;
  }>;
  onPress: (action: any) => void;
  children: React.ReactNode;
}

/**
 * Custom Android Context Menu with Ionicons support
 * 
 * This component wraps the native ContextMenu on Android to add icon support
 * using Ionicons instead of emojis.
 */
export const AndroidContextMenu: React.FC<AndroidContextMenuProps> = ({
  actions,
  onPress,
  children,
}) => {
  const [visible, setVisible] = React.useState(false);
  const [menuPosition, setMenuPosition] = React.useState({ x: 0, y: 0 });
  const { isDark, tw } = useTheme();
  const childRef = React.useRef<View>(null);

  const showMenu = () => {
    if (childRef.current) {
      childRef.current.measure((x, y, width, height, pageX, pageY) => {
        // Position menu to the left of the button to ensure it's fully visible
        const menuWidth = 280;
        const screenWidth = Dimensions.get('window').width;
        const menuX = Math.max(20, Math.min(pageX - menuWidth + width, screenWidth - menuWidth - 20));
        // Reduce the top offset for Android - use a smaller gap
        const menuY = pageY + height - 8; // Reduced from pageY + height to have less gap
        setMenuPosition({ x: menuX, y: menuY });
        setVisible(true);
      });
    }
  };

  const handleActionPress = (action: any, index: number) => {
    setVisible(false);
    // Simulate native event structure
    onPress({
      nativeEvent: {
        index,
        name: action.title,
      }
    });
  };

  const menuBackgroundColor = isDark ? 'rgba(30, 30, 30, 0.98)' : 'rgba(250, 250, 250, 0.98)';
  const textColor = isDark ? '#FFFFFF' : '#000000';

  return (
    <>
      <Pressable onPress={showMenu} ref={childRef}>
        {children}
      </Pressable>

      <Modal
        transparent={true}
        visible={visible}
        onRequestClose={() => setVisible(false)}
        animationType="fade"
      >
        <Pressable 
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.3)',
          }}
          onPress={() => setVisible(false)}
        >
          <View style={{
            position: 'absolute',
            top: menuPosition.y,
            left: menuPosition.x,
            width: 280,
            backgroundColor: menuBackgroundColor,
            borderRadius: 12,
            padding: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 25,
            elevation: 8,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          }}>
            <ScrollView style={{ maxHeight: 400 }}>
              {actions.map((action, index) => (
                <TouchableOpacity
                  key={action.id}
                  onPress={() => handleActionPress(action, index)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 12,
                    borderRadius: 8,
                  }}
                  activeOpacity={0.7}
                >
                  {action.iconName && (
                    <>
                      <Icon 
                        name={action.iconName} 
                        size={20} 
                        color={textColor}
                      />
                      <View style={{ width: 12 }} />
                    </>
                  )}
                  <Text style={{ 
                    color: textColor,
                    fontSize: 16,
                    flex: 1,
                  }}>
                    {action.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};