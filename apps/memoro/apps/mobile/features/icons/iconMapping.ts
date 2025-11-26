export interface IconMapping {
  ionicon: string;
  sfSymbol: string;
}

export const iconMap: Record<string, IconMapping> = {
  // Navigation
  'chevron-back': {
    ionicon: 'chevron-back',
    sfSymbol: 'chevron.left',
  },
  'chevron-forward': {
    ionicon: 'chevron-forward',
    sfSymbol: 'chevron.right',
  },
  'arrow-back': {
    ionicon: 'arrow-back',
    sfSymbol: 'arrow.left',
  },
  'chevron-down': {
    ionicon: 'chevron-down',
    sfSymbol: 'chevron.down',
  },
  'chevron-up': {
    ionicon: 'chevron-up',
    sfSymbol: 'chevron.up',
  },

  // Actions
  'mic-outline': {
    ionicon: 'mic-outline',
    sfSymbol: 'mic',
  },
  'mic': {
    ionicon: 'mic',
    sfSymbol: 'mic.fill',
  },
  'create-outline': {
    ionicon: 'create-outline',
    sfSymbol: 'pencil',
  },
  'create': {
    ionicon: 'create',
    sfSymbol: 'pencil.circle.fill',
  },
  'share-outline': {
    ionicon: 'share-outline',
    sfSymbol: 'square.and.arrow.up',
  },
  'refresh': {
    ionicon: 'refresh',
    sfSymbol: 'arrow.clockwise',
  },
  'add': {
    ionicon: 'add',
    sfSymbol: 'plus',
  },
  'trash-outline': {
    ionicon: 'trash-outline',
    sfSymbol: 'trash',
  },
  'trash': {
    ionicon: 'trash',
    sfSymbol: 'trash.fill',
  },

  // UI Elements
  'close': {
    ionicon: 'close',
    sfSymbol: 'xmark',
  },
  'checkmark': {
    ionicon: 'checkmark',
    sfSymbol: 'checkmark',
  },
  'ellipsis-horizontal': {
    ionicon: 'ellipsis-horizontal',
    sfSymbol: 'ellipsis',
  },
  'menu': {
    ionicon: 'menu',
    sfSymbol: 'line.3.horizontal',
  },

  // Tab Icons
  'archive-outline': {
    ionicon: 'archive-outline',
    sfSymbol: 'archivebox',
  },
  'archive': {
    ionicon: 'archive',
    sfSymbol: 'archivebox.fill',
  },
  'folder-outline': {
    ionicon: 'folder-outline',
    sfSymbol: 'folder',
  },
  'folder': {
    ionicon: 'folder',
    sfSymbol: 'folder.fill',
  },

  // Menu/Settings
  'settings-outline': {
    ionicon: 'settings-outline',
    sfSymbol: 'gearshape',
  },
  'settings': {
    ionicon: 'settings',
    sfSymbol: 'gearshape.fill',
  },

  // Content
  'document-text-outline': {
    ionicon: 'document-text-outline',
    sfSymbol: 'doc.text',
  },
  'document-text': {
    ionicon: 'document-text',
    sfSymbol: 'doc.text.fill',
  },
  'image-outline': {
    ionicon: 'image-outline',
    sfSymbol: 'photo',
  },
  'image': {
    ionicon: 'image',
    sfSymbol: 'photo.fill',
  },
  'camera-outline': {
    ionicon: 'camera-outline',
    sfSymbol: 'camera',
  },
  'camera': {
    ionicon: 'camera',
    sfSymbol: 'camera.fill',
  },

  // Social
  'heart-outline': {
    ionicon: 'heart-outline',
    sfSymbol: 'heart',
  },
  'heart': {
    ionicon: 'heart',
    sfSymbol: 'heart.fill',
  },
  'star-outline': {
    ionicon: 'star-outline',
    sfSymbol: 'star',
  },
  'star': {
    ionicon: 'star',
    sfSymbol: 'star.fill',
  },
  'bookmark-outline': {
    ionicon: 'bookmark-outline',
    sfSymbol: 'bookmark',
  },
  'bookmark': {
    ionicon: 'bookmark',
    sfSymbol: 'bookmark.fill',
  },

  // Functional
  'search-outline': {
    ionicon: 'search-outline',
    sfSymbol: 'magnifyingglass',
  },
  'search': {
    ionicon: 'search',
    sfSymbol: 'magnifyingglass.circle.fill',
  },
  'filter-outline': {
    ionicon: 'filter-outline',
    sfSymbol: 'line.3.horizontal.decrease.circle',
  },
  'filter': {
    ionicon: 'filter',
    sfSymbol: 'line.3.horizontal.decrease.circle.fill',
  },
  'sync-outline': {
    ionicon: 'sync-outline',
    sfSymbol: 'arrow.triangle.2.circlepath',
  },

  // Additional commonly used icons
  'play': {
    ionicon: 'play',
    sfSymbol: 'play.fill',
  },
  'pause': {
    ionicon: 'pause',
    sfSymbol: 'pause.fill',
  },
  'stop': {
    ionicon: 'stop',
    sfSymbol: 'stop.fill',
  },
  'pin-outline': {
    ionicon: 'pin-outline',
    sfSymbol: 'pin',
  },
  'pin': {
    ionicon: 'pin',
    sfSymbol: 'pin.fill',
  },
  'location-outline': {
    ionicon: 'location-outline',
    sfSymbol: 'location',
  },
  'location': {
    ionicon: 'location',
    sfSymbol: 'location.fill',
  },
  'globe-outline': {
    ionicon: 'globe-outline',
    sfSymbol: 'globe',
  },
  'person-outline': {
    ionicon: 'person-outline',
    sfSymbol: 'person',
  },
  'person': {
    ionicon: 'person',
    sfSymbol: 'person.fill',
  },
  'people-outline': {
    ionicon: 'people-outline',
    sfSymbol: 'person.2',
  },
  'people': {
    ionicon: 'people',
    sfSymbol: 'person.2.fill',
  },
  'clipboard-outline': {
    ionicon: 'clipboard-outline',
    sfSymbol: 'list.bullet.clipboard',
  },
  'clipboard': {
    ionicon: 'clipboard',
    sfSymbol: 'list.bullet.clipboard.fill',
  },
  'copy-outline': {
    ionicon: 'copy-outline',
    sfSymbol: 'doc.on.doc',
  },
  'copy': {
    ionicon: 'copy',
    sfSymbol: 'doc.on.doc.fill',
  },
  'download-outline': {
    ionicon: 'download-outline',
    sfSymbol: 'arrow.down.circle',
  },
  'download': {
    ionicon: 'download',
    sfSymbol: 'arrow.down.circle.fill',
  },
  'cloud-outline': {
    ionicon: 'cloud-outline',
    sfSymbol: 'cloud',
  },
  'cloud': {
    ionicon: 'cloud',
    sfSymbol: 'cloud.fill',
  },
  'cloud-done-outline': {
    ionicon: 'cloud-done-outline',
    sfSymbol: 'checkmark.icloud',
  },
  'cloud-done': {
    ionicon: 'cloud-done',
    sfSymbol: 'checkmark.icloud.fill',
  },
  'warning-outline': {
    ionicon: 'warning-outline',
    sfSymbol: 'exclamationmark.triangle',
  },
  'warning': {
    ionicon: 'warning',
    sfSymbol: 'exclamationmark.triangle.fill',
  },
  'information-circle-outline': {
    ionicon: 'information-circle-outline',
    sfSymbol: 'info.circle',
  },
  'information-circle': {
    ionicon: 'information-circle',
    sfSymbol: 'info.circle.fill',
  },
  'help-circle-outline': {
    ionicon: 'help-circle-outline',
    sfSymbol: 'questionmark.circle',
  },
  'help-circle': {
    ionicon: 'help-circle',
    sfSymbol: 'questionmark.circle.fill',
  },
  'calendar-outline': {
    ionicon: 'calendar-outline',
    sfSymbol: 'calendar',
  },
  'time-outline': {
    ionicon: 'time-outline',
    sfSymbol: 'clock',
  },
  'time': {
    ionicon: 'time',
    sfSymbol: 'clock.fill',
  },
  'mail-outline': {
    ionicon: 'mail-outline',
    sfSymbol: 'envelope',
  },
  'mail': {
    ionicon: 'mail',
    sfSymbol: 'envelope.fill',
  },
  'lock-closed-outline': {
    ionicon: 'lock-closed-outline',
    sfSymbol: 'lock',
  },
  'lock-closed': {
    ionicon: 'lock-closed',
    sfSymbol: 'lock.fill',
  },
  'key-outline': {
    ionicon: 'key-outline',
    sfSymbol: 'key',
  },
  'exit-outline': {
    ionicon: 'exit-outline',
    sfSymbol: 'rectangle.portrait.and.arrow.right',
  },
  'log-out-outline': {
    ionicon: 'log-out-outline',
    sfSymbol: 'rectangle.portrait.and.arrow.right',
  },
  'checkmark-circle-outline': {
    ionicon: 'checkmark-circle-outline',
    sfSymbol: 'checkmark.circle',
  },
  'checkmark-circle': {
    ionicon: 'checkmark-circle',
    sfSymbol: 'checkmark.circle.fill',
  },
  'close-circle-outline': {
    ionicon: 'close-circle-outline',
    sfSymbol: 'xmark.circle',
  },
  'close-circle': {
    ionicon: 'close-circle',
    sfSymbol: 'xmark.circle.fill',
  },
  'flash-outline': {
    ionicon: 'flash-outline',
    sfSymbol: 'bolt',
  },
  'flash': {
    ionicon: 'flash',
    sfSymbol: 'bolt.fill',
  },
  'language-outline': {
    ionicon: 'language-outline',
    sfSymbol: 'globe',
  },
  'language': {
    ionicon: 'language',
    sfSymbol: 'globe.americas.fill',
  },
  'sparkles-outline': {
    ionicon: 'sparkles-outline',
    sfSymbol: 'sparkles',
  },
  'sparkles': {
    ionicon: 'sparkles',
    sfSymbol: 'sparkles',
  },
  'list-outline': {
    ionicon: 'list-outline',
    sfSymbol: 'list.bullet.clipboard',
  },
  'list': {
    ionicon: 'list',
    sfSymbol: 'list.bullet.clipboard.fill',
  },
  'volume-high-outline': {
    ionicon: 'volume-high-outline',
    sfSymbol: 'speaker.wave.3',
  },
  'volume-high': {
    ionicon: 'volume-high',
    sfSymbol: 'speaker.wave.3.fill',
  },
  'waveform': {
    ionicon: 'pulse-outline',
    sfSymbol: 'waveform',
  },
  'pricetag-outline': {
    ionicon: 'pricetag-outline',
    sfSymbol: 'tag',
  },
  'pricetag': {
    ionicon: 'pricetag',
    sfSymbol: 'tag.fill',
  },
  'bar-chart-outline': {
    ionicon: 'bar-chart-outline',
    sfSymbol: 'chart.bar',
  },
  'bar-chart': {
    ionicon: 'bar-chart',
    sfSymbol: 'chart.bar.fill',
  },
  'cloud-upload-outline': {
    ionicon: 'cloud-upload-outline',
    sfSymbol: 'icloud.and.arrow.up',
  },
  'cloud-upload': {
    ionicon: 'cloud-upload',
    sfSymbol: 'icloud.and.arrow.up.fill',
  },
  'water-outline': {
    ionicon: 'water-outline',
    sfSymbol: 'drop',
  },
  'water': {
    ionicon: 'water',
    sfSymbol: 'drop.fill',
  },
  'ellipsis-vertical': {
    ionicon: 'ellipsis-vertical',
    sfSymbol: 'ellipsis',
  },
};

// Helper function to get mapping
export function getIconMapping(name: string): IconMapping | undefined {
  return iconMap[name];
}

// Helper to check if icon has mapping
export function hasIconMapping(name: string): boolean {
  return name in iconMap;
}