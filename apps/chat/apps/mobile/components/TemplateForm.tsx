import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  KeyboardAvoidingView, 
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useAppTheme } from '../theme/ThemeProvider';
import ModelDropdown from './ModelDropdown';
import { Template } from '../services/template';

// Verfügbare Farben für Vorlagen
const TEMPLATE_COLORS = [
  '#0A84FF', // Blau
  '#32D74B', // Grün
  '#FF375F', // Rot
  '#FF9F0A', // Orange
  '#5E5CE6', // Lila
  '#BF5AF2', // Pink
  '#64D2FF', // Hellblau
  '#30D158', // Grün
  '#FF453A', // Rot
];

interface TemplateFormProps {
  initialData?: Partial<Template>;
  onSubmit: (data: Partial<Template>) => void;
  onCancel: () => void;
}

export default function TemplateForm({ 
  initialData, 
  onSubmit, 
  onCancel 
}: TemplateFormProps) {
  const { colors } = useTheme();
  const { isDarkMode } = useAppTheme();
  
  // Form state
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [systemPrompt, setSystemPrompt] = useState(initialData?.system_prompt || '');
  const [initialQuestion, setInitialQuestion] = useState(initialData?.initial_question || '');
  const [selectedColor, setSelectedColor] = useState(initialData?.color || TEMPLATE_COLORS[0]);
  const [selectedModelId, setSelectedModelId] = useState(initialData?.model_id || '');
  const [documentMode, setDocumentMode] = useState(initialData?.document_mode || false);
  
  // Validierung
  const [errors, setErrors] = useState<{
    name?: string;
    systemPrompt?: string;
  }>({});
  
  // Helpers
  const isEditMode = !!initialData?.id;
  const bgColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#000000';
  const placeholderColor = isDarkMode ? '#8E8E93' : '#C7C7CC';
  const borderColor = isDarkMode ? '#38383A' : '#E5E5EA';
  
  // Validiere das Formular vor dem Absenden
  const validateForm = (): boolean => {
    const newErrors: {
      name?: string;
      systemPrompt?: string;
    } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Bitte gib einen Namen ein.';
    }
    
    if (!systemPrompt.trim()) {
      newErrors.systemPrompt = 'Der System-Prompt darf nicht leer sein.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle submit
  const handleSubmit = () => {
    if (!validateForm()) return;
    
    onSubmit({
      id: initialData?.id,
      name,
      description: description.trim() || null,
      system_prompt: systemPrompt,
      initial_question: initialQuestion.trim() || null,
      color: selectedColor,
      model_id: selectedModelId || null,
      document_mode: documentMode
    });
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: bgColor }]}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          {/* Titel */}
          <Text style={[styles.title, { color: textColor }]}>
            {isEditMode ? 'Vorlage bearbeiten' : 'Neue Vorlage erstellen'}
          </Text>
          
          {/* Name */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: textColor }]}>Name *</Text>
            <TextInput
              style={[
                styles.input,
                { 
                  color: textColor,
                  backgroundColor: isDarkMode ? '#2C2C2E' : '#F2F2F7',
                  borderColor: errors.name ? '#FF3B30' : borderColor
                }
              ]}
              placeholder="Name der Vorlage"
              placeholderTextColor={placeholderColor}
              value={name}
              onChangeText={setName}
              maxLength={50}
            />
            {errors.name && (
              <Text style={styles.errorText}>{errors.name}</Text>
            )}
          </View>
          
          {/* Beschreibung */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: textColor }]}>Beschreibung (optional)</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { 
                  color: textColor,
                  backgroundColor: isDarkMode ? '#2C2C2E' : '#F2F2F7',
                  borderColor
                }
              ]}
              placeholder="Kurze Beschreibung dieser Vorlage"
              placeholderTextColor={placeholderColor}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={2}
              maxLength={200}
            />
          </View>
          
          {/* System-Prompt */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: textColor }]}>System-Prompt *</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { 
                  color: textColor,
                  backgroundColor: isDarkMode ? '#2C2C2E' : '#F2F2F7',
                  borderColor: errors.systemPrompt ? '#FF3B30' : borderColor,
                  height: 150
                }
              ]}
              placeholder="System-Prompt für die KI"
              placeholderTextColor={placeholderColor}
              value={systemPrompt}
              onChangeText={setSystemPrompt}
              multiline
              textAlignVertical="top"
            />
            {errors.systemPrompt && (
              <Text style={styles.errorText}>{errors.systemPrompt}</Text>
            )}
            <Text style={[styles.helperText, { color: isDarkMode ? '#8E8E93' : '#8A8A8E' }]}>
              Der System-Prompt definiert die Rolle und das Verhalten der KI.
            </Text>
          </View>
          
          {/* Initiale Frage */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: textColor }]}>Beispielfrage (optional)</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { 
                  color: textColor,
                  backgroundColor: isDarkMode ? '#2C2C2E' : '#F2F2F7',
                  borderColor: borderColor,
                  height: 80
                }
              ]}
              placeholder="Beispiel für eine passende Frage oder Anweisung"
              placeholderTextColor={placeholderColor}
              value={initialQuestion}
              onChangeText={setInitialQuestion}
              multiline
              textAlignVertical="top"
            />
            <Text style={[styles.helperText, { color: isDarkMode ? '#8E8E93' : '#8A8A8E' }]}>
              Diese Frage wird als Vorschlag angezeigt, wenn die Vorlage ausgewählt wird.
            </Text>
          </View>
          
          {/* Farbe auswählen */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: textColor }]}>Farbe</Text>
            <View style={styles.colorPicker}>
              {TEMPLATE_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.selectedColorOption
                  ]}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor === color && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Modell auswählen */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: textColor }]}>Bevorzugtes Modell (optional)</Text>
            <ModelDropdown
              selectedModelId={selectedModelId}
              onSelectModel={setSelectedModelId}
            />
            <Text style={[styles.helperText, { color: isDarkMode ? '#8E8E93' : '#8A8A8E' }]}>
              Falls ausgewählt, wird dieses Modell automatisch mit der Vorlage verwendet.
            </Text>
          </View>
          
          {/* Dokumentmodus */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: textColor }]}>Dokumentmodus</Text>
            <TouchableOpacity
              style={[
                styles.switchContainer,
                { 
                  backgroundColor: documentMode ? colors.primary + '20' : isDarkMode ? '#2C2C2E' : '#F2F2F7',
                  borderColor: documentMode ? colors.primary : borderColor
                }
              ]}
              onPress={() => setDocumentMode(!documentMode)}
            >
              <View style={styles.switchText}>
                <Text style={[styles.switchLabel, { color: textColor }]}>
                  Dokumentmodus aktivieren
                </Text>
                <Text style={[styles.switchDescription, { color: isDarkMode ? '#8E8E93' : '#8A8A8E' }]}>
                  Ermöglicht die Bearbeitung eines Dokuments während der Konversation
                </Text>
              </View>
              <View style={[
                styles.switchButton, 
                { backgroundColor: documentMode ? colors.primary : isDarkMode ? '#636366' : '#C7C7CC' }
              ]}>
                {documentMode ? (
                  <Ionicons name="checkmark" size={14} color="white" />
                ) : (
                  <Ionicons name="close" size={14} color="white" />
                )}
              </View>
            </TouchableOpacity>
          </View>
          
          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { borderColor }]}
              onPress={onCancel}
            >
              <Text style={[styles.buttonText, { color: textColor }]}>Abbrechen</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
            >
              <Text style={[styles.buttonText, { color: 'white' }]}>
                {isEditMode ? 'Speichern' : 'Erstellen'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 6,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    margin: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColorOption: {
    borderWidth: 2,
    borderColor: 'white',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  switchText: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 12,
  },
  switchButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  submitButton: {
    backgroundColor: '#0A84FF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});