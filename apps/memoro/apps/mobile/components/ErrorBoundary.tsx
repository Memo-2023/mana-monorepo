import React, { Component, ErrorInfo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Text from '~/components/atoms/Text';

interface Props {
	children: React.ReactNode;
	fallback?: React.ReactNode;
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

/**
 * ErrorBoundary that catches rendering crashes and shows a recovery UI
 * instead of crashing the entire app.
 */
export default class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error('[ErrorBoundary] Caught error:', error.message);
		console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
		this.props.onError?.(error, errorInfo);
	}

	handleRetry = () => {
		this.setState({ hasError: false, error: null });
	};

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<View style={styles.container}>
					<View style={styles.content}>
						<Text variant="heading" style={styles.title}>
							Something went wrong
						</Text>
						<Text variant="body" style={styles.message}>
							The app encountered an unexpected error. Please try again.
						</Text>
						<ScrollView style={styles.errorBox} contentContainerStyle={styles.errorBoxContent}>
							<Text variant="caption" style={styles.errorText}>
								{this.state.error?.message || 'Unknown error'}
							</Text>
						</ScrollView>
						<TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
							<Text variant="body" style={styles.retryText}>
								Try Again
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			);
		}

		return this.props.children;
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 24,
		backgroundColor: '#f8f8f8',
	},
	content: {
		alignItems: 'center',
		maxWidth: 400,
	},
	title: {
		fontSize: 20,
		fontWeight: '600',
		marginBottom: 12,
		textAlign: 'center',
	},
	message: {
		fontSize: 16,
		color: '#666',
		textAlign: 'center',
		marginBottom: 16,
	},
	errorBox: {
		maxHeight: 120,
		width: '100%',
		backgroundColor: '#fee',
		borderRadius: 8,
		marginBottom: 20,
	},
	errorBoxContent: {
		padding: 12,
	},
	errorText: {
		fontSize: 12,
		color: '#c00',
		fontFamily: 'monospace',
	},
	retryButton: {
		backgroundColor: '#007AFF',
		paddingHorizontal: 32,
		paddingVertical: 14,
		borderRadius: 10,
	},
	retryText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
});
