import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

type Role = 'admin' | 'customer';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      await determineRole(currentUser);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      await determineRole(currentUser);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const determineRole = async (currentUser: User | null) => {
    if (!currentUser) {
      setRole(null);
      return;
    }
    
    const emailLower = (currentUser.email || '').toLowerCase().trim();
    const isKnownAdmin = 
      currentUser.user_metadata?.role === 'admin' ||
      currentUser.app_metadata?.role === 'admin' ||
      emailLower === 'admin@aloeflora.com' ||
      emailLower === 'info@aloefloraproducts.com' ||
      emailLower === 'admin@aloefloraproducts.com';

    if (isKnownAdmin) {
      setRole('admin');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .maybeSingle();
        
      if (!error && data && data.role === 'admin') {
        setRole('admin');
      } else {
        setRole('customer');
      }
    } catch (err) {
      console.error("Error fetching user role:", err);
      setRole('customer');
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
