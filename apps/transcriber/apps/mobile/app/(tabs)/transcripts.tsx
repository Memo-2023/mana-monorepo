import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useJobStore } from '@/stores/jobs';

export default function TranscriptsScreen() {
  const { jobs } = useJobStore();
  const completedJobs = jobs.filter((j) => j.status === 'completed');

  return (
    <ScrollView style={styles.container}>
      {completedJobs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No transcripts yet</Text>
          <Text style={styles.emptyHint}>
            Start a new transcription to see results here
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {completedJobs.map((job) => (
            <Pressable key={job.id} style={styles.card}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {job.videoInfo?.title || 'Untitled'}
              </Text>
              <Text style={styles.cardSubtitle}>
                {job.videoInfo?.channel || 'Unknown channel'}
              </Text>
              <Text style={styles.cardDate}>
                {new Date(job.completedAt || '').toLocaleDateString()}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  empty: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
  },
  emptyHint: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  cardDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
  },
});
