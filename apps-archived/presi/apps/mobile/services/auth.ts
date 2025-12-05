import {
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	signOut,
	sendPasswordResetEmail,
	onAuthStateChanged,
	User,
} from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const loginUser = async (email: string, password: string): Promise<User> => {
	const userCredential = await signInWithEmailAndPassword(auth, email, password);
	return userCredential.user;
};

export const registerUser = async (email: string, password: string): Promise<User> => {
	const userCredential = await createUserWithEmailAndPassword(auth, email, password);

	// Create user document in Firestore
	await setDoc(doc(db, 'users', userCredential.user.uid), {
		email: userCredential.user.email,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	return userCredential.user;
};

export const logoutUser = async (): Promise<void> => {
	await signOut(auth);
};

export const resetPassword = async (email: string): Promise<void> => {
	await sendPasswordResetEmail(auth, email);
};

export const getCurrentUser = (): User | null => {
	return auth.currentUser;
};

export const onAuthStateChange = (callback: (user: User | null) => void): (() => void) => {
	return onAuthStateChanged(auth, callback);
};

export const isAuthenticated = (): boolean => {
	return auth.currentUser !== null;
};
