import { useState, useEffect } from 'react';
import { supabase } from '~/utils/supabase';
import { Text, TextData } from '~/types/database';

export const useTexts = () => {
	const [texts, setTexts] = useState<Text[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetchTexts();

		// Realtime Subscription
		const subscription = supabase
			.channel('texts_changes')
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'texts',
				},
				(payload) => {
					if (payload.eventType === 'INSERT') {
						// Check if text already exists to avoid duplicates
						setTexts((prev) => {
							const exists = prev.some((text) => text.id === payload.new.id);
							if (exists) return prev;
							return [payload.new as Text, ...prev];
						});
					} else if (payload.eventType === 'UPDATE') {
						setTexts((prev) =>
							prev.map((text) => (text.id === payload.new.id ? (payload.new as Text) : text))
						);
					} else if (payload.eventType === 'DELETE') {
						setTexts((prev) => prev.filter((text) => text.id !== payload.old.id));
					}
				}
			)
			.subscribe();

		return () => {
			subscription.unsubscribe();
		};
	}, []);

	const fetchTexts = async () => {
		try {
			setLoading(true);
			const { data, error } = await supabase
				.from('texts')
				.select('*')
				.order('updated_at', { ascending: false });

			if (error) throw error;
			setTexts(data || []);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
		} finally {
			setLoading(false);
		}
	};

	const createText = async (title: string, content: string, initialData?: Partial<TextData>) => {
		try {
			// Get current user
			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (!user) {
				throw new Error('Benutzer nicht eingeloggt');
			}

			const { data, error } = await supabase
				.from('texts')
				.insert({
					title,
					content,
					user_id: user.id, // Explicitly set user_id
					data: {
						tts: { speed: 1.0, voice: 'de-DE-Neural2-A' },
						tags: [],
						stats: { playCount: 0, totalTime: 0, completed: false },
						...initialData,
					},
				})
				.select()
				.single();

			if (error) throw error;

			// Refresh the texts list to ensure we have the latest data
			await fetchTexts();

			return { data, error: null };
		} catch (err) {
			return {
				data: null,
				error: err instanceof Error ? err.message : 'Fehler beim Erstellen',
			};
		}
	};

	const updateText = async (textId: string, updates: Partial<Text>) => {
		try {
			const { data, error } = await supabase
				.from('texts')
				.update(updates)
				.eq('id', textId)
				.select()
				.single();

			if (error) throw error;
			return { data, error: null };
		} catch (err) {
			return {
				data: null,
				error: err instanceof Error ? err.message : 'Fehler beim Aktualisieren',
			};
		}
	};

	const deleteText = async (textId: string) => {
		try {
			const { error } = await supabase.from('texts').delete().eq('id', textId);

			if (error) throw error;
			return { error: null };
		} catch (err) {
			return {
				error: err instanceof Error ? err.message : 'Fehler beim Löschen',
			};
		}
	};

	const updatePosition = async (textId: string, position: number) => {
		const text = texts.find((t) => t.id === textId);
		if (!text) return { error: 'Text nicht gefunden' };

		return updateText(textId, {
			data: {
				...text.data,
				tts: {
					...text.data.tts,
					lastPosition: position,
					lastPlayed: new Date().toISOString(),
				},
			},
		});
	};

	const getTextsByTag = (tag: string) => {
		return texts.filter((text) => text.data.tags?.includes(tag));
	};

	const getAllTags = () => {
		const tagSet = new Set<string>();
		texts.forEach((text) => {
			text.data.tags?.forEach((tag) => tagSet.add(tag));
		});
		return Array.from(tagSet).sort();
	};

	return {
		texts,
		loading,
		error,
		createText,
		updateText,
		deleteText,
		updatePosition,
		getTextsByTag,
		getAllTags,
		refetch: fetchTexts,
	};
};
