// Zentralisierte Menu Actions für konsistente Menus im gesamten Projekt

export interface MenuActionConfig {
  id: string;
  title: string;
  destructive?: boolean;
  icon?: {
    ios: string;
    android: string;
  };
  color?: string;
}

// Memo Actions
export const MEMO_ACTIONS = {
  EDIT: {
    id: 'edit',
    title: 'Bearbeiten',
    icon: {
      ios: 'pencil',
      android: 'ic_menu_edit',
    },
  },
  DELETE: {
    id: 'delete',
    title: 'Löschen',
    destructive: true,
    icon: {
      ios: 'trash',
      android: 'ic_menu_delete',
    },
  },
  SHARE: {
    id: 'share',
    title: 'Teilen',
    icon: {
      ios: 'square.and.arrow.up',
      android: 'ic_menu_share',
    },
  },
  DUPLICATE: {
    id: 'duplicate',
    title: 'Duplizieren',
    icon: {
      ios: 'doc.on.doc',
      android: 'ic_menu_copy_holo_dark',
    },
  },
  EXPORT: {
    id: 'export',
    title: 'Exportieren',
    icon: {
      ios: 'arrow.up.doc',
      android: 'ic_menu_upload',
    },
  },
} as const;

// Memory Actions
export const MEMORY_ACTIONS = {
  VIEW: {
    id: 'view',
    title: 'Ansehen',
    icon: {
      ios: 'eye',
      android: 'ic_menu_view',
    },
  },
  EDIT: {
    id: 'edit',
    title: 'Bearbeiten',
    icon: {
      ios: 'pencil',
      android: 'ic_menu_edit',
    },
  },
  DELETE: {
    id: 'delete',
    title: 'Löschen',
    destructive: true,
    icon: {
      ios: 'trash',
      android: 'ic_menu_delete',
    },
  },
  SHARE: {
    id: 'share',
    title: 'Teilen',
    icon: {
      ios: 'square.and.arrow.up',
      android: 'ic_menu_share',
    },
  },
  DOWNLOAD: {
    id: 'download',
    title: 'Herunterladen',
    icon: {
      ios: 'arrow.down.circle',
      android: 'ic_menu_save',
    },
  },
} as const;

// Settings Actions
export const SETTINGS_ACTIONS = {
  PROFILE: {
    id: 'profile',
    title: 'Profil',
    icon: {
      ios: 'person.circle',
      android: 'ic_menu_myplaces',
    },
  },
  SETTINGS: {
    id: 'settings',
    title: 'Einstellungen',
    icon: {
      ios: 'gearshape',
      android: 'ic_menu_preferences',
    },
  },
  HELP: {
    id: 'help',
    title: 'Hilfe',
    icon: {
      ios: 'questionmark.circle',
      android: 'ic_menu_help',
    },
  },
  LOGOUT: {
    id: 'logout',
    title: 'Abmelden',
    destructive: true,
    icon: {
      ios: 'arrow.right.square',
      android: 'ic_lock_power_off',
    },
  },
} as const;

// Photo/Media Actions
export const MEDIA_ACTIONS = {
  OPEN: {
    id: 'open',
    title: 'Öffnen',
    icon: {
      ios: 'arrow.up.right.square',
      android: 'ic_menu_view',
    },
  },
  SHARE: {
    id: 'share',
    title: 'Teilen',
    icon: {
      ios: 'square.and.arrow.up',
      android: 'ic_menu_share',
    },
  },
  SAVE: {
    id: 'save',
    title: 'Speichern',
    icon: {
      ios: 'square.and.arrow.down',
      android: 'ic_menu_save',
    },
  },
  DELETE: {
    id: 'delete',
    title: 'Löschen',
    destructive: true,
    icon: {
      ios: 'trash',
      android: 'ic_menu_delete',
    },
  },
} as const;

// Prompt Actions
export const PROMPT_ACTIONS = {
  EDIT: {
    id: 'edit',
    title: 'Bearbeiten',
    icon: {
      ios: 'pencil',
      android: 'ic_menu_edit',
    },
  },
  DUPLICATE: {
    id: 'duplicate',
    title: 'Duplizieren',
    icon: {
      ios: 'doc.on.doc',
      android: 'ic_menu_copy_holo_dark',
    },
  },
  DELETE: {
    id: 'delete',
    title: 'Löschen',
    destructive: true,
    icon: {
      ios: 'trash',
      android: 'ic_menu_delete',
    },
  },
} as const;

// Subscription Actions
export const SUBSCRIPTION_ACTIONS = {
  MANAGE: {
    id: 'manage',
    title: 'Abo verwalten',
    icon: {
      ios: 'creditcard',
      android: 'ic_menu_manage',
    },
  },
  RESTORE: {
    id: 'restore',
    title: 'Käufe wiederherstellen',
    icon: {
      ios: 'arrow.clockwise',
      android: 'ic_menu_revert',
    },
  },
  CANCEL: {
    id: 'cancel',
    title: 'Abo kündigen',
    destructive: true,
    icon: {
      ios: 'xmark.circle',
      android: 'ic_menu_close_clear_cancel',
    },
  },
} as const;
