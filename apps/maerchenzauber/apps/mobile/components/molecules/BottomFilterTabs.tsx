import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Text from '../atoms/Text';

export type FilterTab = 'popular' | 'new' | 'featured';

interface BottomFilterTabsProps {
  activeTab: FilterTab;
  onTabPress: (tab: FilterTab) => void;
  tabs?: FilterTab[];
}

export default function BottomFilterTabs({
  activeTab,
  onTabPress,
  tabs = ['popular', 'new', 'featured']
}: BottomFilterTabsProps) {
  
  const getTabLabel = (tab: FilterTab) => {
    switch (tab) {
      case 'popular':
        return '🔥 Beliebt';
      case 'new':
        return '✨ Neu';
      case 'featured':
        return '⭐ Featured';
      default:
        return tab;
    }
  };

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.activeTab]}
          onPress={() => onTabPress(tab)}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
            {getTabLabel(tab)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#181818',
    borderTopWidth: 1,
    borderTopColor: '#2C2C2C',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#2C2C2C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#FFCB00',
  },
  tabText: {
    color: '#A0A0A0',
    fontSize: 12,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#000000',
  },
});