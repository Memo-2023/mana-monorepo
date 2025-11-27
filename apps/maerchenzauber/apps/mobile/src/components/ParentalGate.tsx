import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Modal,
	TouchableOpacity,
	TextInput,
	KeyboardAvoidingView,
	Platform,
} from 'react-native';

interface ParentalGateProps {
	visible: boolean;
	onSuccess: () => void;
	onCancel: () => void;
	title?: string;
	message?: string;
}

interface MathProblem {
	num1: number;
	num2: number;
	answer: number;
}

const generateMathProblem = (): MathProblem => {
	const num1 = Math.floor(Math.random() * 10) + 1;
	const num2 = Math.floor(Math.random() * 10) + 1;
	return { num1, num2, answer: num1 + num2 };
};

/**
 * ParentalGate Component
 *
 * Implements Apple's parental gate requirement for Kids Category apps.
 * Shows a simple math problem that adults can solve but young children cannot.
 *
 * Required before:
 * - External links (email, web browser)
 * - In-app purchases
 * - Any commerce activities
 */
export const ParentalGate: React.FC<ParentalGateProps> = ({
	visible,
	onSuccess,
	onCancel,
	title = 'Elternbestätigung',
	message = 'Um fortzufahren, löse bitte diese einfache Rechenaufgabe:',
}) => {
	const [answer, setAnswer] = useState('');
	const [error, setError] = useState(false);
	const [mathProblem, setMathProblem] = useState<MathProblem>(generateMathProblem());

	// Generate a new math problem each time the gate becomes visible
	useEffect(() => {
		if (visible) {
			setMathProblem(generateMathProblem());
			setAnswer('');
			setError(false);
		}
	}, [visible]);

	const handleSubmit = () => {
		const userAnswer = parseInt(answer, 10);

		if (userAnswer === mathProblem.answer) {
			setAnswer('');
			setError(false);
			onSuccess();
		} else {
			setError(true);
			// Clear error after 2 seconds
			setTimeout(() => setError(false), 2000);
		}
	};

	const handleCancel = () => {
		setAnswer('');
		setError(false);
		onCancel();
	};

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={styles.overlay}
			>
				<View style={styles.container}>
					<View style={styles.content}>
						<Text style={styles.title}>{title}</Text>
						<Text style={styles.message}>{message}</Text>

						<View style={styles.problemContainer}>
							<Text style={styles.problem}>
								{mathProblem.num1} + {mathProblem.num2} = ?
							</Text>
						</View>

						<TextInput
							style={[styles.input, error && styles.inputError]}
							value={answer}
							onChangeText={setAnswer}
							keyboardType="number-pad"
							placeholder="Antwort"
							placeholderTextColor="#999"
							autoFocus
							onSubmitEditing={handleSubmit}
						/>

						{error && (
							<Text style={styles.errorText}>Falsche Antwort. Bitte versuche es erneut.</Text>
						)}

						<View style={styles.buttonContainer}>
							<TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
								<Text style={styles.cancelButtonText}>Abbrechen</Text>
							</TouchableOpacity>

							<TouchableOpacity style={[styles.button, styles.submitButton]} onPress={handleSubmit}>
								<Text style={styles.submitButtonText}>Weiter</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
};

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.7)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	container: {
		width: '85%',
		maxWidth: 400,
	},
	content: {
		backgroundColor: '#fff',
		borderRadius: 20,
		padding: 24,
		alignItems: 'center',
	},
	title: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#333',
		marginBottom: 12,
		textAlign: 'center',
	},
	message: {
		fontSize: 16,
		color: '#666',
		marginBottom: 24,
		textAlign: 'center',
	},
	problemContainer: {
		backgroundColor: '#f5f5f5',
		borderRadius: 12,
		padding: 20,
		marginBottom: 20,
		width: '100%',
	},
	problem: {
		fontSize: 28,
		fontWeight: 'bold',
		color: '#333',
		textAlign: 'center',
	},
	input: {
		width: '100%',
		height: 50,
		borderWidth: 2,
		borderColor: '#ddd',
		borderRadius: 12,
		paddingHorizontal: 16,
		fontSize: 18,
		marginBottom: 16,
		textAlign: 'center',
		backgroundColor: '#fff',
	},
	inputError: {
		borderColor: '#ff3b30',
	},
	errorText: {
		color: '#ff3b30',
		fontSize: 14,
		marginBottom: 16,
		textAlign: 'center',
	},
	buttonContainer: {
		flexDirection: 'row',
		gap: 12,
		width: '100%',
	},
	button: {
		flex: 1,
		height: 50,
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
	},
	cancelButton: {
		backgroundColor: '#f5f5f5',
	},
	cancelButtonText: {
		fontSize: 16,
		fontWeight: '600',
		color: '#666',
	},
	submitButton: {
		backgroundColor: '#007AFF',
	},
	submitButtonText: {
		fontSize: 16,
		fontWeight: '600',
		color: '#fff',
	},
});
