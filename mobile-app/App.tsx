import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from './src/services/supabase';
import { useAuthStore } from './src/store/authStore';
import AppNavigator from './src/navigation/appNavigator';
import * as SplashScreen from 'expo-splash-screen';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {});

// Tells Supabase Auth to continuously refresh the session automatically if
// the app is in the foreground. When this is added, you will continue to receive
// `onAuthStateChange` events with the `TOKEN_REFRESHED` or `SIGNED_OUT` event
// if the user's session is terminated. This should only be registered once.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

export default function App() {
  const { setSession } = useAuthStore();

  useEffect(() => {
    let isMounted = true;

    // Handle deep links (e.g. Magic Links, Password Resets)
    const handleDeepLink = async (event: { url: string }) => {
      try {
        if (!event.url) return;
        const urlObj = new URL(event.url);
        
        let params = new URLSearchParams(urlObj.hash.substring(1));
        if (!params.has('access_token')) {
            params = new URLSearchParams(urlObj.search);
        }
        
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
        }
      } catch (e) {
        // Silently fail on invalid URLs
      }
    };

    const linkSub = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

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
      linkSub.remove();
    };
  }, []);

  return <AppNavigator />;
}