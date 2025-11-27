export interface Text {
  id: string;
  user_id: string;
  title: string;
  content: string;
  data: TextData;
  created_at: string;
  updated_at: string;
}

export interface TextData {
  // Vorlese-Einstellungen
  tts?: {
    speed: number;
    voice: string;
    lastPosition?: number;
    lastPlayed?: string;
  };

  // Legacy Audio-Cache (für Abwärtskompatibilität)
  audio?: {
    hasLocalCache: boolean;
    chunks: AudioChunk[];
    totalSize: number;
    lastGenerated?: string;
    settings?: {
      voice: string;
      speed: number;
    };
  };

  // Neue Audio-Versionen
  audioVersions?: AudioVersion[];
  currentAudioVersion?: string; // ID der aktiven Version

  // Organisation
  tags?: string[];
  color?: string;

  // Statistiken
  stats?: {
    playCount: number;
    totalTime: number;
    completed: boolean;
  };

  // Zusätzliche Felder
  notes?: string;
  source?: string;
  bookmarks?: Bookmark[];
}

export interface AudioVersion {
  id: string; // z.B. "v1-1736979654989"
  chunks: AudioChunk[];
  settings: {
    voice: string;
    speed: number;
  };
  totalSize: number;
  hasLocalCache: boolean;
  createdAt: string;
}

export interface AudioChunk {
  id: string;
  start: number;
  end: number;
  filename: string;
  size: number;
  duration: number;
  createdAt: string;
}

export interface Bookmark {
  position: number;
  note?: string;
  created: string;
}
