/**
 * Error Boundary Component
 * Fängt JavaScript-Fehler in der Komponenten-Hierarchie ab
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import * as Haptics from 'expo-haptics';
import { withTranslation, WithTranslation } from 'react-i18next';

interface Props extends WithTranslation {
	children: ReactNode;
	fallback?: ReactNode;
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
	hasError: boolean;
	error: Error | null;
	errorInfo: ErrorInfo | null;
}

class ErrorBoundaryClass extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
		};
	}

	static getDerivedStateFromError(error: Error): State {
		return {
			hasError: true,
			error,
			errorInfo: null,
		};
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error('=================================');
		console.error('ErrorBoundary caught an error:');
		console.error('Error:', error);
		console.error('Error Message:', error.message);
		console.error('Error Stack:', error.stack);
		console.error('Component Stack:', errorInfo.componentStack);
		console.error('=================================');

		this.setState({
			error,
			errorInfo,
		});

		// Callback für externes Error-Logging
		if (this.props.onError) {
			this.props.onError(error, errorInfo);
		}
	}

	handleReset = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		this.setState({
			hasError: false,
			error: null,
			errorInfo: null,
		});
	};

	render() {
		if (this.state.hasError) {
			// Custom fallback UI wenn vorhanden
			if (this.props.fallback) {
				return this.props.fallback;
			}

			// Standard Error UI
			return (
				<SafeAreaView className="flex-1 bg-white dark:bg-black">
					<ScrollView
						className="flex-1"
						contentContainerStyle={{
							flexGrow: 1,
							justifyContent: 'center',
							alignItems: 'center',
							padding: 20,
						}}
					>
						<View className="items-center max-w-sm">
							<View className="bg-red-100 dark:bg-red-900/20 p-4 rounded-full mb-6">
								<Icon name="warning-outline" size={48} color="#ef4444" />
							</View>

							<Text className="text-2xl font-bold text-black dark:text-white mb-2 text-center">
								{this.props.t('errors.somethingWrong') || 'Ups, etwas ist schiefgelaufen!'}
							</Text>

							<Text className="text-gray-600 dark:text-gray-400 text-center mb-6">
								{this.props.t('errors.unexpectedError') ||
									'Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut oder starte die App neu.'}
							</Text>

							{/* Error Details (nur in Development) */}
							{__DEV__ && this.state.error && (
								<View className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-6 w-full">
									<Text className="text-red-600 dark:text-red-400 font-mono text-xs mb-2">
										{this.state.error.toString()}
									</Text>
									{this.state.errorInfo && (
										<Text className="text-gray-600 dark:text-gray-400 font-mono text-xs">
											{this.state.errorInfo.componentStack}
										</Text>
									)}
								</View>
							)}

							<Pressable
								onPress={this.handleReset}
								className="bg-black dark:bg-white px-6 py-3 rounded-full"
							>
								<Text className="text-white dark:text-black font-semibold">
									{this.props.t('common.retry') || 'Erneut versuchen'}
								</Text>
							</Pressable>
						</View>
					</ScrollView>
				</SafeAreaView>
			);
		}

		return this.props.children;
	}
}

// Hook für funktionale Komponenten
export const useErrorHandler = () => {
	const [error, setError] = React.useState<Error | null>(null);

	React.useEffect(() => {
		if (error) {
			throw error;
		}
	}, [error]);

	const resetError = () => setError(null);
	const throwError = (error: Error) => setError(error);

	return { throwError, resetError };
};

export const ErrorBoundary = withTranslation()(ErrorBoundaryClass);

// HOC für Error Boundary
export function withErrorBoundary<P extends object>(
	Component: React.ComponentType<P>,
	fallback?: ReactNode
) {
	return (props: P) => (
		<ErrorBoundary fallback={fallback}>
			<Component {...props} />
		</ErrorBoundary>
	);
}
