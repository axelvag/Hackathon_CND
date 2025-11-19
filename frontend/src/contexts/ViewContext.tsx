import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loadViewMode, saveViewMode, ViewMode } from '../utils/storage';

interface ViewContextType {
  viewMode: ViewMode;
  toggleViewMode: () => void;
  setViewMode: (mode: ViewMode) => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export function ViewProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => loadViewMode());

  useEffect(() => {
    saveViewMode(viewMode);
  }, [viewMode]);

  const toggleViewMode = () => {
    setViewModeState((prev) => (prev === 'technician' ? 'expert' : 'technician'));
  };

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
  };

  return (
    <ViewContext.Provider value={{ viewMode, toggleViewMode, setViewMode }}>
      {children}
    </ViewContext.Provider>
  );
}

export function useView(): ViewContextType {
  const context = useContext(ViewContext);
  if (context === undefined) {
    throw new Error('useView must be used within a ViewProvider');
  }
  return context;
}

