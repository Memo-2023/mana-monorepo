import { TextData, AudioVersion } from '~/types/database';

/**
 * Migriert alte Audio-Daten zum neuen audioVersions Format
 */
export function migrateAudioData(data: TextData): TextData {
  // Wenn bereits audioVersions existiert, keine Migration nötig
  if (data.audioVersions && data.audioVersions.length > 0) {
    return data;
  }

  // Wenn alte audio Daten existieren, migriere sie
  if (data.audio && data.audio.chunks && data.audio.chunks.length > 0) {
    const versionId = `v1-${data.audio.lastGenerated ? new Date(data.audio.lastGenerated).getTime() : Date.now()}`;
    const audioVersion: AudioVersion = {
      id: versionId,
      chunks: data.audio.chunks,
      settings: data.audio.settings || {
        voice: data.tts?.voice || 'de-DE-Neural2-A',
        speed: data.tts?.speed || 1,
      },
      totalSize: data.audio.totalSize,
      hasLocalCache: data.audio.hasLocalCache,
      createdAt: data.audio.lastGenerated || new Date().toISOString(),
    };

    return {
      ...data,
      audioVersions: [audioVersion],
      currentAudioVersion: versionId,
    };
  }

  // Keine Audio-Daten vorhanden
  return data;
}

/**
 * Holt die aktuelle Audio-Version basierend auf currentAudioVersion
 */
export function getCurrentAudioVersion(data: TextData): AudioVersion | null {
  if (!data.audioVersions || data.audioVersions.length === 0) {
    return null;
  }

  if (data.currentAudioVersion) {
    const version = data.audioVersions.find((v) => v.id === data.currentAudioVersion);
    if (version) return version;
  }

  // Fallback: nimm die neueste Version
  return data.audioVersions[data.audioVersions.length - 1];
}

/**
 * Generiert eine neue Versions-ID
 */
export function generateVersionId(): string {
  return `v${Date.now()}`;
}
