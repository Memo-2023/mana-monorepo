import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Deck } from '../../types/models';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../components/ThemeProvider';

interface DeckCardProps {
    deck: Deck;
    onPress: (deck: Deck) => void;
    onDelete: (deck: Deck) => void;
    onShare: (deck: Deck) => void;
    firstSlideImage?: string;
    slideCount: number;
}

export const DeckCard: React.FC<DeckCardProps> = ({ deck, onPress, onDelete, onShare, firstSlideImage, slideCount }) => {
    const { theme } = useTheme();

    const isPublic = deck.sharing?.type === 'public';

    const handleDelete = (event: any) => {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        if (typeof onDelete === 'function') {
            onDelete(deck);
        } else {
            console.warn('onDelete is not a function');
        }
    };

    const handleShare = (event: any) => {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        if (typeof onShare === 'function') {
            onShare(deck);
        }
    };

    return (
        <TouchableOpacity 
            style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}
            onPress={() => onPress(deck)}
        >
            <View style={styles.content}>
                <View style={styles.imageContainer}>
                    {firstSlideImage ? (
                        <Image 
                            source={{ uri: firstSlideImage }} 
                            style={styles.thumbnail}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={styles.placeholderContainer}>
                            <MaterialIcons name="image" size={48} color={theme.colors.textTertiary} />
                        </View>
                    )}
                </View>
                
                <View style={styles.header}>
                    <View style={styles.titleRow}>
                        <Text style={[styles.title, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                            {deck.name}
                        </Text>
                        {isPublic && (
                            <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
                                <Text style={styles.badgeText}>Public</Text>
                            </View>
                        )}
                    </View>
                    <Text style={[styles.slideCount, { color: theme.colors.textSecondary }]}>
                        {slideCount} {slideCount === 1 ? 'Slide' : 'Slides'}
                    </Text>
                    <View style={styles.actions}>
                        <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
                            <MaterialIcons name="share" size={24} color={theme.colors.textTertiary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
                            <MaterialIcons name="delete" size={24} color={theme.colors.textTertiary} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
    },
    content: {
        flexDirection: 'row',
    },
    imageContainer: {
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    slideCount: {
        fontSize: 14,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        padding: 4,
    },
});