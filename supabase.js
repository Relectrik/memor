// supabase.js
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// — replace these with your actual Supabase Project URL + ANON KEY —
const SUPABASE_URL = 'https://xyz123.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhb...your-anon-key...';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Tell Supabase to store session in AsyncStorage (RN environment)
    storage: AsyncStorage,
    // Set the URL that Supabase will redirect to after OAuth
    // Use Expo’s proxy for development: exp://, which opens in Expo Go
    // Expo will intercept the deep-link automatically.
    autoRefreshToken: true,
    persistSession: true,
  },
});
