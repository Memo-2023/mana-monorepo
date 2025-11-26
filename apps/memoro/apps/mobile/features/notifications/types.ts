export enum NotificationChannel {
  DEFAULT = 'default',
  FUNCTIONAL = 'functional',
  AUDIO_RECORDING = 'audio_recording',
  AUDIO_PLAYBACK = 'audio_playback',
}

export interface NotificationOptions {
  title: string;
  body: string;
  channelType?: NotificationChannel;
  asForegroundService?: boolean;
}

export interface UpdateableNotificationOptions {
  requireInteraction?: boolean;
  silent?: boolean;
  minUpdateInterval?: number;
}

export interface UpdateableNotification {
  update: (
    title: string,
    message: string,
    options?: UpdateableNotificationOptions,
  ) => Promise<void>;
  finish: (title: string, message: string) => Promise<void>;
  error: (title: string, message: string) => Promise<void>;
}
