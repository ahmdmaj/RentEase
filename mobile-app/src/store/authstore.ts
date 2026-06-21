import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { Session, User } from '@supabase/supabase-js';

interface AuthState {
    session: Session | null;
    user: User | null;
    loading: boolean;
    setSession: (session: Session | null) => void;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signUp: (email: string, password: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    session: null,
    user: null,
    loading: true,

    setSession: (session) => {
        set({ session, user: session?.user ?? null, loading: false });
    },

    signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (!error && data.session) {
            set({ session: data.session, user: data.user });
        }
        return { error };
    },

    signUp: async (email, password) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });
        if (!error && data.session) {
            set({ session: data.session, user: data.user });
        }
        return { error };
    },

    signOut: async () => {
        await supabase.auth.signOut();
        set({ session: null, user: null });
    },
}));