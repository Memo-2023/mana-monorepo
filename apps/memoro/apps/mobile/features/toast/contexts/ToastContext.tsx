import React, { createContext, useContext, ReactNode } from 'react';
import { ToastContextType } from '../types';
import { useToastActions } from '../store/toastStore';
import ToastContainer from '../components/ToastContainer';

const ToastContext = createContext<ToastContextType | null>(null);

interface ToastProviderProps {
	children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
	const toastActions = useToastActions();

	const contextValue: ToastContextType = {
		showToast: toastActions.showToast,
		hideToast: toastActions.hideToast,
		updateToast: toastActions.updateToast,
		showSuccess: toastActions.showSuccess,
		showError: toastActions.showError,
		showWarning: toastActions.showWarning,
		showInfo: toastActions.showInfo,
		showLoading: toastActions.showLoading,
	};

	return (
		<ToastContext.Provider value={contextValue}>
			{children}
			<ToastContainer />
		</ToastContext.Provider>
	);
};

export const useToast = (): ToastContextType => {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error('useToast must be used within a ToastProvider');
	}
	return context;
};
