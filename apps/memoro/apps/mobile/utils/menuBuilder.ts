import { Platform } from 'react-native';
import type { MenuActionConfig } from '~/config/menuActions';

export interface NativeMenuAction {
  id: string;
  title: string;
  titleColor?: string;
  subtitle?: string;
  image?: string | { iconType: 'SYSTEM'; iconValue: string };
  imageColor?: string;
  attributes?: {
    destructive?: boolean;
    disabled?: boolean;
    hidden?: boolean;
  };
  state?: 'on' | 'off' | 'mixed';
}

/**
 * Konvertiert eine MenuActionConfig in ein natives MenuView Action-Objekt
 */
export const buildMenuAction = (action: MenuActionConfig): NativeMenuAction => {
  return {
    id: action.id,
    title: action.title,
    titleColor: action.color,
    image: action.icon
      ? Platform.select({
          ios: { iconType: 'SYSTEM', iconValue: action.icon.ios },
          android: action.icon.android,
        })
      : undefined,
    attributes: {
      destructive: action.destructive,
    },
  };
};

/**
 * Konvertiert mehrere MenuActionConfigs in native Actions
 */
export const buildMenuActions = (actions: MenuActionConfig[]): NativeMenuAction[] => {
  return actions.map(buildMenuAction);
};
