import React from 'react';
import { View, Modal, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../ThemeProvider';

export interface ContextMenuItem {
    label: string;
    icon: string;
    onPress: () => void;
    destructive?: boolean;
}

interface ContextMenuProps {
    visible: boolean;
    onClose: () => void;
    items: ContextMenuItem[];
    position?: { x: number; y: number };
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
    visible,
    onClose,
    items,
    position,
}) => {
    const { theme } = useTheme();

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                onPress={onClose}
                activeOpacity={1}
            >
                <View
                    style={[
                        styles.menuContainer,
                        {
                            backgroundColor: theme.colors.backgroundSecondary,
                            top: position?.y || 0,
                            left: position?.x || 0,
                        },
                    ]}
                >
                    {items.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.menuItem,
                                index < items.length - 1 && styles.menuItemBorder,
                                { borderBottomColor: theme.colors.border }
                            ]}
                            onPress={() => {
                                item.onPress();
                                onClose();
                            }}
                        >
                            <Text
                                style={[
                                    styles.menuItemText,
                                    {
                                        color: item.destructive
                                            ? theme.colors.error
                                            : theme.colors.textPrimary,
                                    },
                                ]}
                            >
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    menuContainer: {
        position: 'absolute',
        minWidth: 150,
        borderRadius: 8,
        ...Platform.select({
            web: {
                boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
            },
            default: {
                elevation: 4,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
            },
        }),
    },
    menuItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    menuItemBorder: {
        borderBottomWidth: 1,
    },
    menuItemText: {
        fontSize: 16,
    },
});
