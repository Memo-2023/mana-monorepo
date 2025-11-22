import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import Text from '../atoms/Text';
import Icon from '../atoms/Icon';

interface VotingButtonProps {
  storyId: string;
  initialVoted?: boolean;
  voteCount: number;
  onVote: (storyId: string) => Promise<void>;
  onUnvote: (storyId: string) => Promise<void>;
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
}

const VotingButton: React.FC<VotingButtonProps> = ({
  storyId,
  initialVoted = false,
  voteCount,
  onVote,
  onUnvote,
  size = 'medium',
  showCount = true
}) => {
  const [voted, setVoted] = useState(initialVoted);
  const [isAnimating, setIsAnimating] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Update voted state when initialVoted prop changes
  useEffect(() => {
    setVoted(initialVoted);
  }, [initialVoted]);

  const sizeConfig = {
    small: { icon: 20, text: 12, padding: 8 },
    medium: { icon: 24, text: 14, padding: 10 },
    large: { icon: 32, text: 16, padding: 12 }
  };

  const config = sizeConfig[size];

  const handlePress = async () => {
    if (isAnimating) return;

    setIsAnimating(true);

    // Store previous state for potential rollback
    const previousVoted = voted;
    const newVoted = !voted;

    // Toggle vote state immediately (optimistic update)
    setVoted(newVoted);

    // Start animations
    if (newVoted) {
      // Vote animation - heart grows and floating heart appears
      Animated.parallel([
        // Main heart bounce
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.4,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            tension: 100,
            useNativeDriver: true,
          }),
        ]),
        // Floating heart animation
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.parallel([
            Animated.timing(floatAnim, {
              toValue: -50,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start(() => {
        floatAnim.setValue(0);
        opacityAnim.setValue(0);
      });
    } else {
      // Unvote animation - heart shrinks slightly
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 3,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }

    try {
      if (newVoted) {
        await onVote(storyId);
      } else {
        await onUnvote(storyId);
      }
    } catch (error) {
      // Revert to previous state on error
      setVoted(previousVoted);
      console.error('Error toggling vote:', error);
    } finally {
      setIsAnimating(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Floating heart for animation */}
      <Animated.View
        style={[
          styles.floatingHeart,
          {
            opacity: opacityAnim,
            transform: [
              { translateY: floatAnim },
              { scale: 1.2 }
            ],
          },
        ]}
        pointerEvents="none"
      >
        <Icon 
          set="ionicons"
          name="heart" 
          size={config.icon} 
          color="#FFD700" 
        />
      </Animated.View>

      {/* Main voting button */}
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.button,
          { padding: config.padding },
          !showCount && styles.buttonCircular,
          pressed && styles.buttonPressed,
        ]}
      >
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <Icon
            set="ionicons"
            name={voted ? 'heart' : 'heart-outline'}
            size={config.icon}
            color={voted ? '#FFD700' : '#999999'}
          />
        </Animated.View>
        {showCount && (
          <Text style={[
            styles.voteCount,
            { fontSize: config.text },
            voted && styles.voteCountActive
          ]}>
            {voteCount}
          </Text>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    gap: 6,
  },
  buttonCircular: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    gap: 0,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteCount: {
    fontWeight: '600',
    color: '#999999',
  },
  voteCountActive: {
    color: '#FFD700',
  },
  floatingHeart: {
    position: 'absolute',
    top: -10,
    left: '50%',
    marginLeft: -12,
    zIndex: 100,
  },
});

export default VotingButton;