import React, { createContext, useContext, useState, ReactNode } from 'react';

// Interface für die Header-Konfiguration
export interface HeaderIcon {
  name: string;
  onPress?: () => void;
  href?: string;
  customElement?: React.ReactNode;
}

export interface TagItem {
  id: string;
  name: string;
  color: string;
}

export interface HeaderConfig {
  title?: string;
  showBackButton?: boolean;
  rightIcons?: HeaderIcon[];
  showMenu?: boolean;
  selectedTags?: TagItem[];
  onTagRemove?: (tagId: string) => void;
  isHomePage?: boolean;
  scrollableTitle?: boolean;
  showTitle?: boolean;
  isMemoDetailPage?: boolean;
  backgroundColor?: string;
}

// Context für die Header-Konfiguration
interface HeaderContextType {
  config: HeaderConfig;
  updateConfig: (newConfig: Partial<HeaderConfig>) => void;
  resetConfig: () => void;
}

const defaultConfig: HeaderConfig = {
  title: 'Memoro',
  showBackButton: false,
  rightIcons: [],
  showMenu: true,
  selectedTags: [],
  isHomePage: false,
  showTitle: true,
  isMemoDetailPage: false,
};

const HeaderContext = createContext<HeaderContextType>({
  config: defaultConfig,
  updateConfig: () => {},
  resetConfig: () => {},
});

// Hook für den Zugriff auf den Header-Context
export const useHeader = () => useContext(HeaderContext);

// Provider-Komponente für den Header-Context
export const HeaderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<HeaderConfig>(defaultConfig);

  const updateConfig = (newConfig: Partial<HeaderConfig>) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      ...newConfig,
    }));
  };

  const resetConfig = () => {
    setConfig(defaultConfig);
  };

  return (
    <HeaderContext.Provider value={{ config, updateConfig, resetConfig }}>
      {children}
    </HeaderContext.Provider>
  );
};
