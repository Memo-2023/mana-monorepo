import React from 'react';
import { View, StyleSheet } from 'react-native';
import Toast from './Toast.simple';
import { useToastStore } from '../store/toastStore';

const ToastContainer: React.FC = () => {
	const { toasts, removeToast } = useToastStore();

	if (toasts.length === 0) {
		return null;
	}

	// Group toasts by position
	const topToasts = toasts.filter((toast) => !toast.position || toast.position === 'top');
	const bottomToasts = toasts.filter((toast) => toast.position === 'bottom');

	return (
		<>
			{/* Top Toasts */}
			{topToasts.length > 0 && (
				<View
					style={[
						styles.container,
						styles.topContainer,
						{
							top: 120, // Fixed 120px from top to appear below header (adjusted for larger screens)
						},
					]}
					pointerEvents="box-none"
				>
					{topToasts.filter(Boolean).map((toast) =>
						toast && toast.id ? (
							<Toast
								key={toast.id}
								toast={toast}
								onDismiss={removeToast}
								onAction={() => {
									// Optional: dismiss after action
									if (toast.onDismiss) {
										toast.onDismiss();
									}
								}}
							/>
						) : null
					)}
				</View>
			)}

			{/* Bottom Toasts */}
			{bottomToasts.length > 0 && (
				<View
					style={[
						styles.container,
						styles.bottomContainer,
						{
							bottom: 100, // Fixed 100px from bottom
						},
					]}
					pointerEvents="box-none"
				>
					{bottomToasts.filter(Boolean).map((toast) =>
						toast && toast.id ? (
							<Toast
								key={toast.id}
								toast={toast}
								onDismiss={removeToast}
								onAction={() => {
									// Optional: dismiss after action
									if (toast.onDismiss) {
										toast.onDismiss();
									}
								}}
							/>
						) : null
					)}
				</View>
			)}
		</>
	);
};

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		left: 0,
		right: 0,
		zIndex: 99999,
		elevation: 99999,
		alignItems: 'center', // Center toasts horizontally
		paddingHorizontal: 16, // Add horizontal padding to all containers
	},
	topContainer: {
		// Toasts appear from top to bottom
	},
	bottomContainer: {
		// Toasts appear from bottom to top (reverse order)
		flexDirection: 'column-reverse',
	},
});

export default ToastContainer;
