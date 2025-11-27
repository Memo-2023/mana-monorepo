import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { getCurrentUser, logoutUser } from '../services/auth';
import { useTheme } from '../components/ThemeProvider';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ThemeVariant, getTheme, THEME_PATTERNS, THEME_NAMES } from '../constants/theme';
import { ThemeSettings } from '../components/common/ThemeSettings';

const COLOR_MODES: { label: string; value: ColorMode }[] = [
    { label: 'System', value: 'system' },
    { label: 'Hell', value: 'light' },
    { label: 'Dunkel', value: 'dark' },
];

const CONTRAST_LABELS: Record<ContrastLevel, string> = {
    1: 'Sehr niedrig',
    2: 'Niedrig',
    3: 'Standard',
    4: 'Hoch',
    5: 'Sehr hoch',
};

export default function SettingsScreen() {
    const router = useRouter();
    const currentUser = getCurrentUser();
    const { theme, isDark } = useTheme();

    const handleLogout = async () => {
        try {
            await logoutUser();
            router.replace('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.backgroundPage }]}>
            <View style={styles.content}>
                <ThemeSettings />
                <View style={[styles.section, { backgroundColor: theme.colors.backgroundPrimary }]}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Kontrast:</Text>
                    <View style={styles.contrastContainer}>
                        <View style={styles.contrastSlider}>
                            {([1, 2, 3, 4, 5] as ContrastLevel[]).map((level) => (
                                <Pressable
                                    key={level}
                                    style={[
                                        styles.contrastOption,
                                        {
                                            backgroundColor: level === 3 
                                                ? theme.colors.primary 
                                                : theme.colors.backgroundSecondary,
                                        }
                                    ]}
                                    onPress={() => {}}
                                />
                            ))}
                        </View>
                        <Text style={[styles.contrastLabel, { color: theme.colors.textPrimary }]}>
                            {CONTRAST_LABELS[3]}
                        </Text>
                    </View>
                </View>

                <View style={styles.bottomSection}>
                    <View style={[styles.emailSection, { backgroundColor: theme.colors.backgroundPrimary }]}>
                        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Email</Text>
                        <Text style={[styles.value, { color: theme.colors.textPrimary }]}>{currentUser?.email}</Text>
                    </View>

                    <TouchableOpacity 
                        style={[styles.logoutButton, { backgroundColor: theme.colors.backgroundPrimary }]}
                        onPress={handleLogout}
                    >
                        <Text style={[styles.logoutButtonText, { color: theme.colors.textPrimary }]}>Sign Out</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 32,
        padding: 16,
        borderRadius: 8,
    },
    sectionTitleContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
    },
    label: {
        fontSize: 14,
        marginBottom: 4,
    },
    value: {
        fontSize: 16,
        fontWeight: '500',
    },
    contrastContainer: {
        marginTop: 16,
        alignItems: 'center',
        gap: 12,
    },
    contrastSlider: {
        flexDirection: 'row',
        gap: 4,
        height: 48,
        alignItems: 'center',
        width: '100%',
    },
    contrastOption: {
        flex: 1,
        height: 32,
        borderRadius: 16,
    },
    contrastLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    bottomSection: {
        gap: 12,
        marginTop: 'auto',
    },
    emailSection: {
        padding: 16,
        borderRadius: 8,
    },
    logoutButton: {
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    logoutButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});