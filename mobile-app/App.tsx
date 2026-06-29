import React, { useEffect } from 'react';
import { supabase } from './src/services/supabase';
import { useAuthStore } from './src/store/authStore';
import AppNavigator from './src/navigation/appNavigator';
import * as SplashScreen from 'expo-splash-screen';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function App() {
  const { setSession } = useAuthStore();

  useEffect(() => {
    // Check current session on app load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      // Hide the splash screen AFTER we have checked the session
      SplashScreen.hideAsync();
    });

    // Listen for auth changes (sign in, sign out)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return <AppNavigator />;
}