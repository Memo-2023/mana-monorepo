import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome, FontAwesome5, AntDesign, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { SymbolView, SymbolViewProps, SFSymbol } from 'expo-symbols';

export type IconSet = 'material' | 'ionicons' | 'fontawesome' | 'fontawesome5' | 'antdesign' | 'feather' | 'materialcommunity' | 'sf-symbols';

type IconNames = {
  material: keyof typeof MaterialIcons.glyphMap;
  ionicons: keyof typeof Ionicons.glyphMap;
  fontawesome: keyof typeof FontAwesome.glyphMap;
  fontawesome5: keyof typeof FontAwesome5.glyphMap;
  antdesign: keyof typeof AntDesign.glyphMap;
  feather: keyof typeof Feather.glyphMap;
  materialcommunity: keyof typeof MaterialCommunityIcons.glyphMap;
  'sf-symbols': SFSymbol;
};

interface BaseIconProps {
  size?: number;
  color?: string;
  style?: any;
  containerStyle?: 'round' | 'none';
  containerColor?: string;
  containerSize?: number;
}

interface MaterialIconProps extends BaseIconProps {
  set?: 'material';
  name: IconNames['material'];
}

interface IoniconsIconProps extends BaseIconProps {
  set: 'ionicons';
  name: IconNames['ionicons'];
}

interface FontAwesomeIconProps extends BaseIconProps {
  set: 'fontawesome';
  name: IconNames['fontawesome'];
}

interface FontAwesome5IconProps extends BaseIconProps {
  set: 'fontawesome5';
  name: IconNames['fontawesome5'];
}

interface AntDesignIconProps extends BaseIconProps {
  set: 'antdesign';
  name: IconNames['antdesign'];
}

interface FeatherIconProps extends BaseIconProps {
  set: 'feather';
  name: IconNames['feather'];
}

interface MaterialCommunityIconProps extends BaseIconProps {
  set: 'materialcommunity';
  name: IconNames['materialcommunity'];
}

interface SFSymbolIconProps extends BaseIconProps {
  set: 'sf-symbols';
  name: SFSymbol;
  weight?: SymbolViewProps['weight'];
  scale?: SymbolViewProps['scale'];
  renderingMode?: SymbolViewProps['type'];
}

type IconProps = 
  | MaterialIconProps
  | IoniconsIconProps
  | FontAwesomeIconProps
  | FontAwesome5IconProps
  | AntDesignIconProps
  | FeatherIconProps
  | MaterialCommunityIconProps
  | SFSymbolIconProps;

/**
 * Universal Icon component that supports multiple icon libraries
 * On iOS, it can use native SF Symbols for better integration
 *
 * @example
 * // Default (Material Icons)
 * <Icon name="home" size={24} color="white" />
 *
 * // Ionicons
 * <Icon set="ionicons" name="home" size={24} color="white" />
 *
 * // SF Symbols (iOS only)
 * <Icon set="sf-symbols" name="house.fill" size={24} color="white" />
 *
 * // With round container
 * <Icon set="ionicons" name="settings-outline" size={24} color="white" containerStyle="round" containerColor="rgba(255, 255, 255, 0.1)" />
 */
