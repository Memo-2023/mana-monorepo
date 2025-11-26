import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Text from '../atoms/Text';

interface PremiumCuddlyToyCardProps {
  onPress: () => void;
}

export default function PremiumCuddlyToyCard({ onPress }: PremiumCuddlyToyCardProps) {

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <LinearGradient
          colors={['#FFD700', '#FFA500', '#FF8C00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        >
          {/* Sparkle decorations */}
          <View style={styles.sparkleTopRight}>
            <MaterialCommunityIcons name="star-four-points" size={16} color="rgba(255, 255, 255, 0.6)" />
          </View>
          <View style={styles.sparkleBottomLeft}>
            <MaterialCommunityIcons name="star-four-points" size={12} color="rgba(255, 255, 255, 0.4)" />
          </View>

          <View style={styles.contentRow}>
            <View style={styles.textContainer}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>NEU</Text>
              </View>
              <Text style={styles.title}>Kuscheltier zum Leben erwecken</Text>
              <Text style={styles.subtitle}>
                Verwandle das Kuscheltier deines Kindes in einen magischen Charakter
              </Text>
            </View>

            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="teddy-bear" size={36} color="#000000" />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  gradientBackground: {
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    // Use alignSelf: 'stretch' instead of width: '100%' to prevent CoreGraphics crashes
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 200, // Ensure CoreGraphics has valid dimensions
  },
  sparkleTopRight: {
    position: 'absolute',
    top: 16,
    right: 16,
    opacity: 0.6,
  },
  sparkleBottomLeft: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    opacity: 0.4,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
  badge: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
    fontFamily: 'Grandstander_700Bold',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.8)',
    lineHeight: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
