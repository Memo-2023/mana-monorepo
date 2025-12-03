import {
	collection,
	query,
	where,
	getDocs,
	addDoc,
	updateDoc,
	deleteDoc,
	doc,
	getDoc,
	orderBy,
	limit,
	writeBatch,
} from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { type Deck, type Slide } from '../types/models';

// Decks
export const getUserDecks = async (userId: string): Promise<Deck[]> => {
	console.log('[Firestore] Getting all decks for user:', userId);

	try {
		const decksRef = collection(db, 'decks');
		const q = query(decksRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));

		const querySnapshot = await getDocs(q);
		const decks = querySnapshot.docs.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
				...data,
				createdAt: data.createdAt?.toDate() || new Date(),
				updatedAt: data.updatedAt?.toDate() || new Date(),
			} as Deck;
		});

		console.log('[Firestore] Retrieved decks:', decks.length);
		return decks;
	} catch (error) {
		console.error('[Firestore] Error getting decks:', error);
		throw error;
	}
};

export const createDeck = async (deckData: Partial<Deck>): Promise<Deck> => {
	console.log('[Firestore] Creating new deck:', deckData);

	try {
		if (!auth.currentUser) {
			throw new Error('No authenticated user');
		}

		const now = new Date();
		const newDeck = {
			...deckData,
			userId: auth.currentUser.uid,
			createdAt: now,
			updatedAt: now,
			sharing: {
				isPublic: false,
				collaborators: {},
			},
		};

		const docRef = await addDoc(collection(db, 'decks'), newDeck);

		return {
			id: docRef.id,
			...newDeck,
		} as Deck;
	} catch (error) {
		console.error('[Firestore] Error creating deck:', error);
		throw error;
	}
};

export const getDeck = async (deckId: string): Promise<Deck> => {
	console.log('[Firestore] Getting deck:', deckId);

	try {
		const deckRef = doc(db, 'decks', deckId);
		const deckDoc = await getDoc(deckRef);

		if (!deckDoc.exists()) {
			throw new Error('Deck not found');
		}

		const data = deckDoc.data();
		return {
			id: deckDoc.id,
			...data,
			createdAt: data.createdAt?.toDate() || new Date(),
			updatedAt: data.updatedAt?.toDate() || new Date(),
		} as Deck;
	} catch (error) {
		console.error('[Firestore] Error getting deck:', error);
		throw error;
	}
};

export const deleteDeck = async (deckId: string): Promise<void> => {
	try {
		console.log('[Firestore] Deleting deck:', deckId);
		const deckRef = doc(db, 'decks', deckId);
		await deleteDoc(deckRef);
		console.log('[Firestore] Deck deleted successfully');
	} catch (error) {
		console.error('[Firestore] Error deleting deck:', error);
		throw error;
	}
};

// Slides
export const getDeckSlides = async (deckId: string): Promise<Slide[]> => {
	console.log('[Firestore] Getting slides for deck:', deckId);

	try {
		const slidesRef = collection(db, 'decks', deckId, 'slides');
		const q = query(slidesRef, orderBy('order', 'asc'));
		const querySnapshot = await getDocs(q);

		const slides = querySnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
			createdAt: doc.data().createdAt?.toDate() || new Date(),
			updatedAt: doc.data().updatedAt?.toDate() || new Date(),
		})) as Slide[];

		console.log('[Firestore] Retrieved slides:', slides.length);
		return slides;
	} catch (error) {
		console.error('[Firestore] Error getting slides:', error);
		throw error;
	}
};

export const createSlide = async (slideData: Partial<Slide>): Promise<Slide> => {
	console.log('[Firestore] Creating new slide:', slideData);

	if (!slideData.deckId) {
		throw new Error('deckId is required to create a slide');
	}

	try {
		const slidesRef = collection(db, 'decks', slideData.deckId, 'slides');
		const now = new Date();

		// Get the current highest order
		const q = query(slidesRef, orderBy('order', 'desc'), limit(1));
		const querySnapshot = await getDocs(q);
		const highestOrder = querySnapshot.empty ? 0 : querySnapshot.docs[0].data().order;

		const newSlide = {
			...slideData,
			order: highestOrder + 1,
			createdAt: now,
			updatedAt: now,
		};

		const docRef = await addDoc(slidesRef, newSlide);
		return {
			id: docRef.id,
			...newSlide,
		} as Slide;
	} catch (error) {
		console.error('[Firestore] Error creating slide:', error);
		throw error;
	}
};

