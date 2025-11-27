import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
    useWindowDimensions,
    Image,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SlideView } from '../slides/SlideView';
import { Slide } from '../../types/models';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useTheme } from '../ThemeProvider';

interface PresentationModeProps {
    slides: Slide[];
    initialSlideIndex?: number;
    onClose?: () => void;
}

export const PresentationMode: React.FC<PresentationModeProps> = ({
    slides,
    initialSlideIndex = 0,
    onClose,
}) => {
    const { theme } = useTheme();
    const [currentSlideIndex, setCurrentSlideIndex] = useState(initialSlideIndex);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [showSpeakerNotes, setShowSpeakerNotes] = useState(false);
    const { width, height } = useWindowDimensions();

    // Control visibility state
    const controlsOpacity = useRef(new Animated.Value(1)).current;
    const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

    const showControls = useCallback(() => {
        // Clear any existing timer
        if (hideControlsTimer.current) {
            clearTimeout(hideControlsTimer.current);
        }

        // Show controls with animation
        Animated.timing(controlsOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();

        // Set timer to hide controls after 5 seconds
        hideControlsTimer.current = setTimeout(() => {
            Animated.timing(controlsOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }, 5000);
    }, [controlsOpacity]);

    const handleNavigation = useCallback((direction: 'prev' | 'next') => {
        if (direction === 'prev') {
            setCurrentSlideIndex(prev => prev === 0 ? slides.length - 1 : prev - 1);
        } else {
            setCurrentSlideIndex(prev => prev === slides.length - 1 ? 0 : prev + 1);
        }
        showControls();
    }, [slides.length, showControls]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            console.log('Key pressed:', event.key); // Debug log
            switch (event.key.toLowerCase()) {
                case 'arrowleft':
                case 'a':
                    event.preventDefault();
                    handleNavigation('prev');
                    break;
                case 'arrowright':
                case 'd':
                    event.preventDefault();
                    handleNavigation('next');
                    break;
            }
        };

        if (Platform.OS === 'web') {
            window.addEventListener('keydown', handleKeyDown);
            return () => {
                window.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [handleNavigation]);

    // Handle mouse movement
    useEffect(() => {
        if (Platform.OS === 'web') {
            window.addEventListener('mousemove', showControls);
            return () => {
                window.removeEventListener('mousemove', showControls);
            };
        }
    }, [showControls]);

    // Show controls initially
    useEffect(() => {
        showControls();
    }, []);

    // Clean up timer on unmount
    useEffect(() => {
        return () => {
            if (hideControlsTimer.current) {
                clearTimeout(hideControlsTimer.current);
            }
        };
    }, []);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isTimerRunning) {
            timer = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isTimerRunning]);

    useEffect(() => {
        const setupOrientation = async () => {
            if (isFullscreen) {
                await ScreenOrientation.lockAsync(
                    ScreenOrientation.OrientationLock.LANDSCAPE
                );
            } else {
                await ScreenOrientation.unlockAsync();
            }
        };

        if (Platform.OS !== 'web') {
            setupOrientation();
        }

        return () => {
            if (Platform.OS !== 'web') {
                ScreenOrientation.unlockAsync();
            }
        };
    }, [isFullscreen]);

    const currentSlide = slides[currentSlideIndex];

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.backgroundPage }]}>
            {/* Top bar with title and close button */}
            <Animated.View 
                style={[
                    styles.topBar, 
                    { 
                        opacity: controlsOpacity,
                        backgroundColor: `${theme.colors.backgroundPrimary}CC`
                    }
                ]}
            >
                <Text style={[styles.slideTitle, { color: theme.colors.textPrimary }]}>
                    {currentSlide.title}
                </Text>
                <TouchableOpacity 
                    style={[styles.closeButton, { backgroundColor: theme.colors.backgroundSecondary }]}
                    onPress={onClose}
                >
                    <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
            </Animated.View>

            {/* Current slide */}
            <View style={styles.slideContainer}>
                <SlideView 
                    slide={currentSlide} 
                    showNotes={showSpeakerNotes}
                    isFullscreen={isFullscreen}
                    onNavigate={handleNavigation}
                    isFirstSlide={currentSlideIndex === 0}
                    isLastSlide={currentSlideIndex === slides.length - 1}
                />
            </View>

            {/* Controls overlay with animation */}
            <Animated.View 
                style={[
                    styles.controlsOverlay, 
                    { 
                        opacity: controlsOpacity,
                        backgroundColor: `${theme.colors.backgroundPrimary}CC`
                    }
                ]}
            >
                <View style={styles.controls}>
                    <TouchableOpacity 
                        style={[styles.controlButton, { backgroundColor: theme.colors.backgroundSecondary }]}
                        onPress={() => handleNavigation('prev')}
                    >
                        <Ionicons 
                            name="chevron-back" 
                            size={24} 
                            color={theme.colors.textPrimary}
                        />
                    </TouchableOpacity>

                    <View style={styles.centerControls}>
                        <TouchableOpacity 
                            style={[styles.controlButton, { backgroundColor: theme.colors.backgroundSecondary }]}
                            onPress={() => setShowSpeakerNotes(!showSpeakerNotes)}
                        >
                            <Ionicons 
                                name={showSpeakerNotes ? 'eye-off' : 'eye'} 
                                size={24} 
                                color={theme.colors.textPrimary}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.controlButton, { backgroundColor: theme.colors.backgroundSecondary }]}
                            onPress={() => setIsTimerRunning(!isTimerRunning)}
                        >
                            <Ionicons 
                                name={isTimerRunning ? 'pause' : 'play'} 
                                size={24} 
                                color={theme.colors.textPrimary}
                            />
                        </TouchableOpacity>

                        <Text style={[styles.timer, { color: theme.colors.textPrimary }]}>
                            {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                        </Text>

                        <TouchableOpacity 
                            style={[styles.controlButton, { backgroundColor: theme.colors.backgroundSecondary }]}
                            onPress={() => setIsFullscreen(!isFullscreen)}
                        >
                            <Ionicons 
                                name={isFullscreen ? 'contract' : 'expand'} 
                                size={24} 
                                color={theme.colors.textPrimary}
                            />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity 
                        style={[styles.controlButton, { backgroundColor: theme.colors.backgroundSecondary }]}
                        onPress={() => handleNavigation('next')}
                    >
                        <Ionicons 
                            name="chevron-forward" 
                            size={24} 
                            color={theme.colors.textPrimary}
                        />
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
    },
    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 40,
        zIndex: 10,
    },
    slideTitle: {
        fontSize: 18,
        fontWeight: '500',
    },
    closeButton: {
        padding: 8,
        borderRadius: 20,
    },
    slideContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    controlsOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: 800,
        marginHorizontal: 'auto',
    },
    centerControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    controlButton: {
        padding: 8,
        borderRadius: 20,
    },
    timer: {
        fontSize: 16,
        marginLeft: 8,
    },
});