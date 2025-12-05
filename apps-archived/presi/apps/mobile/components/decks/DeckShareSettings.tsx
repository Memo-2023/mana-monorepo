import React, { useState } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Switch,
	TextInput,
	Platform,
	Clipboard,
} from 'react-native';
import { useTheme } from '../ThemeProvider';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Deck } from '../../types/models';
import type { CollaboratorRole } from '../../types/models';

interface DeckShareSettingsProps {
	deck: Deck;
	onUpdateSharing: (sharing: Deck['sharing']) => void;
	onClose: () => void;
}

interface CollaboratorInput {
	email: string;
	role: CollaboratorRole;
}

export const DeckShareSettings: React.FC<DeckShareSettingsProps> = ({
	deck,
	onUpdateSharing,
	onClose,
}) => {
	const { theme } = useTheme();
	const [isPublic, setIsPublic] = useState(deck.sharing.isPublic);
	const [newCollaborator, setNewCollaborator] = useState<CollaboratorInput>({
		email: '',
		role: 'viewer',
	});
	const [copied, setCopied] = useState(false);

	const shareUrl = `${Platform.OS === 'web' ? window.location.origin : 'https://presi.app'}/deck/${deck.id}`;

	const handleCopyLink = () => {
		Clipboard.setString(shareUrl);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleTogglePublic = () => {
		setIsPublic(!isPublic);
		onUpdateSharing({
			...deck.sharing,
			isPublic: !isPublic,
		});
	};

	const handleAddCollaborator = () => {
		// TODO: Implement email to userId lookup
		const mockUserId = 'user_' + Date.now();
		onUpdateSharing({
			...deck.sharing,
			collaborators: {
				...deck.sharing.collaborators,
				[mockUserId]: newCollaborator.role,
			},
		});
		setNewCollaborator({ email: '', role: 'viewer' });
	};

	const handleRemoveCollaborator = (userId: string) => {
		const newCollaborators = { ...deck.sharing.collaborators };
		delete newCollaborators[userId];
		onUpdateSharing({
			...deck.sharing,
			collaborators: newCollaborators,
		});
	};

	return (
		<View style={[styles.container, { backgroundColor: theme.colors.background }]}>
			<View style={styles.header}>
				<Text style={[styles.title, { color: theme.colors.textPrimary }]}>Share Settings</Text>
				<TouchableOpacity onPress={onClose}>
					<MaterialIcons name="close" size={24} color={theme.colors.textPrimary} />
				</TouchableOpacity>
			</View>

			<View style={styles.content}>
				<View style={styles.section}>
					<View style={styles.settingRow}>
						<View style={styles.settingInfo}>
							<Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
								Public Access
							</Text>
							<Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
								Anyone with the link can view this deck
							</Text>
						</View>
						<Switch
							value={isPublic}
							onValueChange={handleTogglePublic}
							trackColor={{ false: theme.colors.backgroundSecondary, true: theme.colors.primary }}
						/>
					</View>
				</View>

				<View style={[styles.section, styles.linkSection]}>
					<Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
						Share Link
					</Text>
					<View
						style={[styles.linkContainer, { backgroundColor: theme.colors.backgroundSecondary }]}
					>
						<Text style={[styles.link, { color: theme.colors.textPrimary }]} numberOfLines={1}>
							{shareUrl}
						</Text>
						<TouchableOpacity
							style={[styles.copyButton, { backgroundColor: theme.colors.primary }]}
							onPress={handleCopyLink}
						>
							<MaterialIcons name={copied ? 'check' : 'content-copy'} size={20} color="#FFFFFF" />
							<Text style={styles.copyButtonText}>{copied ? 'Copied!' : 'Copy'}</Text>
						</TouchableOpacity>
					</View>
				</View>

				<View style={styles.section}>
					<Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
						Collaborators
					</Text>
					<View style={styles.collaboratorInput}>
						<TextInput
							style={[styles.input, { color: theme.colors.textPrimary }]}
							placeholder="Email address"
							placeholderTextColor={theme.colors.textSecondary}
							value={newCollaborator.email}
							onChangeText={(email) => setNewCollaborator({ ...newCollaborator, email })}
						/>
						<TouchableOpacity
							style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
							onPress={handleAddCollaborator}
						>
							<Text style={styles.addButtonText}>Add</Text>
						</TouchableOpacity>
					</View>

					{Object.entries(deck.sharing.collaborators).map(([userId, role]) => (
						<View key={userId} style={styles.collaboratorRow}>
							<Text style={[styles.collaboratorEmail, { color: theme.colors.textPrimary }]}>
								{userId} ({role})
							</Text>
							<TouchableOpacity onPress={() => handleRemoveCollaborator(userId)}>
								<MaterialIcons name="remove-circle" size={24} color={theme.colors.error} />
							</TouchableOpacity>
						</View>
					))}
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		padding: 16,
		borderRadius: 8,
		maxWidth: 500,
		width: '100%',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 24,
		borderBottomWidth: 1,
		borderBottomColor: '#ccc',
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
	},
	content: {
		padding: 16,
		gap: 24,
	},
	section: {
		gap: 16,
	},
	settingRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	settingInfo: {
		flex: 1,
		marginRight: 16,
	},
	settingTitle: {
		fontSize: 16,
		fontWeight: '500',
	},
	settingDescription: {
		fontSize: 14,
		marginTop: 4,
	},
	linkSection: {
		gap: 8,
	},
	sectionTitle: {
		fontSize: 14,
		fontWeight: '500',
	},
	linkContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 8,
		padding: 8,
		gap: 8,
	},
	link: {
		flex: 1,
		fontSize: 14,
	},
	copyButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 6,
		gap: 4,
	},
	copyButtonText: {
		color: '#FFFFFF',
		fontSize: 14,
		fontWeight: '500',
	},
	collaboratorInput: {
		flexDirection: 'row',
		marginBottom: 16,
	},
	input: {
		flex: 1,
		height: 40,
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 4,
		paddingHorizontal: 8,
		marginRight: 8,
	},
	addButton: {
		paddingHorizontal: 16,
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 4,
	},
	addButtonText: {
		color: 'white',
		fontWeight: 'bold',
	},
	collaboratorRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 8,
		borderBottomWidth: 1,
		borderBottomColor: '#eee',
	},
	collaboratorEmail: {
		fontSize: 16,
	},
});
