import { Stack } from 'expo-router';
import {
	StyleSheet,
	View,
	Image,
	Text,
	TouchableOpacity,
	ActivityIndicator,
	ScrollView,
	useWindowDimensions,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import React, { useRef, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme } from '~/utils/ThemeContext';
import SidebarCreateFigureForm from '~/components/CreateFigureForm';

export default function Create() {
	const { theme } = useTheme();
	const { height } = useWindowDimensions();
	const [isGenerating, setIsGenerating] = useState(false);
	const handleSubmitRef = useRef<() => Promise<void>>();

	// Function to handle the form submission from the sticky button
	const handleStickySubmit = async () => {
		if (handleSubmitRef.current) {
			setIsGenerating(true);
			try {
				await handleSubmitRef.current();
			} finally {
				setIsGenerating(false);
			}
		}
	};

	// Callback to receive the handleSubmit function from the form component
	const onFormSubmit = (handleSubmit: () => Promise<void>) => {
		handleSubmitRef.current = handleSubmit;
	};

	return (
		<>
			<Stack.Screen
				options={{
					title: 'Create',
					headerStyle: {
						backgroundColor: theme.colors.background,
					},
					headerTintColor: theme.colors.text,
					headerShadowVisible: false,
				}}
			/>
			<View style={[styles.container, { backgroundColor: theme.colors.background }]}>
				<Image
					source={require('../../assets/actionfigures/YourCharacter.png')}
					style={styles.backgroundImage}
					resizeMode="contain"
				/>
				<KeyboardAwareScrollView
					style={styles.scrollContainer}
					contentContainerStyle={[styles.scrollContentContainer, { paddingTop: height * 0.65 }]}
					showsVerticalScrollIndicator={false}
					bounces={false}
					extraScrollHeight={100}
					enableOnAndroid
					keyboardShouldPersistTaps="handled"
					enableResetScrollToCoords={false}
				>
					<View style={styles.formContainer}>
						<SidebarCreateFigureForm onSubmit={onFormSubmit} />
					</View>
				</KeyboardAwareScrollView>

				{/* Sticky Create Figure Button */}
				<TouchableOpacity
					style={[styles.stickyButton, { backgroundColor: theme.colors.primary }]}
					onPress={handleStickySubmit}
					disabled={isGenerating}
				>
					{isGenerating ? (
						<ActivityIndicator color="#fff" size="small" style={{ marginRight: 10 }} />
					) : null}
					<Text style={styles.buttonText}>{isGenerating ? 'Creating...' : 'Create Figgo'}</Text>
					{!isGenerating && (
						<FontAwesome name="arrow-right" size={16} color="#fff" style={{ marginLeft: 10 }} />
					)}
				</TouchableOpacity>
			</View>
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		width: '100%',
		padding: 0,
		margin: 0,
		position: 'relative',
	},
	backgroundImage: {
		width: '100%',
		height: '100%',
		maxWidth: 800,
		maxHeight: 800,
		resizeMode: 'contain',
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		marginLeft: 'auto',
		marginRight: 'auto',
		zIndex: 1,
		opacity: 0.9,
	},
	scrollContainer: {
		flex: 1,
		width: '100%',
		zIndex: 2,
	},
	scrollContentContainer: {
		flexGrow: 1,
		paddingBottom: 120, // Add padding at the bottom for the sticky button
	},
	formContainer: {
		width: '100%',
		zIndex: 2,
		paddingBottom: 0, // Remove bottom padding to avoid extra space
		maxWidth: 450, // Further reduced max width for the form
		alignSelf: 'center', // Center the form
	},
	stickyButton: {
		position: 'absolute',
		bottom: 70, // Positioned lower, closer to the tab bar
		left: '50%', // Center horizontally
		transform: [{ translateX: -100 }], // Half of the width to center
		width: 200, // Fixed width for a more compact button
		height: 50, // Reduced height
		borderRadius: 25, // Half of height for rounded corners
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 999, // Much higher z-index to ensure it's above the tab bar
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 10, // Higher elevation for Android
	},
	buttonText: {
		color: '#fff',
		fontSize: 18,
		fontWeight: 'bold',
	},
});
