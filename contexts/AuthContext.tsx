import {
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    updateProfile
} from 'firebase/auth';
import {
    get,
    onValue,
    ref,
    set,
    update
} from 'firebase/database';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, database } from '../config/firebase';

interface User {
  email: string;
  phone: string;
  displayName: string;
  deviceId?: string;
  claimedDeviceId?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName?: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  let userDataUnsubscribe: (() => void) | null = null;

  useEffect(() => {

    const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        // Clean up previous user data listener
        if (userDataUnsubscribe) {
          userDataUnsubscribe();
          userDataUnsubscribe = null;
        }

        if (firebaseUser) {
          const userRef = ref(database, `users/${firebaseUser.uid}`);
          const snapshot = await get(userRef);
          
          if (snapshot.exists()) {
            const userData = snapshot.val() as User;
            console.log('AuthContext - User data loaded:', userData);
            setUser(userData);
          } else {
            // Create user data if it doesn't exist
            const newUserData: User = {
              email: firebaseUser.email || '',
              phone: '', // Will be updated when user provides phone number
              displayName: firebaseUser.displayName || 'User'
            };
            
            console.log('AuthContext - Creating new user data:', newUserData);
            await set(userRef, newUserData);
            setUser(newUserData);
          }

          // Set up real-time listener for user data changes
          userDataUnsubscribe = onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
              const userData = snapshot.val() as User;
              console.log('AuthContext - User data updated:', userData);
              setUser(userData);
            }
          });

          // Handle any pending device claim stored before signup/login
          try {
            const AsyncStorage = await import('@react-native-async-storage/async-storage');
            const pendingDeviceId = await AsyncStorage.default.getItem('pendingDeviceId');
            const pendingDeviceName = await AsyncStorage.default.getItem('pendingDeviceName');

            console.log('AuthContext - Pending device claim check:', {
              pendingDeviceId,
              pendingDeviceName
            });

            // Fetch the latest user data to check claimed status
            const currentSnapshot = await get(userRef);
            const currentUserData = currentSnapshot.exists() ? (currentSnapshot.val() as User) : null;

            if (pendingDeviceId && !currentUserData?.claimedDeviceId) {
              console.log('AuthContext - Processing pending device claim:', pendingDeviceId);

              const deviceRef = ref(database, `DEVICES/${pendingDeviceId}`);
              const deviceSnapshot = await get(deviceRef);
              if (!deviceSnapshot.exists()) {
                console.error('AuthContext - Pending claim device not found');
              } else {
                const deviceData = deviceSnapshot.val() as any;
                if (deviceData.userId && deviceData.userId !== firebaseUser.uid) {
                  console.error('AuthContext - Pending claim blocked: device claimed by another user');
                } else {
                  // Perform updates: link both sides
                  await Promise.all([
                    update(userRef, { claimedDeviceId: pendingDeviceId }),
                    update(deviceRef, { userId: firebaseUser.uid })
                  ]);
                  console.log('AuthContext - Pending device claim completed:', pendingDeviceId);
                }
              }

              // Clear pending keys regardless
              await AsyncStorage.default.removeItem('pendingDeviceId');
              await AsyncStorage.default.removeItem('pendingDeviceName');
            }
          } catch (claimErr) {
            console.error('AuthContext - Error handling pending device claim:', claimErr);
          }

        } else {
          console.log('AuthContext - User signed out');
          setUser(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      if (userDataUnsubscribe) {
        userDataUnsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      console.log('AuthContext - Attempting login for:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('AuthContext - Login successful');
      
      // Fetch and set user data immediately after login
      const userRef = ref(database, `users/${userCredential.user.uid}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const userData = snapshot.val() as User;
        setUser(userData);
        console.log('AuthContext - User data loaded after login:', userData);
      }

      // Device claiming is now handled in AppRouter after user data is loaded
      console.log('AuthContext - Login completed, device claiming will be handled by AppRouter');

    } catch (error: any) {
      console.error('AuthContext - Login error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address. Please sign up first.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      }
      
      throw new Error(errorMessage);
    }
  };

  const signup = async (email: string, password: string, displayName?: string, phone?: string): Promise<void> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update Firebase Auth profile
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }

    // Create user document in Realtime Database first
    const userData: User = {
      email,
      phone: phone || '',
      displayName: displayName || 'User'
    };

    console.log('AuthContext - Creating user with data:', userData);
    const userRef = ref(database, `users/${userCredential.user.uid}`);
    await set(userRef, userData);

    // Immediately handle any pending device claim saved before signup
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const pendingDeviceId = await AsyncStorage.default.getItem('pendingDeviceId');
      const pendingDeviceName = await AsyncStorage.default.getItem('pendingDeviceName');
      console.log('AuthContext - Signup pending claim check:', { pendingDeviceId, pendingDeviceName });

      if (pendingDeviceId) {
        const deviceRef = ref(database, `DEVICES/${pendingDeviceId}`);
        const deviceSnapshot = await get(deviceRef);
        if (deviceSnapshot.exists()) {
          const deviceData = deviceSnapshot.val() as any;
          if (!deviceData.userId) {
            await Promise.all([
              update(userRef, { claimedDeviceId: pendingDeviceId }),
              update(deviceRef, { userId: userCredential.user.uid })
            ]);
            console.log('AuthContext - Signup claimed device immediately:', pendingDeviceId);
          } else {
            console.log('AuthContext - Signup pending claim skipped: device already claimed');
          }
        } else {
          console.log('AuthContext - Signup pending claim skipped: device not found');
        }

        // Clear pending claim keys
        await AsyncStorage.default.removeItem('pendingDeviceId');
        await AsyncStorage.default.removeItem('pendingDeviceName');
      }
    } catch (claimErr) {
      console.error('AuthContext - Error claiming device during signup:', claimErr);
    }

    // Device claiming is also handled in AppRouter after user data is loaded as a fallback
    console.log('AuthContext - Signup completed');
  };

  const logout = async (): Promise<void> => {
    try {
      // Clean up user data listener if it exists
      if (userDataUnsubscribe) {
        userDataUnsubscribe();
        userDataUnsubscribe = null;
      }
      
      // Sign out from Firebase
      await firebaseSignOut(auth);
      
      // Clear any pending device claim keys to avoid accidental claiming on next login
      try {
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        await AsyncStorage.default.removeItem('pendingDeviceId');
        await AsyncStorage.default.removeItem('pendingDeviceName');
      } catch (e) {
        console.warn('AuthContext - Could not clear pending device claim on logout');
      }

      // Clear user state
      setUser(null);
      
      console.log('AuthContext - User logged out successfully');
    } catch (error) {
      console.error('AuthContext - Logout error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};