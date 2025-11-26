import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Text from '../atoms/Text';
import Avatar from '../atoms/Avatar';

export interface Creator {
  creatorId: string;
  description: string;
  name: string;
  profilePicture: string;
  systemPrompt: string;
  type: string;
}

interface CreatorSelectionSectionProps {
  authors: Creator[];
  illustrators: Creator[];
  selectedAuthor: Creator | null;
  selectedIllustrator: Creator | null;
  onSelectAuthor: (creator: Creator) => void;
  onSelectIllustrator: (creator: Creator) => void;
}

export default function CreatorSelectionSection({
  authors,
  illustrators,
  selectedAuthor,
  selectedIllustrator,
  onSelectAuthor,
  onSelectIllustrator,
}: CreatorSelectionSectionProps) {
  const renderCreatorItem = (
    item: Creator,
    isSelected: boolean,
    onSelect: (creator: Creator) => void
  ) => (
    <TouchableOpacity
      style={[styles.creatorCard, isSelected && styles.selectedCreator]}
      onPress={() => onSelect(item)}
    >
      <Avatar
        imageUrl={item.profilePicture !== 'to_be_added' ? item.profilePicture : undefined}
        name={item.name}
        size={60}
        showName={false}
        isSelected={isSelected}
      />
      <Text style={styles.creatorName} numberOfLines={1}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.creatorSectionTitle}>Autoren</Text>
      <FlatList
        data={authors}
        renderItem={({ item }) =>
          renderCreatorItem(item, selectedAuthor?.creatorId === item.creatorId, onSelectAuthor)
        }
        keyExtractor={(item) => item.creatorId}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.creatorList}
        contentContainerStyle={styles.creatorListContent}
        ListEmptyComponent={<Text style={styles.emptyListText}>Keine Autoren verfügbar</Text>}
      />

      <Text style={styles.creatorSectionTitle}>Illustratoren</Text>
      <FlatList
        data={illustrators}
        renderItem={({ item }) =>
          renderCreatorItem(
            item,
            selectedIllustrator?.creatorId === item.creatorId,
            onSelectIllustrator
          )
        }
        keyExtractor={(item) => item.creatorId}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.creatorList}
        contentContainerStyle={styles.creatorListContent}
        ListEmptyComponent={
          <Text style={styles.emptyListText}>Keine Illustratoren verfügbar</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  creatorSectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 12,
    marginTop: 16,
  },
  creatorList: {
    marginBottom: 16,
  },
  creatorListContent: {
    paddingRight: 20,
  },
  creatorCard: {
    alignItems: 'center',
    marginRight: 12,
    opacity: 0.7,
  },
  selectedCreator: {
    opacity: 1,
  },
  creatorName: {
    color: '#ffffff',
    marginTop: 6,
    fontSize: 13,
    maxWidth: 80,
    textAlign: 'center',
  },
  emptyListText: {
    color: '#999999',
    fontSize: 14,
    fontStyle: 'italic',
    padding: 20,
  },
});
