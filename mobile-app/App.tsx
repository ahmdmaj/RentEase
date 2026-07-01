import React, { useEffect } from 'react';
import { supabase } from './src/services/supabase';
import { useAuthStore } from './src/store/authStore';
import AppNavigator from './src/navigation/appNavigator';
import * as SplashScreen from 'expo-splash-screen';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const { setSession } = useAuthStore();

  useEffect(() => {
    let isMounted = true;

    // Safety fallback: ensure loading spinner never gets stuck if storage/network hangs
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('Session check timed out. Proceeding to login screen.');
        setSession(null);
        SplashScreen.hideAsync().catch(() => {});
      }
    }, 3000);

    // Check current session on app load
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (isMounted) {
          clearTimeout(timeoutId);
          setSession(session);
          SplashScreen.hideAsync().catch(() => {});
        }
      })
      .catch((error) => {
        console.error('Error checking session:', error);
        if (isMounted) {
          clearTimeout(timeoutId);
          setSession(null);
          SplashScreen.hideAsync().catch(() => {});
        }
      });

    // Listen for auth changes (sign in, sign out)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (isMounted) {
          setSession(session);
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return <AppNavigator />;
}