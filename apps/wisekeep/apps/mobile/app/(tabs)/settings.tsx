import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function SettingsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Version</Text>
          <Text style={styles.value}>1.0.0</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Backend URL</Text>
          <Text style={styles.value}>http://localhost:3006</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Default Settings</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Language</Text>
          <Text style={styles.value}>German (de)</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Provider</Text>
          <Text style={styles.value}>OpenAI Whisper API</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    color: '#1f2937',
  },
  value: {
    fontSize: 14,
    color: '#6b7280',
  },
});