const Icon: React.FC<IconProps> = (props) => {
  const {
    size = 24,
    color = 'white',
    style,
    containerStyle = 'none',
    containerColor = 'rgba(255, 255, 255, 0.1)',
    containerSize,
    ...rest
  } = props;
  const set = props.set || 'material';

  // Render the actual icon
  const renderIcon = () => {
    // Use SF Symbols on iOS when available and requested
    if (set === 'sf-symbols') {
      if (Platform.OS === 'ios') {
        const sfProps = props as SFSymbolIconProps;
        return (
          <SymbolView
            name={sfProps.name}
            size={size}
            tintColor={color}
            weight={sfProps.weight}
            scale={sfProps.scale}
            type={sfProps.renderingMode || 'monochrome'}
            style={style}
          />
        );
      } else {
        // Fallback to Ionicons on non-iOS platforms
        const fallbackName = mapSFSymbolToIonicon(props.name as SFSymbol);
        return <Ionicons name={fallbackName} size={size} color={color} style={style} />;
      }
    }

    // Handle other icon sets
    switch (set) {
      case 'ionicons':
        return <Ionicons name={(props as IoniconsIconProps).name} size={size} color={color} style={style} />;
      case 'fontawesome':
        return <FontAwesome name={(props as FontAwesomeIconProps).name} size={size} color={color} style={style} />;
      case 'fontawesome5':
        return <FontAwesome5 name={(props as FontAwesome5IconProps).name} size={size} color={color} style={style} />;
      case 'antdesign':
        return <AntDesign name={(props as AntDesignIconProps).name} size={size} color={color} style={style} />;
      case 'feather':
        return <Feather name={(props as FeatherIconProps).name} size={size} color={color} style={style} />;
      case 'materialcommunity':
        return <MaterialCommunityIcons name={(props as MaterialCommunityIconProps).name} size={size} color={color} style={style} />;
      case 'material':
      default:
        return <MaterialIcons name={(props as MaterialIconProps).name} size={size} color={color} style={style} />;
    }
  };

  // Wrap in container if requested
  if (containerStyle === 'round') {
    const finalContainerSize = containerSize || size * 1.75;
    return (
      <View style={[
        styles.roundContainer,
        {
          width: finalContainerSize,
          height: finalContainerSize,
          borderRadius: finalContainerSize / 2,
          backgroundColor: containerColor,
        }
      ]}>
        {renderIcon()}
      </View>
    );
  }

  return renderIcon();
};

// Helper function to map SF Symbol names to Ionicons for non-iOS platforms
function mapSFSymbolToIonicon(sfSymbol: SFSymbol): keyof typeof Ionicons.glyphMap {
  // Common mappings - extend as needed
  const mappings: Record<string, keyof typeof Ionicons.glyphMap> = {
    'house.fill': 'home',
    'house': 'home-outline',
    'gear': 'settings-outline',
    'person.fill': 'person',
    'person': 'person-outline',
    'magnifyingglass': 'search',
    'plus': 'add',
    'minus': 'remove',
    'xmark': 'close',
    'checkmark': 'checkmark',
    'chevron.left': 'chevron-back',
    'chevron.right': 'chevron-forward',
    'chevron.up': 'chevron-up',
    'chevron.down': 'chevron-down',
    'arrow.left': 'arrow-back',
    'arrow.right': 'arrow-forward',
    'heart.fill': 'heart',
    'heart': 'heart-outline',
    'star.fill': 'star',
    'star': 'star-outline',
    'trash': 'trash-outline',
    'pencil': 'pencil',
    'square.and.arrow.up': 'share-outline',
    'doc.text': 'document-text-outline',
    'folder': 'folder-outline',
    'camera': 'camera-outline',
    'photo': 'image-outline',
    'envelope': 'mail-outline',
    'bell': 'notifications-outline',
    'bell.fill': 'notifications',
    'lock': 'lock-closed-outline',
    'lock.fill': 'lock-closed',
    'qrcode': 'qr-code',
    'water.waves': 'water',
    'sparkles': 'sparkles',
    'wand.and.stars': 'sparkles',
    'book': 'book-outline',
    'book.fill': 'book',
    'bubble.left': 'chatbubble-outline',
    'bubble.left.fill': 'chatbubble',
    'archivebox': 'archive-outline',
    'archivebox.fill': 'archive',
    'arrow.down.to.line': 'enter-outline',
    'rectangle.and.pencil.and.ellipsis': 'create-outline',
  };

  return mappings[sfSymbol] || 'help-circle-outline';
}

const styles = StyleSheet.create({
  roundContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Icon;