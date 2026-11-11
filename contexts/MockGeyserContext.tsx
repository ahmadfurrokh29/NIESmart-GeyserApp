import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './MockAuthContext';

export interface Geyser {
  id: string;
  name: string;
  qrCode: string;
  status: 'online' | 'offline' | 'maintenance';
  temperature: number;
  targetTemperature: number;
  isActive: boolean;
  location: string;
  lastSeen: Date;
  energyUsage: number;
  mode: 'electric' | 'gas' | 'hybrid' | 'eco';
  userId: string;
  createdAt: Date;
}

export interface GeyserRealtimeData {
  temperature: number;
  targetTemperature: number;
  isHeating: boolean;
  energyUsage: number;
  waterFlow: number;
  pressure: number;
  timestamp: number;
}

interface GeyserContextType {
  geysers: Geyser[];
  activeGeyser: Geyser | null;
  realtimeData: GeyserRealtimeData | null;
  loading: boolean;
  addGeyser: (geyser: Omit<Geyser, 'id' | 'userId' | 'createdAt'>) => Promise<string>;
  updateGeyser: (id: string, data: Partial<Geyser>) => Promise<void>;
  removeGeyser: (id: string) => Promise<void>;
  setActiveGeyser: (geyserId: string) => void;
  updateGeyserSettings: (geyserId: string, temperature: number, mode: string) => Promise<void>;
}

const GeyserContext = createContext<GeyserContextType | undefined>(undefined);

export const useGeyser = () => {
  const context = useContext(GeyserContext);
  if (context === undefined) {
    throw new Error('useGeyser must be used within a GeyserProvider');
  }
  return context;
};

export const GeyserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [geysers, setGeysers] = useState<Geyser[]>([]);
  const [activeGeyser, setActiveGeyserState] = useState<Geyser | null>(null);
  const [realtimeData, setRealtimeData] = useState<GeyserRealtimeData | null>(null);
  const [loading, setLoading] = useState(true);

  // Load mock data when user changes
  useEffect(() => {
    if (!user) {
      setGeysers([]);
      setActiveGeyserState(null);
      setRealtimeData(null);
      setLoading(false);
      return;
    }

    loadUserData();
  }, [user]);

  // Simulate realtime data updates
  useEffect(() => {
    if (!activeGeyser) {
      setRealtimeData(null);
      return;
    }

    // Create initial realtime data
    const initialData: GeyserRealtimeData = {
      temperature: activeGeyser.temperature,
      targetTemperature: activeGeyser.targetTemperature,
      isHeating: activeGeyser.temperature < activeGeyser.targetTemperature,
      energyUsage: activeGeyser.energyUsage,
      waterFlow: Math.random() * 10 + 5, // Random flow between 5-15 L/min
      pressure: Math.random() * 0.5 + 1, // Random pressure between 1-1.5 bar
      timestamp: Date.now(),
    };

    setRealtimeData(initialData);

    // Simulate realtime updates every 5 seconds
    const interval = setInterval(() => {
      setRealtimeData(prev => {
        if (!prev) return null;
        
        const tempDiff = prev.targetTemperature - prev.temperature;
        const newTemp = prev.isHeating 
          ? Math.min(prev.temperature + 0.5, prev.targetTemperature)
          : Math.max(prev.temperature - 0.2, 20);

        return {
          ...prev,
          temperature: newTemp,
          isHeating: newTemp < prev.targetTemperature,
          energyUsage: prev.isHeating ? prev.energyUsage + 0.1 : prev.energyUsage,
          waterFlow: Math.random() * 10 + 5,
          pressure: Math.random() * 0.5 + 1,
          timestamp: Date.now(),
        };
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [activeGeyser]);

  const loadUserData = async () => {
    try {
      const storedGeysers = await AsyncStorage.getItem(`mockGeysers_${user?.uid}`);
      const userGeysers = storedGeysers ? JSON.parse(storedGeysers) : [];

      // Convert date strings back to Date objects
      const processedGeysers = userGeysers.map((g: any) => ({
        ...g,
        lastSeen: new Date(g.lastSeen),
        createdAt: new Date(g.createdAt),
      }));

      setGeysers(processedGeysers);

      // Set first geyser as active if none selected
      if (processedGeysers.length > 0 && !activeGeyser) {
        setActiveGeyserState(processedGeysers[0]);
      }

      setLoading(false);
    } catch (error) {
      console.log('Error loading user data:', error);
      setLoading(false);
    }
  };

  const saveGeysers = async (newGeysers: Geyser[]) => {
    try {
      await AsyncStorage.setItem(`mockGeysers_${user?.uid}`, JSON.stringify(newGeysers));
    } catch (error) {
      console.log('Error saving geysers:', error);
    }
  };



  const addGeyser = async (geyserData: Omit<Geyser, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const newGeyser: Geyser = {
        ...geyserData,
        id: Date.now().toString(),
        userId: user.uid,
        createdAt: new Date(),
        lastSeen: new Date(),
      };

      const updatedGeysers = [...geysers, newGeyser];
      setGeysers(updatedGeysers);
      await saveGeysers(updatedGeysers);

      // Set as active if it's the first geyser
      if (updatedGeysers.length === 1) {
        setActiveGeyserState(newGeyser);
      }

      return newGeyser.id;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const updateGeyser = async (id: string, data: Partial<Geyser>) => {
    try {
      const updatedGeysers = geysers.map(g => 
        g.id === id 
          ? { ...g, ...data, lastSeen: new Date() }
          : g
      );
      
      setGeysers(updatedGeysers);
      await saveGeysers(updatedGeysers);

      // Update active geyser if it's the one being updated
      if (activeGeyser?.id === id) {
        setActiveGeyserState(updatedGeysers.find(g => g.id === id) || null);
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const removeGeyser = async (id: string) => {
    try {
      const updatedGeysers = geysers.filter(g => g.id !== id);
      setGeysers(updatedGeysers);
      await saveGeysers(updatedGeysers);

      // Update active geyser if the removed one was active
      if (activeGeyser?.id === id) {
        setActiveGeyserState(updatedGeysers.length > 0 ? updatedGeysers[0] : null);
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const setActiveGeyser = (geyserId: string) => {
    const geyser = geysers.find(g => g.id === geyserId);
    if (geyser) {
      setActiveGeyserState(geyser);
    }
  };



  const updateGeyserSettings = async (geyserId: string, temperature: number, mode: string) => {
    try {
      await updateGeyser(geyserId, {
        targetTemperature: temperature,
        mode: mode as any,
      });

      // Update realtime data immediately
      if (activeGeyser?.id === geyserId) {
        setRealtimeData(prev => prev ? {
          ...prev,
          targetTemperature: temperature,
          timestamp: Date.now(),
        } : null);
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const value: GeyserContextType = {
    geysers,
    activeGeyser,
    realtimeData,
    loading,
    addGeyser,
    updateGeyser,
    removeGeyser,
    setActiveGeyser,
    updateGeyserSettings,
  };

  return (
    <GeyserContext.Provider value={value}>
      {children}
    </GeyserContext.Provider>
  );
};