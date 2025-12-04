import React, { ErrorInfo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ErrorBoundaryProps {
	children: React.ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
	errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
		};
	}

	static getDerivedStateFromError(error: Error) {
		// Aktualisiere den State, sodass der nächste Render den Fallback-UI zeigt.
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		// Fehlerdetails können auch an einen Fehlerprotokollierungsdienst gesendet werden
		console.error('Unbehandelter Fehler:', error);
		console.error('Komponenten-Stack:', errorInfo.componentStack);

		this.setState({
			error,
			errorInfo,
		});
	}

	render() {
		if (this.state.hasError) {
			// Fallback-UI für Fehler
			return (
				<View style={styles.container}>
					<Text style={styles.title}>Etwas ist schiefgelaufen</Text>
					<Text style={styles.errorText}>{this.state.error?.toString()}</Text>
					<Text style={styles.stackText}>{this.state.errorInfo?.componentStack}</Text>
				</View>
			);
		}

		return this.props.children;
	}
}

// Globaler Fehlerhandler für nicht abgefangene Fehler
export const setupGlobalErrorHandler = () => {
	// Fehlerhandler für unbehandelte Versprechen
	const handlePromiseRejection = (event: any) => {
		console.error('Unbehandelter Promise-Fehler:', event);
	};

	// Fehlerhandler für globale Fehler
	const handleGlobalError = (error: any, isFatal: boolean) => {
		console.error(`Globaler ${isFatal ? 'fataler ' : ''}Fehler:`, error);
	};

	// Registriere die Handler, wenn wir in einer React Native-Umgebung sind
	if (typeof global !== 'undefined' && global.hasOwnProperty('ErrorUtils')) {
		// @ts-ignore - ErrorUtils existiert in React Native, aber nicht in TypeScript-Definitionen
		global.ErrorUtils.setGlobalHandler(handleGlobalError);
	}

	// Für Versprechen-Fehler
	if (typeof global.addEventListener === 'function') {
		global.addEventListener('unhandledrejection', handlePromiseRejection);
	}
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
		backgroundColor: '#f8f9fa',
	},
	title: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 10,
		color: '#dc3545',
	},
	errorText: {
		fontSize: 16,
		marginBottom: 10,
		color: '#343a40',
	},
	stackText: {
		fontSize: 14,
		color: '#6c757d',
	},
});

export default ErrorBoundary;
