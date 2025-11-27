import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { useJobStore } from '@/stores/jobs';

export default function HomeScreen() {
  const { jobs, activeJobs } = useJobStore();

  const stats = {
    totalTranscripts: jobs.filter((j) => j.status === 'completed').length,
    activeJobs: activeJobs.length,
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transcriber</Text>
        <Text style={styles.subtitle}>AI-powered video transcription</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalTranscripts}</Text>
          <Text style={styles.statLabel}>Transcripts</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#eab308' }]}>
            {stats.activeJobs}
          </Text>
          <Text style={styles.statLabel}>Active Jobs</Text>
        </View>
      </View>

      <Link href="/(tabs)/transcribe" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Start New Transcription</Text>
        </Pressable>
      </Link>

      {activeJobs.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Jobs</Text>
          {activeJobs.map((job) => (
            <View key={job.id} style={styles.jobCard}>
              <Text style={styles.jobTitle} numberOfLines={1}>
                {job.videoInfo?.title || job.url}
              </Text>
              <Text style={styles.jobStatus}>{job.status}</Text>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${job.progress}%` }]}
                />
              </View>
              <Text style={styles.progressText}>{job.progress}%</Text>
            </View>
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
  header: {
    padding: 24,
    backgroundColor: '#9333ea',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#e9d5ff',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#9333ea',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  button: {
    marginHorizontal: 16,
    backgroundColor: '#9333ea',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1f2937',
  },
  jobCard: {
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
  jobTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  jobStatus: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#9333ea',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
});
