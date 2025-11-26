import React from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import Text from '../atoms/Text';

interface TabOption {
  key: string;
  label: string;
}

interface TabSwitcherProps {
  options: TabOption[];
  activeKey: string;
  onTabChange: (key: string) => void;
  containerStyle?: object;
  activeColor?: string;
  inactiveColor?: string;
}

export default function TabSwitcher({ 
  options, 
  activeKey, 
  onTabChange,
  containerStyle,
  activeColor = '#FFD700',
  inactiveColor = '#333333'
}: TabSwitcherProps) {
  if (options.length !== 2) {
    console.warn('TabSwitcher is designed for exactly 2 options');
  }
  
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.switchTrack}>
        {options.map((option, index) => {
          const isActive = activeKey === option.key;
          return (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.tabButton,
                index === 0 && styles.leftTabButton,
                index === options.length - 1 && styles.rightTabButton,
                isActive && { backgroundColor: activeColor }
              ]}
              onPress={() => onTabChange(option.key)}
              activeOpacity={0.8}
            >
              <Text 
                style={[
                  styles.tabText, 
                  isActive ? styles.activeTabText : { color: '#FFFFFF' }
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  switchTrack: {
    flexDirection: 'row',
    borderRadius: 10,
    backgroundColor: '#333333',
    padding: 4,
    width: '100%',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginHorizontal: 2,
  },
  leftTabButton: {
    marginLeft: 0,
  },
  rightTabButton: {
    marginRight: 0,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#000000',
  },
});
