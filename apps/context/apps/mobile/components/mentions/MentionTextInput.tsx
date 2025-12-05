import React, { useState, useRef, useEffect, forwardRef, ForwardRefRenderFunction } from 'react';
import {
	TextInput,
	TextInputProps,
	View,
	NativeSyntheticEvent,
	TextInputSelectionChangeEventData,
	Platform,
	Dimensions,
	Text,
} from 'react-native';
import { Document, getDocuments } from '~/services/supabaseService';
import { MentionDropdown } from './MentionDropdown';
import { useTheme } from '~/utils/theme';

interface MentionTextInputProps extends TextInputProps {
	spaceId: string;
	onMentionInserted?: (documentId: string, documentTitle: string) => void;
}

const MentionTextInputBase: ForwardRefRenderFunction<TextInput, MentionTextInputProps> = (
	{ spaceId, value, onChangeText, onMentionInserted, ...props },
	ref
) => {
	const { mode } = useTheme();
	const isDark = mode === 'dark';
	// Erstelle einen lokalen Ref
	const localInputRef = useRef<TextInput>(null);

	// Kombiniere den lokalen Ref mit dem übergebenen Ref
	useEffect(() => {
		if (ref && localInputRef.current) {
			if (typeof ref === 'function') {
				ref(localInputRef.current);
			} else {
				ref.current = localInputRef.current;
			}
		}
	}, [ref]);

	// State for mention functionality
	const [mentionQuery, setMentionQuery] = useState<string | null>(null);
	const [mentionStartIndex, setMentionStartIndex] = useState<number>(-1);
	const [matchingDocuments, setMatchingDocuments] = useState<Document[]>([]);
	const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
	const [showDropdown, setShowDropdown] = useState(false);
	const [selection, setSelection] = useState<{ start: number; end: number } | undefined>(undefined);
	const [allDocuments, setAllDocuments] = useState<Document[]>([]);
	const [debugInfo, setDebugInfo] = useState<string>('');

	// Load all documents from the space
	useEffect(() => {
		const loadDocuments = async () => {
			try {
				console.log('Lade Dokumente für Space:', spaceId);
				const docs = await getDocuments(spaceId);
				console.log('Anzahl geladener Dokumente:', docs.length);
				setAllDocuments(docs);
			} catch (error) {
				console.error('Error loading documents:', error);
			}
		};

		if (spaceId) {
			loadDocuments();
		} else {
			console.warn('Kein spaceId vorhanden, kann keine Dokumente laden');
		}
	}, [spaceId]);

	// Handle text changes to detect mentions
	const handleChangeText = (text: string) => {
		if (onChangeText) {
			onChangeText(text);
		}

		// Suche nach [[ und extrahiere den Text danach
		const bracketIndex = text.lastIndexOf('[[');

		if (bracketIndex >= 0) {
			// Prüfe, ob nach [[ mindestens 2 Zeichen stehen
			const afterBracket = text.substring(bracketIndex + 2);
			setDebugInfo(`[[ gefunden bei ${bracketIndex}, Text danach: "${afterBracket}"`);

			// Prüfe, ob die schließende Klammer bereits vorhanden ist
			if (!afterBracket.includes(']]')) {
				if (afterBracket.length >= 1) {
					// Reduziert auf 1 Zeichen für frühere Anzeige
					// Extrahiere den Suchbegriff (alles nach [[ bis zum nächsten ]] oder Ende)
					const searchTerm = afterBracket;

					setMentionStartIndex(bracketIndex);
					setMentionQuery(searchTerm);

					// Suche nach passenden Dokumenten
					const filtered = allDocuments.filter((doc) =>
						doc.title.toLowerCase().includes(searchTerm.toLowerCase())
					);

					// Immer mindestens die ersten 5 Dokumente anzeigen, wenn der Suchbegriff kurz ist
					let documentsToShow = filtered;
					if (filtered.length === 0 && searchTerm.length <= 2) {
						documentsToShow = allDocuments.slice(0, 5);
					} else {
						documentsToShow = filtered.slice(0, 10); // Mehr Ergebnisse anzeigen (10 statt 5)
					}

					setDebugInfo(`Suche nach "${searchTerm}", ${documentsToShow.length} Dokumente angezeigt`);
					setMatchingDocuments(documentsToShow);
					setShowDropdown(true); // Immer anzeigen, auch wenn keine Ergebnisse
					calculateDropdownPosition();
					return;
				}
			}
		}

		// Abwärtskompatibilität: Suche nach @ und extrahiere den Text danach
		const atIndex = text.lastIndexOf('@');

		if (atIndex >= 0) {
			// Prüfe, ob nach dem @ mindestens 3 Zeichen stehen
			const afterAt = text.substring(atIndex + 1);
			setDebugInfo(`@ gefunden bei ${atIndex}, Text danach: "${afterAt}"`);

			if (afterAt.length >= 3) {
				// Extrahiere den Suchbegriff (alles nach @ bis zum nächsten Leerzeichen oder Ende)
				const searchTerm = afterAt.split(/\s/)[0];

				if (searchTerm.length >= 3) {
					setMentionStartIndex(atIndex);
					setMentionQuery(searchTerm);

					// Suche nach passenden Dokumenten
					const filtered = allDocuments.filter((doc) =>
						doc.title.toLowerCase().includes(searchTerm.toLowerCase())
					);

					setDebugInfo(`Suche nach "${searchTerm}", ${filtered.length} Dokumente gefunden`);
					setMatchingDocuments(filtered.slice(0, 5)); // Limit to 5 results
					setShowDropdown(filtered.length > 0);
					calculateDropdownPosition();
					return;
				}
			}
		}

		// Wenn weder [[ noch @ gefunden wurde, Dropdown trotzdem sichtbar lassen
		// Wir blenden das Dropdown nicht automatisch aus
		// if (showDropdown) {
		//   cancelMention();
		// }
	};

	// Focus handler
	const handleFocus = () => {
		// Nichts tun, wenn der Fokus erhalten wird
	};

	// Blur handler
	const handleBlur = () => {
		// Dropdown nicht ausblenden, wenn der Fokus verloren geht
		// Es bleibt sichtbar, bis der Benutzer eine Auswahl trifft
		console.log('Textfeld hat Fokus verloren, Dropdown bleibt sichtbar');
		// Wir rufen cancelMention nicht auf, damit das Dropdown sichtbar bleibt
	};

	// Start tracking a mention
	const startMention = (index: number) => {
		console.log('Starte Mention-Tracking bei Index:', index);
		setMentionStartIndex(index);
		setMentionQuery('');
		calculateDropdownPosition();
	};

	// Cancel mention mode
	const cancelMention = () => {
		// Setze nur die Mention-Daten zurück, aber lasse das Dropdown geöffnet
		setMentionStartIndex(-1);
		setMentionQuery('');
		setDebugInfo('Mention-Modus beendet, Dropdown bleibt geöffnet');
		// Dropdown bleibt sichtbar, bis der Benutzer eine Auswahl trifft
		// setShowDropdown(false); // Auskommentiert, damit das Dropdown sichtbar bleibt
	};

	// Handle selection changes
	const handleSelectionChange = (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
		setSelection(e.nativeEvent.selection);

		// If we move the cursor away from the mention area, cancel the mention
		if (
			mentionQuery !== null &&
			(e.nativeEvent.selection.start < mentionStartIndex ||
				e.nativeEvent.selection.start > mentionStartIndex + mentionQuery.length + 1)
		) {
			cancelMention();
		}
	};

	// Dropdown-Position berechnen, damit es unter dem Cursor erscheint
	const calculateDropdownPosition = () => {
		console.log('Berechne Dropdown-Position unter dem Cursor');

		// Versuche, die Position des Cursors zu ermitteln
		if (localInputRef.current) {
			try {
				// Auf Web-Plattformen können wir die Cursor-Position ermitteln
				if (Platform.OS === 'web') {
					// Wir müssen auf die native DOM-Methoden zugreifen
					// @ts-ignore - Wir wissen, dass wir auf Web sind
					const input = localInputRef.current._reactInternals?.stateNode;

					if (input) {
						// Ermittle die Cursor-Position im Textfeld
						const cursorPosition = input.selectionStart;

						// Ermittle die Zeile, in der sich der Cursor befindet
						const text = value || '';
						const lines = text.substring(0, cursorPosition).split('\n');
						const currentLine = lines.length;

						// Berechne die vertikale Position basierend auf der Zeilennummer
						// Annahme: Jede Zeile ist etwa 24px hoch
						const lineHeight = 24;
						const verticalOffset = (currentLine - 1) * lineHeight;

						// Ermittle die Scroll-Position des TextInputs
						const scrollTop = input.scrollTop || 0;

						// Berechne die absolute Position des Cursors im Dokument
						const cursorTop = verticalOffset - scrollTop + 50; // +50 für Padding und Header

						// Setze die Position des Dropdowns unter dem Cursor
						setDropdownPosition({
							top: cursorTop + lineHeight, // Unter der aktuellen Zeile
							left: 20, // Ein wenig eingerückt
						});

						console.log(
							`Dropdown-Position: Zeile ${currentLine}, Position: ${cursorTop}px, Scroll: ${scrollTop}px`
						);
						return;
					}
				}

				// Fallback: Verwende die Position des Mentions im Text
				if (mentionStartIndex >= 0 && value) {
					const textBeforeMention = value.substring(0, mentionStartIndex);
					const lines = textBeforeMention.split('\n');
					const currentLine = lines.length;
					const lineHeight = 24;

					// Berechne die Position relativ zum sichtbaren Bereich
					// @ts-ignore - Wir wissen, dass wir auf Web sind
					const scrollTop = localInputRef.current._reactInternals?.stateNode?.scrollTop || 0;
					const verticalOffset = (currentLine - 1) * lineHeight;
					const cursorTop = verticalOffset - scrollTop + 50; // +50 für Padding und Header

					setDropdownPosition({
						top: cursorTop + lineHeight,
						left: 20,
					});

					console.log(
						`Fallback-Position: Zeile ${currentLine}, Position: ${cursorTop}px, Scroll: ${scrollTop}px`
					);
					return;
				}
			} catch (error) {
				console.error('Fehler bei der Berechnung der Dropdown-Position:', error);
			}
		}

		// Fallback: Feste Position, wenn keine Berechnung möglich ist
		setDropdownPosition({ top: 100, left: 20 });
	};

	// Handle document selection from dropdown
	const handleSelectDocument = (document: Document) => {
		// Verwende die kurze ID, wenn verfügbar, sonst die UUID
		const documentId = document.short_id || document.id;
		console.log('Dokument ausgewählt:', document.title, 'ID:', documentId);

		// Markdown-Link-Format: [Titel](ID) für beide Formate
		const linkText = `[${document.title}](${documentId})`;

		// Sicherstellen, dass value definiert ist
		if (!value) {
			// Wenn kein Text vorhanden ist, füge einfach den Link ein
			if (onChangeText) {
				onChangeText(linkText);
			}
			return;
		}

		// Suche nach [[ oder @ im Text
		const bracketIndex = value.lastIndexOf('[[');
		const atIndex = value.lastIndexOf('@');

		// Prüfe, welches Format verwendet wurde
		if (bracketIndex >= 0 && (atIndex < 0 || bracketIndex > atIndex)) {
			// [[-Format wurde verwendet
			// Extrahiere den Teil vor [[
			const beforeBracket = value.substring(0, bracketIndex);

			// Finde das Ende des [[-Blocks (entweder ]] oder das Ende des Textes)
			let endBracketIndex = value.indexOf(']]', bracketIndex);
			if (endBracketIndex < 0) {
				// Wenn kein ]] gefunden wurde, suche nach dem nächsten Leerzeichen oder Zeilenumbruch
				const nextSpace = value.indexOf(' ', bracketIndex);
				const nextNewline = value.indexOf('\n', bracketIndex);

				if (nextSpace >= 0 && (nextNewline < 0 || nextSpace < nextNewline)) {
					endBracketIndex = nextSpace;
				} else if (nextNewline >= 0) {
					endBracketIndex = nextNewline;
				} else {
					// Wenn weder Leerzeichen noch Zeilenumbruch gefunden wurde, verwende das Ende des Textes
					endBracketIndex = value.length;
				}
			} else {
				// Wenn ]] gefunden wurde, schließe es mit ein
				endBracketIndex += 2;
			}

			// Extrahiere den Teil nach dem [[-Block
			const afterBracket = value.substring(endBracketIndex);

			// Neuer Text mit eingefügtem Link
			const newText = beforeBracket + linkText + afterBracket;

			console.log('Neuer Text mit Link (Bracket-Format):', newText);

			// Text aktualisieren
			if (onChangeText) {
				onChangeText(newText);
			}
		} else if (atIndex >= 0) {
			// @-Format wurde verwendet
			// Extrahiere den Teil vor @
			const beforeAt = value.substring(0, atIndex);

			// Finde das Ende des @-Blocks (nächstes Leerzeichen oder Ende des Textes)
			let endAtIndex;
			const nextSpace = value.indexOf(' ', atIndex);
			const nextNewline = value.indexOf('\n', atIndex);

			if (nextSpace >= 0 && (nextNewline < 0 || nextSpace < nextNewline)) {
				endAtIndex = nextSpace;
			} else if (nextNewline >= 0) {
				endAtIndex = nextNewline;
			} else {
				// Wenn weder Leerzeichen noch Zeilenumbruch gefunden wurde, verwende das Ende des Textes
				endAtIndex = value.length;
			}

			// Extrahiere den Teil nach dem @-Block
			const afterAt = value.substring(endAtIndex);

			// Neuer Text mit eingefügtem Link
			const newText = beforeAt + linkText + afterAt;

			console.log('Neuer Text mit Link (At-Format):', newText);

			// Text aktualisieren
			if (onChangeText) {
				onChangeText(newText);
			}
		} else {
			// Weder [[ noch @ gefunden, füge den Link am Ende ein
			const newText = (value || '') + linkText;
			if (onChangeText) {
				onChangeText(newText);
			}
		}

		// Dropdown ausblenden
		setShowDropdown(false);
		setMentionQuery(null);
		setMentionStartIndex(-1);

		// Notify parent component
		if (onMentionInserted) {
			onMentionInserted(document.id, document.title);
		}

		// Einfacherer Ansatz: Wir verwenden die vorhandene Logik zum Ersetzen des Textes
		// und stellen nur sicher, dass der Fokus erhalten bleibt
		if (value) {
			// Suche nach [[ oder @ im Text
			const bracketIndex = value.lastIndexOf('[[');
			const atIndex = value.lastIndexOf('@');

			let newText = value; // Standardmäßig den aktuellen Text beibehalten

			// Prüfe, welches Format verwendet wurde
			if (bracketIndex >= 0 && (atIndex < 0 || bracketIndex > atIndex)) {
				// [[-Format wurde verwendet
				const beforeBracket = value.substring(0, bracketIndex);

				// Finde das Ende des [[-Blocks
				let endBracketIndex = value.indexOf(']]', bracketIndex);
				if (endBracketIndex < 0) {
					// Wenn kein ]] gefunden wurde, suche nach dem nächsten Leerzeichen oder Zeilenumbruch
					const nextSpace = value.indexOf(' ', bracketIndex);
					const nextNewline = value.indexOf('\n', bracketIndex);

					if (nextSpace >= 0 && (nextNewline < 0 || nextSpace < nextNewline)) {
						endBracketIndex = nextSpace;
					} else if (nextNewline >= 0) {
						endBracketIndex = nextNewline;
					} else {
						// Wenn weder Leerzeichen noch Zeilenumbruch gefunden wurde, verwende das Ende des Textes
						endBracketIndex = value.length;
					}
				} else {
					// Wenn ]] gefunden wurde, schließe es mit ein
					endBracketIndex += 2;
				}

				// Extrahiere den Teil nach dem [[-Block
				const afterBracket = value.substring(endBracketIndex);

				// Neuer Text mit eingefügtem Link
				newText = beforeBracket + linkText + afterBracket;
			} else if (atIndex >= 0) {
				// @-Format wurde verwendet
				const beforeAt = value.substring(0, atIndex);

				// Finde das Ende des @-Blocks
				let endAtIndex;
				const nextSpace = value.indexOf(' ', atIndex);
				const nextNewline = value.indexOf('\n', atIndex);

				if (nextSpace >= 0 && (nextNewline < 0 || nextSpace < nextNewline)) {
					endAtIndex = nextSpace;
				} else if (nextNewline >= 0) {
					endAtIndex = nextNewline;
				} else {
					// Wenn weder Leerzeichen noch Zeilenumbruch gefunden wurde, verwende das Ende des Textes
					endAtIndex = value.length;
				}

				// Extrahiere den Teil nach dem @-Block
				const afterAt = value.substring(endAtIndex);

				// Neuer Text mit eingefügtem Link
				newText = beforeAt + linkText + afterAt;
			} else {
				// Weder [[ noch @ gefunden, füge den Link am Ende ein
				newText = (value || '') + linkText;
			}

			// Text aktualisieren
			if (onChangeText) {
				onChangeText(newText);
			}
		}

		// Fokus auf das Eingabefeld setzen mit einer Verzögerung
		// Dies ist wichtig, damit der Fokus nach dem Rendern wiederhergestellt wird
		const refocusInput = () => {
			if (localInputRef.current) {
				localInputRef.current.focus();
			} else {
				// Wenn das Ref noch nicht verfügbar ist, versuche es erneut
				setTimeout(refocusInput, 10);
			}
		};

		// Starte den Refokus-Prozess
		setTimeout(refocusInput, 50);

		console.log('Mention eingefügt:', linkText);
	};

	// Debug-Ausgaben
	useEffect(() => {
		if (showDropdown) {
			console.log('Dropdown wird angezeigt mit', matchingDocuments.length, 'Dokumenten');
		}
	}, [showDropdown, matchingDocuments]);

	return (
		<View style={{ flex: 1, position: 'relative' }}>
			<TextInput
				ref={localInputRef}
				value={value}
				onChangeText={handleChangeText}
				onSelectionChange={handleSelectionChange}
				{...props}
			/>

			{/* Debug-Anzeige (nur während der Entwicklung) */}
			{__DEV__ && debugInfo && (
				<View
					style={{
						position: 'absolute',
						top: 0,
						right: 0,
						backgroundColor: 'rgba(0,0,0,0.7)',
						padding: 5,
					}}
				>
					<Text style={{ color: 'white', fontSize: 10 }}>{debugInfo}</Text>
				</View>
			)}

			{/* Dropdown als Banner oben auf der Seite */}
			{showDropdown && (
				<View
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						zIndex: 9999,
					}}
				>
					<MentionDropdown
						documents={matchingDocuments}
						onSelectDocument={handleSelectDocument}
						visible={true}
						fullWidth={true}
					/>
				</View>
			)}
		</View>
	);
};

export const MentionTextInput = forwardRef(MentionTextInputBase);
