import React, { createContext, useContext, ReactNode } from 'react';
import { sanitizeRoomName } from '../utils/roomUtils';

interface RoomContextType {
  onNavigate: (roomName: string) => void;
}

const RoomContext = createContext<RoomContextType | null>(null);

interface NavigationProviderProps {
  children: ReactNode;
  onNavigate: (roomName: string) => void;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ 
  children, 
  onNavigate 
}) => {
  const handleNavigate = (roomName: string) => {
    const sanitizedName = sanitizeRoomName(roomName);
    if (sanitizedName) {
      onNavigate(sanitizedName);
      const newPath = sanitizedName === 'main' ? '/' : `/t/${sanitizedName}`;
      window.history.pushState({}, '', newPath);
    }
  };

  return (
    <RoomContext.Provider value={{ onNavigate: handleNavigate }}>
      {children}
    </RoomContext.Provider>
  );
};

export const useRoomNavigation = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoomNavigation must be used within a NavigationProvider');
  }
  return context;
}; 