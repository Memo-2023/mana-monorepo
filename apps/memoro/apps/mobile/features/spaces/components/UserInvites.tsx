import React, { useEffect, useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ActivityIndicator,
	FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import spaceService, { SpaceInvite } from '../services/spaceService';
import { tokenManager } from '@/features/auth/services/tokenManager';
import { formatDistanceToNow } from 'date-fns';

// Extend the SpaceInvite interface to match what we receive from the API
interface Invite extends SpaceInvite {
	space_id: string;
	spaces: {
		name: string;
		owner_id: string;
	};
}

const UserInvites = () => {
	const [invites, setInvites] = useState<Invite[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [processingInvites, setProcessingInvites] = useState<Record<string, boolean>>({});

	const navigation = useNavigation();

	useEffect(() => {
		fetchInvites();
	}, []);

	const fetchInvites = async () => {
		try {
			setLoading(true);
			setError(null);

			// Use the spaceService to get user invites
			try {
				// Call the backend API to get user invites
				const response = await fetch(
					`${process.env.EXPO_PUBLIC_MEMORO_MIDDLEWARE_URL}/memoro/invites/pending`,
					{
						method: 'GET',
						headers: {
							Authorization: `Bearer ${await tokenManager.getValidToken()}`,
							'Content-Type': 'application/json',
						},
					}
				);

				if (!response.ok) {
					throw new Error(`Failed to fetch invites: ${response.statusText}`);
				}

				const data = await response.json();
				setInvites(data.invites || []);
			} catch (apiError) {
				console.error('API error fetching invites:', apiError);
				// Fallback to spaceService method
				const invites = await spaceService.getUserInvites();
				setInvites(invites as Invite[]);
			}
		} catch (error) {
			console.error('Error fetching invites:', error);
			setError('Failed to load invitations. Please try again later.');
		} finally {
			setLoading(false);
		}
	};

	const handleAcceptInvite = async (inviteId: string) => {
		try {
			setProcessingInvites((prev) => ({ ...prev, [inviteId]: true }));

			// Use the spaceService to accept the invite
			await spaceService.acceptInvite(inviteId);

			// Remove the invite from the list
			setInvites(invites.filter((invite) => invite.id !== inviteId));

			// Refresh the spaces list
			navigation.navigate('Spaces' as never);
		} catch (error) {
			console.error('Error accepting invite:', error);
			setError('Failed to accept invitation. Please try again later.');
		} finally {
			setProcessingInvites((prev) => ({ ...prev, [inviteId]: false }));
		}
	};

	const handleDeclineInvite = async (inviteId: string) => {
		try {
			setProcessingInvites((prev) => ({ ...prev, [inviteId]: true }));

			// Use the spaceService to decline the invite
			await spaceService.declineInvite(inviteId);

			// Remove the invite from the list
			setInvites(invites.filter((invite) => invite.id !== inviteId));
		} catch (error) {
			console.error('Error declining invite:', error);
			setError('Failed to decline invitation. Please try again later.');
		} finally {
			setProcessingInvites((prev) => ({ ...prev, [inviteId]: false }));
		}
	};

	const renderInviteItem = ({ item }: { item: Invite }) => {
		const isProcessing = processingInvites[item.id] || false;

		return (
			<View style={styles.inviteItem}>
				<View style={styles.inviteInfo}>
					<Text style={styles.spaceName}>{item.spaces.name}</Text>
					<Text style={styles.inviteDetails}>Role: {item.role}</Text>
					<Text style={styles.inviteDetails}>
						Invited {formatDistanceToNow(new Date(item.created_at))} ago
					</Text>
				</View>
				<View style={styles.inviteActions}>
					{isProcessing ? (
						<ActivityIndicator size="small" color="#4CAF50" />
					) : (
						<>
							<TouchableOpacity
								style={[styles.actionButton, styles.acceptButton]}
								onPress={() => handleAcceptInvite(item.id)}
							>
								<Ionicons name="checkmark-outline" size={18} color="white" />
								<Text style={styles.buttonText}>Accept</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.actionButton, styles.declineButton]}
								onPress={() => handleDeclineInvite(item.id)}
							>
								<Ionicons name="close-outline" size={18} color="white" />
								<Text style={styles.buttonText}>Decline</Text>
							</TouchableOpacity>
						</>
					)}
				</View>
			</View>
		);
	};

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#4CAF50" />
				<Text style={styles.loadingText}>Loading invitations...</Text>
			</View>
		);
	}

	if (error) {
		return (
			<View style={styles.errorContainer}>
				<Ionicons name="alert-circle-outline" size={48} color="#FF5252" />
				<Text style={styles.errorText}>{error}</Text>
				<TouchableOpacity style={styles.retryButton} onPress={fetchInvites}>
					<Text style={styles.retryButtonText}>Retry</Text>
				</TouchableOpacity>
			</View>
		);
	}

	if (invites.length === 0) {
		return (
			<View style={styles.emptyContainer}>
				<Ionicons name="mail-outline" size={48} color="#757575" />
				<Text style={styles.emptyText}>No pending invitations</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Space Invitations</Text>
			<FlatList
				data={invites}
				renderItem={renderInviteItem}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.listContent}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		backgroundColor: '#F5F5F5',
	},
	title: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 16,
		color: '#333',
	},
	listContent: {
		paddingBottom: 16,
	},
	inviteItem: {
		backgroundColor: 'white',
		borderRadius: 8,
		padding: 16,
		marginBottom: 12,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	inviteInfo: {
		flex: 1,
	},
	spaceName: {
		fontSize: 16,
		fontWeight: 'bold',
		marginBottom: 4,
		color: '#333',
	},
	inviteDetails: {
		fontSize: 14,
		color: '#757575',
		marginBottom: 2,
	},
	inviteActions: {
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'flex-end',
		gap: 8,
	},
	actionButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: 4,
		justifyContent: 'center',
	},
	acceptButton: {
		backgroundColor: '#4CAF50',
	},
	declineButton: {
		backgroundColor: '#FF5252',
	},
	buttonText: {
		color: 'white',
		fontSize: 12,
		fontWeight: 'bold',
		marginLeft: 4,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#F5F5F5',
	},
	loadingText: {
		marginTop: 12,
		fontSize: 16,
		color: '#757575',
	},
	errorContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#F5F5F5',
		padding: 16,
	},
	errorText: {
		marginTop: 12,
		fontSize: 16,
		color: '#FF5252',
		textAlign: 'center',
		marginBottom: 16,
	},
	retryButton: {
		backgroundColor: '#4CAF50',
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 4,
	},
	retryButtonText: {
		color: 'white',
		fontSize: 14,
		fontWeight: 'bold',
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#F5F5F5',
	},
	emptyText: {
		marginTop: 12,
		fontSize: 16,
		color: '#757575',
	},
});

export default UserInvites;
