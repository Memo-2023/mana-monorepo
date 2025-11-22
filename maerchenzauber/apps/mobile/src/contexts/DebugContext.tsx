import React, { createContext, useContext, useState } from 'react';

interface DebugContextType {
  debugBordersEnabled: boolean;
  toggleDebugBorders: () => void;
}

const DebugContext = createContext<DebugContextType | undefined>(undefined);

export const useDebug = () => {
  const context = useContext(DebugContext);
  if (!context) {
    throw new Error('useDebug must be used within a DebugProvider');
  }
  return context;
};

export const DebugProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [debugBordersEnabled, setDebugBordersEnabled] = useState(false);

  const toggleDebugBorders = () => {
    setDebugBordersEnabled(prev => !prev);
  };

  return (
    <DebugContext.Provider value={{ debugBordersEnabled, toggleDebugBorders }}>
      {children}
    </DebugContext.Provider>
  );
};
