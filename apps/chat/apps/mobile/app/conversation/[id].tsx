import React, { useState, useEffect, useRef } from 'react';
import {
	View,
	StyleSheet,
	KeyboardAvoidingView,
	Platform,
	Alert,
	TouchableOpacity,
	SafeAreaView,
	Text,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import ChatHeader from '../../components/ChatHeader';
import MessageList from '../../components/MessageList';
import MessageInput, { MessageInputRef } from '../../components/MessageInput';
import CustomDrawer from '../../components/CustomDrawer';
import DocumentPanel from '../../components/DocumentPanel';
import DocumentVersions from '../../components/DocumentVersions';

// Import der Konversations- und OpenAI-Services
import {
	createConversation,
	addMessage,
	getMessages,
	sendMessageAndGetResponse,
	Message as DbMessage,
} from '../../services/conversation';
import { conversationApi } from '../../services/api';
import {
	Document,
	createDocument,
	createDocumentVersion,
	getLatestDocument,
	getAllDocumentVersions,
	hasDocument,
	deleteDocumentVersion,
} from '../../services/document';
import { useAuth } from '../../context/AuthProvider';

// Typdefinition für die Nachrichten in der UI
type UIMessage = {
	id: string;
	text: string;
	sender: 'user' | 'ai';
	timestamp: Date;
	isLoading?: boolean;
};

// Konvertiere Datenbank-Nachrichten in UI-Nachrichten
function convertDbToUiMessages(dbMessages: DbMessage[]): UIMessage[] {
	return dbMessages.map((msg) => ({
		id: msg.id,
		text: msg.message_text,
		sender: msg.sender === 'assistant' ? 'ai' : (msg.sender as 'user'),
		timestamp: new Date(msg.created_at),
	}));
}

export default function ConversationScreen() {
	const { colors } = useTheme();
	const router = useRouter();
	const { user } = useAuth();
	// Hole Parameter aus URL und Query-String
	const params = useLocalSearchParams();
	const { id } = params;

	// Drawer (Seitenmenü) Status
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);

	// Extrahiere Modell-ID und andere Parameter
	const modelId = params.modelId || params.model_id;
	const mode = params.mode;
	const initialMessage = params.initialMessage || params.initial_message;
	const templateId = params.templateId || params.template_id;
	const documentMode = params.documentMode === 'true' || false;

	// Protokolliere alle Parameter für Debugging
	console.log('URL-Parameter erhalten:', JSON.stringify(params, null, 2));

	const conversationId = id as string;
	const isNewConversation = conversationId === 'new';
	const initialMsg = initialMessage as string | undefined;

	// Protokolliere spezifische Parameter
	console.log(
		`Verarbeite Konversation: id=${conversationId}, modelId=${modelId}, neu=${isNewConversation}, initialMsg=${initialMsg?.substring(0, 30)}`
	);

	const [messages, setMessages] = useState<UIMessage[]>([]);
	const [actualConversationId, setActualConversationId] = useState<string | null>(
		isNewConversation ? null : conversationId
	);
	const [isLoading, setIsLoading] = useState(false);
	const [modelName, setModelName] = useState('');
	const [modelData, setModelData] = useState<any>(null);
	const [conversationMode, setConversationMode] = useState((mode as string) || 'frei');
	const [userId, setUserId] = useState<string | null>(null);
	const [conversationTitle, setConversationTitle] = useState<string | undefined>(undefined);
	const messageInputRef = useRef<MessageInputRef>(null);

	// Dokumentmodus Zustände
	const [isDocumentMode, setIsDocumentMode] = useState<boolean>(documentMode);
	const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
	const [documentVersions, setDocumentVersions] = useState<Document[]>([]);
	const [isDocumentLoading, setIsDocumentLoading] = useState<boolean>(false);
	const [isVersionsModalVisible, setIsVersionsModalVisible] = useState<boolean>(false);

	// Setze userId vom AuthProvider
	useEffect(() => {
		if (user?.id) {
			setUserId(user.id);
		} else {
			// Fallback für Test-Zwecke
			setUserId('test-user-id');
		}
	}, [user]);

	// Lade das Modell
	useEffect(() => {
		const fetchModelData = async () => {
			try {
				console.log(
					`Model-Daten laden für id=${modelId || 'unbekannt'}, conv=${conversationId}, neu=${isNewConversation}`
				);

				// Wenn wir bereits eine modelId haben (aus der URL), laden wir dieses zuerst
				if (modelId && modelId !== 'undefined') {
					console.log('Lade Modell mit ID aus URL:', modelId);
					const response = await fetch(`/api/models`);
					const models = await response.json();
					const model = models.find((m: any) => m.id === modelId);

					if (model) {
						console.log(
							'★ Model-Daten aus URL-Parameter geladen:',
							model.name,
							'mit deployment:',
							model.parameters?.deployment
						);
						setModelName(model.name);
						setModelData(model);
						return; // Beende die Funktion, da wir das Modell bereits gefunden haben
					} else {
						console.warn('Modell mit ID aus URL nicht gefunden:', modelId);
					}
				}

				// Wenn kein URL-Modell gefunden wurde oder keins angegeben war,
				// hole die Konversation, um die Model-ID zu bekommen
				if (!isNewConversation && conversationId) {
					console.log('Hole Modell-ID aus Konversation:', conversationId);
					const conversationData = await conversationApi.getConversation(conversationId);

					if (conversationData && conversationData.modelId) {
						console.log('✓ Model-ID aus der Konversation geladen:', conversationData.modelId);
						// Setze das modelId, wenn wir es aus der Konversation bekommen haben
						const fetchedModelId = conversationData.modelId;

						// Setze den Titel aus der Konversation
						if (conversationData.title) {
							console.log('✓ Titel aus der Konversation geladen:', conversationData.title);
							setConversationTitle(conversationData.title);
						}

						// Hole jetzt das Modell mit der ID
						const response = await fetch(`/api/models`);
						const models = await response.json();
						const model = models.find((m: any) => m.id === fetchedModelId);

						if (model) {
							console.log('✓ Model-Daten aus Konversation geladen:', model.name);
							setModelName(model.name);
							setModelData(model);
						} else {
							console.warn('Modell mit ID aus Konversation nicht gefunden:', fetchedModelId);
						}
					} else {
						console.error('Fehler beim Laden der Konversation oder keine Model-ID gefunden');
					}
				}
			} catch (error) {
				console.error('Fehler beim Laden des Modells:', error);
			}
		};
		fetchModelData();
	}, [modelId, conversationId, isNewConversation]);

	// Lade Nachrichten für eine bestehende Konversation
	useEffect(() => {
		const loadExistingConversation = async () => {
			if (!isNewConversation && conversationId) {
				try {
					setIsLoading(true);
					const dbMessages = await getMessages(conversationId);
					if (dbMessages.length > 0) {
						setMessages(convertDbToUiMessages(dbMessages));
					}

					// Prüfe, ob es eine bestehende Konversation mit Dokumentmodus ist
					if (conversationId) {
						const convData = await conversationApi.getConversation(conversationId);

						if (convData && convData.documentMode) {
							setIsDocumentMode(true);
							await loadDocumentData(conversationId);
						}
					}
				} catch (error) {
					console.error('Fehler beim Laden der Konversation:', error);
				} finally {
					setIsLoading(false);
				}
			}
		};

		if (!isNewConversation) {
			loadExistingConversation();
		}
	}, [conversationId, isNewConversation]);

	// Funktion zum Laden der Dokumentdaten
	const loadDocumentData = async (convId: string) => {
		try {
			console.log(`[loadDocumentData] Lade Dokumentdaten für Konversation ${convId}`);
			setIsDocumentLoading(true);

			// Kurze Verzögerung zur Sicherstellung, dass DB-Transaktionen abgeschlossen sind
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Lade alle Dokumentversionen über den Service
			console.log('Lade alle Dokumentversionen über Backend API...');
			const versions = await getAllDocumentVersions(convId);

			console.log(`${versions.length} Dokumentversionen geladen`);
			setDocumentVersions(versions);

			// Wenn Versionen existieren, nehme die neueste
			if (versions.length > 0) {
				console.log('Setze neuestes Dokument aus Liste', versions[0]);
				setCurrentDocument(versions[0]);
			} else {
				// Wenn keine Versionen existieren, setze alles zurück
				console.log('Keine Dokumentversionen vorhanden, setze null');
				setCurrentDocument(null);
			}
		} catch (error) {
			console.error('Fehler beim Laden der Dokumentdaten:', error);
			if (error instanceof Error) {
				console.error('Details:', error.message);
			}
			// Bei Fehler alles zurücksetzen
			setCurrentDocument(null);
			setDocumentVersions([]);
		} finally {
			setIsDocumentLoading(false);
		}
	};

	// Handler für das Speichern eines neuen Dokuments
	const handleSaveDocument = async (content: string) => {
		if (!actualConversationId) return;

		try {
			setIsDocumentLoading(true);

			// Prüfen, ob bereits ein Dokument existiert
			const hasExistingDoc = await hasDocument(actualConversationId);

			let result: Document | null;

			if (hasExistingDoc) {
				// Neue Version erstellen
				result = await createDocumentVersion(actualConversationId, content);
			} else {
				// Neues Dokument erstellen
				result = await createDocument(actualConversationId, content);
			}

			if (result) {
				// Aktualisiere die lokalen Zustände
				setCurrentDocument(result);
				await loadDocumentData(actualConversationId);

				// Füge eine systemische Nachricht hinzu
				const versionText = hasExistingDoc ? `Version ${result.version}` : 'erste Version';
				await addMessage(actualConversationId, 'system', `Dokument ${versionText} erstellt.`);

				// Lade die Nachrichten neu
				const dbMessages = await getMessages(actualConversationId);
				setMessages(convertDbToUiMessages(dbMessages));
			}
		} catch (error) {
			console.error('Fehler beim Speichern des Dokuments:', error);
			Alert.alert('Fehler', 'Das Dokument konnte nicht gespeichert werden.');
		} finally {
			setIsDocumentLoading(false);
		}
	};

	// Handler für das Anzeigen der Versionen
	const handleShowVersions = () => {
		setIsVersionsModalVisible(true);
	};

	// Handler für die Auswahl einer Version
	const handleSelectVersion = (document: Document) => {
		setCurrentDocument(document);
		setIsVersionsModalVisible(false);
	};

	// Handler für das Löschen einer Version
	const handleDeleteVersion = async (document: Document) => {
		if (!actualConversationId) {
			console.error('Keine aktuelle Konversations-ID verfügbar');
			return;
		}

		try {
			console.log(
				`[handleDeleteVersion] Versuche Dokumentversion ${document.version} (ID: ${document.id}) zu löschen`
			);
			setIsDocumentLoading(true);

			// Debug-Informationen
			console.log('Aktuelle Konversation:', actualConversationId);
			console.log('Aktuelles Dokument:', currentDocument?.id);
			console.log('Zu löschendes Dokument:', document.id);

			// Sicherstellen, dass die zu löschende Version nicht aktuell angezeigt wird
			const isCurrentlyDisplayed = currentDocument?.id === document.id;

			// Löschen über den Service
			console.log('Lösche Dokument über Backend API...');
			const success = await deleteDocumentVersion(document.id);

			if (success) {
				console.log(`Dokumentversion ${document.version} erfolgreich gelöscht`);

				// Systemische Nachricht hinzufügen
				const messageId = await addMessage(
					actualConversationId,
					'system',
					`Dokumentversion ${document.version} wurde gelöscht.`
				);
				console.log('System-Nachricht hinzugefügt:', messageId);

				// Nachrichten neu laden
				const dbMessages = await getMessages(actualConversationId);
				setMessages(convertDbToUiMessages(dbMessages));

				// Dokumentversionen neu laden
				await new Promise((resolve) => setTimeout(resolve, 500));
				await loadDocumentData(actualConversationId);

				// Wenn die gerade angezeigte Version gelöscht wurde, zur neuesten wechseln
				if (isCurrentlyDisplayed) {
					console.log('Aktuell angezeigte Version wurde gelöscht, wechsle zur neuesten');
					const latestDoc = await getLatestDocument(actualConversationId);

					if (latestDoc) {
						console.log('Setze neues aktuelles Dokument:', latestDoc.id);
						setCurrentDocument(latestDoc);
					} else {
						console.log('Kein neuestes Dokument gefunden, setze null');
						setCurrentDocument(null);
					}
				}

				// Kurze Pause für bessere Benutzererfahrung
				setTimeout(() => {
					setIsVersionsModalVisible(false);

					// Erfolgsmeldung anzeigen
					Alert.alert(
						'Version gelöscht',
						`Die Dokumentversion ${document.version} wurde erfolgreich gelöscht.`,
						[{ text: 'OK' }]
					);
				}, 300);
			} else {
				console.error('Fehler beim Löschen der Dokumentversion');
				Alert.alert('Fehler', 'Die Dokumentversion konnte nicht gelöscht werden.');
			}
		} catch (error) {
			console.error('Fehler beim Löschen der Dokumentversion:', error);
			if (error instanceof Error) {
				console.error('Fehlerdetails:', error.message);
			}
			Alert.alert('Fehler', 'Die Dokumentversion konnte nicht gelöscht werden.');
		} finally {
			setIsDocumentLoading(false);
		}
	};

	// Handler für die Navigation zur nächsten Version
	const handleNextVersion = () => {
		if (!currentDocument || documentVersions.length <= 1) return;

		const currentIndex = documentVersions.findIndex((doc) => doc.id === currentDocument.id);
		if (currentIndex !== -1 && currentIndex > 0) {
			// Versionen sind absteigend nach version sortiert (neueste zuerst)
			setCurrentDocument(documentVersions[currentIndex - 1]);
		}
	};

	// Handler für die Navigation zur vorherigen Version
	const handlePreviousVersion = () => {
		if (!currentDocument || documentVersions.length <= 1) return;

		const currentIndex = documentVersions.findIndex((doc) => doc.id === currentDocument.id);
		if (currentIndex !== -1 && currentIndex < documentVersions.length - 1) {
			// Versionen sind absteigend nach version sortiert (neueste zuerst)
			setCurrentDocument(documentVersions[currentIndex + 1]);
		}
	};

	// Fokussiere das Eingabefeld beim Laden der Seite
	useEffect(() => {
		// Kurze Verzögerung, um sicherzustellen, dass die Komponente vollständig geladen ist
		const timer = setTimeout(() => {
			if (messageInputRef.current) {
				messageInputRef.current.focus();
			}
		}, 300);

		return () => clearTimeout(timer);
	}, []);

	// Verarbeite die initiale Nachricht für neue Konversationen
	useEffect(() => {
		const handleInitialMessage = async () => {
			if (isNewConversation && initialMsg && userId) {
				try {
					setIsLoading(true);

					// Bestimme die zu verwendende Modell-ID
					const selectedModelId =
						!modelId || modelId === 'undefined'
							? '550e8400-e29b-41d4-a716-446655440000' // GPT-O3-Mini als Standard
							: (modelId as string);

					console.log('Verarbeite initiale Nachricht mit Modell-ID:', selectedModelId);

					// Erstelle eine neue Konversation
					const newConversationId = await createConversation(
						userId,
						selectedModelId,
						conversationMode as 'free' | 'guided' | 'template',
						templateId,
						isDocumentMode
					);
					console.log(
						`✓ Konversation mit ID=${newConversationId} für Modell=${selectedModelId} erstellt`
					);

					console.log('Neue Konversation erstellt mit ID:', newConversationId);

					if (newConversationId) {
						setActualConversationId(newConversationId);

						// Füge die initiale Nachricht hinzu
						const userMessageId = await addMessage(newConversationId, 'user', initialMsg);
						console.log('Neue Benutzernachricht hinzugefügt mit ID:', userMessageId);

						if (userMessageId) {
							// Füge die Nachricht zur UI hinzu
							const userMessage: UIMessage = {
								id: userMessageId,
								text: initialMsg,
								sender: 'user',
								timestamp: new Date(),
							};
							setMessages([userMessage]);

							// Füge zunächst einen Platzhalter mit Loading-Status hinzu
							const tempAiMessage: UIMessage = {
								id: `ai-temp-${Date.now()}`,
								text: '',
								sender: 'ai',
								timestamp: new Date(),
								isLoading: true,
							};

							setMessages((prev) => [...prev, tempAiMessage]);

							// Hole die Antwort vom LLM
							console.log('Sende Nachricht an LLM mit:', {
								conversationId: newConversationId,
								message: initialMsg,
								modelId: selectedModelId,
								documentMode: isDocumentMode,
							});

							const { assistantResponse, title, documentContent } = await sendMessageAndGetResponse(
								newConversationId,
								initialMsg,
								selectedModelId,
								mode === 'template' ? (templateId as string) : undefined,
								isDocumentMode
							);

							// Debug: Loggen des Dokumentinhalts
							console.log('Dokumentmodus:', isDocumentMode);
							console.log('Dokumentinhalt zurückerhalten:', documentContent ? 'Ja' : 'Nein');

							// Wenn ein Dokumentinhalt zurückgegeben wurde, erstelle das erste Dokument
							if (isDocumentMode && documentContent) {
								console.log(
									'Erstelle das erste Dokument mit Inhalt:',
									documentContent.substring(0, 50) + '...'
								);
								const docResult = await createDocument(newConversationId, documentContent);
								console.log('Dokument erstellt:', docResult ? 'Erfolgreich' : 'Fehlgeschlagen');
								await loadDocumentData(newConversationId);
							} else if (isDocumentMode) {
								console.log(
									'Dokumentmodus ist aktiv, aber kein Dokumentinhalt wurde zurückgegeben'
								);
							}

							// Wenn ein Titel zurückgegeben wurde, aktualisieren wir ihn
							if (title) {
								console.log('Titel für neue Konversation generiert:', title);
								setConversationTitle(title);
							}

							console.log('LLM-Antwort erhalten:', assistantResponse.substring(0, 50) + '...');

							// Ersetze den Platzhalter durch die echte Antwort
							const aiMessage: UIMessage = {
								id: `ai-${Date.now()}`,
								text: assistantResponse,
								sender: 'ai',
								timestamp: new Date(),
							};

							// Ersetze den Platzhalter mit der echten Nachricht
							setMessages((prev) =>
								prev.map((msg) => (msg.id === tempAiMessage.id ? aiMessage : msg))
							);

							// Aktualisiere die URL mit der neuen Konversations-ID
							router.replace(`/conversation/${newConversationId}`);
						}
					}
				} catch (error) {
					console.error('Fehler beim Verarbeiten der initialen Nachricht:', error);
					Alert.alert('Fehler', 'Die Nachricht konnte nicht verarbeitet werden.');
				} finally {
					setIsLoading(false);
				}
			}
		};

		if (userId) {
			handleInitialMessage();
		}
	}, [isNewConversation, initialMsg, userId, modelId, conversationMode, router]);

	const handleSendMessage = async (text: string) => {
		try {
			console.log('handleSendMessage gestartet mit Text:', text.substring(0, 30) + '...');
			if (!text.trim()) return;

			// Prüfe, ob wir einen Benutzer haben
			if (!userId) {
				console.error('Fehler: Benutzer nicht verfügbar', { userId });
				Alert.alert('Fehler', 'Du musst angemeldet sein, um Nachrichten zu senden.');
				return;
			}

			// Falls wir kein Modell haben, aber eine bestehende Konversation, hole das Modell aus der Konversation
			if ((!modelId || modelId === 'undefined') && !modelData && actualConversationId) {
				try {
					console.log('Hole Modell aus der Konversation:', actualConversationId);
					const convData = await conversationApi.getConversation(actualConversationId);

					if (!convData) {
						console.error('Fehler beim Laden der Konversation');
						Alert.alert('Fehler', 'Modell konnte nicht geladen werden.');
						return;
					}

					if (convData.modelId) {
						console.log('Modell-ID aus der Konversation geladen:', convData.modelId);
						const fetchedModelId = convData.modelId;

						// Setze das Modell für die nächsten API-Aufrufe
						const response = await fetch(`/api/models`);
						const models = await response.json();
						const model = models.find((m: any) => m.id === fetchedModelId);

						if (model) {
							setModelName(model.name);
							setModelData(model);
							console.log('Model-Daten geladen:', model.name);
						} else {
							console.error('Modell nicht gefunden mit ID:', fetchedModelId);
							Alert.alert('Fehler', 'Das Modell für diese Konversation wurde nicht gefunden.');
							return;
						}
					} else {
						console.error('Keine Modell-ID in der Konversation gefunden.');
						Alert.alert('Fehler', 'Diese Konversation hat kein Modell.');
						return;
					}
				} catch (modelError) {
					console.error('Fehler beim Laden des Modells:', modelError);
					Alert.alert('Fehler', 'Modell konnte nicht geladen werden.');
					return;
				}
			} else {
				console.log('Modell bereits vorhanden:', {
					modelId,
					modelName: modelData?.name || 'Unbekannt',
				});
			}

			// Doppelprüfung, ob wir jetzt ein Modell haben
			if (!modelId && !modelData) {
				console.error('Fehler: Modell immer noch nicht verfügbar');
				Alert.alert('Fehler', 'Kein Modell für die Konversation verfügbar.');
				return;
			}

			console.log('Benutzer und Modell verfügbar:', {
				userId,
				modelId: modelId || (modelData && modelData.id),
				modelName: modelData?.name || 'Unbekannt',
			});

			// Neue Nachricht vom Benutzer hinzufügen (nur UI)
			const tempUserMessage: UIMessage = {
				id: `temp-${Date.now()}`,
				text,
				sender: 'user',
				timestamp: new Date(),
			};

			setMessages((prev) => [...prev, tempUserMessage]);
			setIsLoading(true);

			// Wenn es eine neue Konversation ist, erstelle sie zuerst
			let currentConversationId = actualConversationId;

			if (!currentConversationId) {
				currentConversationId = await createConversation(
					userId,
					(modelId as string) || (modelData && modelData.id),
					conversationMode as 'free' | 'guided' | 'template',
					templateId,
					isDocumentMode
				);

				if (!currentConversationId) {
					Alert.alert('Fehler', 'Konversation konnte nicht erstellt werden');
					setIsLoading(false);
					return;
				}

				setActualConversationId(currentConversationId);
			}

			// Sende die Nachricht und hole die Antwort
			const selectedModelId = (modelId as string) || (modelData && modelData.id);
			console.log('Sende Nachricht an sendMessageAndGetResponse mit:', {
				conversationId: currentConversationId,
				modelId: selectedModelId,
				modelName: modelData?.name || 'Unbekannt',
				deployment: modelData?.parameters?.deployment || 'Unbekannt',
				documentMode: isDocumentMode,
			});

			let assistantResponse = '';
			try {
				const result = await sendMessageAndGetResponse(
					currentConversationId,
					text,
					selectedModelId,
					mode === 'template' ? (templateId as string) : undefined,
					isDocumentMode
				);

				assistantResponse = result.assistantResponse;
				console.log('Antwort erhalten:', assistantResponse.substring(0, 50) + '...');

				// Wenn ein Titel zurückgegeben wurde, aktualisieren wir ihn
				if (result.title) {
					console.log('Neuer Titel generiert:', result.title);
					setConversationTitle(result.title);
				}

				// Debug: Dokumentmodus-Informationen loggen
				console.log('Dokumentmodus:', isDocumentMode);
				console.log('Dokumentinhalt erhalten:', result.documentContent ? 'Ja' : 'Nein');

				// Wenn Dokumentinhalt zurückgegeben wurde und wir im Dokumentmodus sind
				if (isDocumentMode && result.documentContent) {
					console.log(
						'Verarbeite Dokumentinhalt:',
						result.documentContent.substring(0, 50) + '...'
					);

					// Prüfen, ob bereits ein Dokument existiert
					const hasExistingDoc = await hasDocument(currentConversationId);
					console.log('Existierendes Dokument:', hasExistingDoc ? 'Ja' : 'Nein');

					let docResult;
					if (hasExistingDoc) {
						// Neue Version erstellen
						console.log('Erstelle neue Dokumentversion');
						docResult = await createDocumentVersion(currentConversationId, result.documentContent);
					} else {
						// Neues Dokument erstellen
						console.log('Erstelle neues Dokument');
						docResult = await createDocument(currentConversationId, result.documentContent);
					}

					console.log('Dokument-Operation erfolgreich:', docResult ? 'Ja' : 'Nein');

					// Dokument neu laden
					await loadDocumentData(currentConversationId);
				} else if (isDocumentMode) {
					console.log('Dokumentmodus ist aktiv, aber kein Dokumentinhalt zurückgegeben');
				}
			} catch (sendError) {
				console.error('Fehler in sendMessageAndGetResponse:', sendError);
				throw sendError;
			}

			// Bevor wir die echte Antwort erhalten, zeigen wir einen Platzhalter mit Lade-Indikator
			const tempAiMessage: UIMessage = {
				id: `ai-temp-${Date.now()}`,
				text: '', // Der Text ist leer, weil wir stattdessen den SkeletonLoader anzeigen
				sender: 'ai',
				timestamp: new Date(),
				isLoading: true, // Zeigt an, dass dieser Nachricht noch geladen wird
			};

			setMessages((prev) => [...prev, tempAiMessage]);

			// Wenn wir eine Antwort erhalten haben, ersetzen wir den Platzhalter mit der echten Antwort
			if (assistantResponse) {
				// Echte Antwort des Assistenten
				const aiMessage: UIMessage = {
					id: `ai-${Date.now()}`,
					text: assistantResponse,
					sender: 'ai',
					timestamp: new Date(),
				};

				// Ersetze den Platzhalter mit der echten Nachricht
				setMessages((prev) => prev.map((msg) => (msg.id === tempAiMessage.id ? aiMessage : msg)));
				console.log('Assistentenantwort zur UI hinzugefügt');
			}

			// Behalte die aktuelle Message-Reihenfolge bei und ersetze nur die temporären IDs
			console.log('Aktualisiere Nachrichten mit korrekten IDs...');
			const dbMessages = await getMessages(currentConversationId);
			console.log(`${dbMessages.length} Nachrichten aus der Datenbank geladen`);

			// In diesem Fall ersetzen wir nicht die gesamten Nachrichten, damit der Kontext erhalten bleibt
			// und der Benutzer auf seiner aktuellen Position in der Konversation bleibt
			// setMessages(convertDbToUiMessages(dbMessages));

			// Wenn es eine neue Konversation war, aktualisiere die URL
			if (isNewConversation && currentConversationId) {
				router.replace(`/conversation/${currentConversationId}`);
			}
		} catch (error) {
			console.error('Fehler beim Senden der Nachricht:', error);

			// Detaillierte Fehlerinformationen ausgeben
			if (error instanceof Error) {
				console.error('Fehlerdetails:', {
					name: error.name,
					message: error.message,
					stack: error.stack,
				});
			}

			Alert.alert(
				'Fehler',
				`Die Nachricht konnte nicht gesendet werden: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
			);
		} finally {
			setIsLoading(false);
			console.log('handleSendMessage abgeschlossen');
		}
	};

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
			<View style={styles.mainLayout}>
				{/* Drawer / Seitenmenü */}
				{isDrawerOpen && (
					<View style={styles.drawerContainer}>
						<CustomDrawer isVisible={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
					</View>
				)}

				{/* Hauptinhalt */}
				<View style={styles.mainContainer}>
					<KeyboardAvoidingView
						style={styles.keyboardContainer}
						behavior={Platform.OS === 'ios' ? 'padding' : undefined}
						keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
					>
						<View style={styles.headerContainer}>
							<TouchableOpacity
								style={styles.menuButton}
								onPress={() => setIsDrawerOpen(!isDrawerOpen)}
							>
								<Ionicons name="menu-outline" size={28} color={colors.text} />
							</TouchableOpacity>

							<View style={styles.headerContentContainer}>
								<TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
									<Ionicons name="chevron-back" size={24} color={colors.text} />
								</TouchableOpacity>

								<ChatHeader
									title={conversationTitle}
									modelName={modelName}
									conversationMode={conversationMode}
								/>
							</View>
						</View>

						{/* Dokumentmodus Layout */}
						{isDocumentMode ? (
							<View style={styles.documentLayout}>
								<View style={styles.documentMessageContainer}>
									<MessageList messages={messages} isLoading={isLoading} />

									<MessageInput
										ref={messageInputRef}
										onSend={handleSendMessage}
										isLoading={isLoading}
									/>
								</View>

								<View style={styles.documentPanelContainer}>
									<DocumentPanel
										document={currentDocument}
										isLoading={isDocumentLoading}
										versionCount={documentVersions.length}
										onSave={handleSaveDocument}
										onShowVersions={handleShowVersions}
										onNextVersion={handleNextVersion}
										onPreviousVersion={handlePreviousVersion}
										onDeleteVersion={handleDeleteVersion}
									/>
								</View>
							</View>
						) : (
							/* Standard-Layout ohne Dokumentmodus */
							<>
								<View style={styles.messageContainer}>
									<MessageList messages={messages} isLoading={isLoading} />
								</View>

								<MessageInput
									ref={messageInputRef}
									onSend={handleSendMessage}
									isLoading={isLoading}
								/>
							</>
						)}
					</KeyboardAvoidingView>
				</View>
			</View>

			{/* Versionen Modal */}
			<DocumentVersions
				isVisible={isVersionsModalVisible}
				documents={documentVersions}
				onClose={() => setIsVersionsModalVisible(false)}
				onSelectVersion={handleSelectVersion}
				onDeleteVersion={handleDeleteVersion}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	mainLayout: {
		flex: 1,
		flexDirection: 'row',
	},
	mainContainer: {
		flex: 1,
		alignItems: 'center',
	},
	drawerContainer: {
		width: 260,
		height: '100%',
		position: 'absolute',
		left: 0,
		top: 0,
		bottom: 0,
		zIndex: 10,
	},
	keyboardContainer: {
		flex: 1,
		width: '100%',
		maxWidth: 1200,
	},
	headerContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		width: '100%',
	},
	menuButton: {
		padding: 12,
		marginRight: 0,
		zIndex: 5,
	},
	headerContentContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
	},
	backButton: {
		padding: 8,
		marginRight: 8,
	},
	messageContainer: {
		flex: 1,
		width: '100%',
	},
	// Dokumentmodus-Styles
	documentLayout: {
		flex: 1,
		flexDirection: 'row',
		width: '100%',
		height: '100%',
	},
	documentMessageContainer: {
		width: '50%',
		borderRightWidth: 1,
		borderRightColor: 'rgba(0,0,0,0.1)',
		height: '100%',
		display: 'flex',
		flexDirection: 'column',
	},
	documentPanelContainer: {
		width: '50%',
		height: '100%',
		paddingTop: 8,
		paddingBottom: 16,
	},
});