export const updateSlide = async (slideId: string, slideData: Partial<Slide>): Promise<void> => {
	console.log('[Firestore] Updating slide:', slideId, slideData);

	if (!slideData.deckId) {
		throw new Error('deckId is required to update a slide');
	}

	try {
		const slideRef = doc(db, 'decks', slideData.deckId, 'slides', slideId);
		await updateDoc(slideRef, {
			...slideData,
			updatedAt: new Date(),
		});
	} catch (error) {
		console.error('[Firestore] Error updating slide:', error);
		throw error;
	}
};

export const deleteSlide = async (slideId: string, deckId: string): Promise<void> => {
	console.log('[Firestore] Deleting slide:', slideId);

	try {
		const slideRef = doc(db, 'decks', deckId, 'slides', slideId);
		await deleteDoc(slideRef);
	} catch (error) {
		console.error('[Firestore] Error deleting slide:', error);
		throw error;
	}
};

export const reorderSlide = async (
	slideId: string,
	newOrder: number,
	deckId: string
): Promise<void> => {
	console.log('[Firestore] Reordering slide:', slideId, 'to order:', newOrder);

	try {
		const slidesRef = collection(db, 'decks', deckId, 'slides');
		const batch = writeBatch(db);
		const now = new Date();

		// Get all slides in the deck
		const q = query(slidesRef, orderBy('order', 'asc'));
		const querySnapshot = await getDocs(q);
		const slides = querySnapshot.docs;

		// Find the current slide and its order
		const currentSlide = slides.find((doc) => doc.id === slideId);
		if (!currentSlide) {
			throw new Error('Slide not found');
		}
		const currentOrder = currentSlide.data().order;

		// Update orders
		slides.forEach((doc) => {
			const slideOrder = doc.data().order;
			if (doc.id === slideId) {
				// Update the target slide
				batch.update(doc.ref, {
					order: newOrder,
					updatedAt: now,
				});
			} else if (newOrder > currentOrder && slideOrder > currentOrder && slideOrder <= newOrder) {
				// Move slides up
				batch.update(doc.ref, {
					order: slideOrder - 1,
					updatedAt: now,
				});
			} else if (newOrder < currentOrder && slideOrder >= newOrder && slideOrder < currentOrder) {
				// Move slides down
				batch.update(doc.ref, {
					order: slideOrder + 1,
					updatedAt: now,
				});
			}
		});

		await batch.commit();
		console.log('[Firestore] Reorder operation completed successfully');
	} catch (error) {
		console.error('[Firestore] Error reordering slide:', error);
		throw error;
	}
};

export const migrateDecksToNewSchema = async (userId: string) => {
	console.log('[Firestore] Migrating decks to new schema for user:', userId);

	try {
		const decksRef = collection(db, 'decks');
		const q = query(decksRef, where('userId', '==', userId));

		const querySnapshot = await getDocs(q);
		const batch = writeBatch(db);
		let updateCount = 0;

		querySnapshot.docs.forEach((docSnapshot) => {
			const deckData = docSnapshot.data();
			if (!deckData.sharing) {
				batch.update(docSnapshot.ref, {
					sharing: {
						isPublic: false,
						collaborators: {},
					},
				});
				updateCount++;
			}
		});

		if (updateCount > 0) {
			await batch.commit();
			console.log(`[Firestore] Successfully migrated ${updateCount} decks`);
		} else {
			console.log('[Firestore] No decks needed migration');
		}
	} catch (error) {
		console.error('[Firestore] Error migrating decks:', error);
		throw error;
	}
};
