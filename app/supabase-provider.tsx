'use client';

import { createContext, useContext, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const SupabaseContext = createContext<SupabaseClient | undefined>(undefined);

export default function SupabaseProvider({
                                             children,
                                         }: {
    children: React.ReactNode;
}) {
    const [supabase] = useState(() => createClient(supabaseUrl, supabaseAnonKey));

    return (
        <SupabaseContext.Provider value={supabase}>
            {children}
        </SupabaseContext.Provider>
    );
}

export function useSupabase() {
    const context = useContext(SupabaseContext);
    if (context === undefined) {
        throw new Error('useSupabase must be used within a SupabaseProvider');
    }
    return context;
}