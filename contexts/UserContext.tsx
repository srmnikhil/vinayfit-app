import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'client' | 'trainer' | 'nutritionist' | 'admin' | 'hr' | 'leads';

interface UserContextType {
  userRole: UserRole | null;
  setUserRole: (role: UserRole | null) => void;
  userName: string;
  setUserName: (name: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userName, setUserName] = useState<string>('User');
  const { user } = useAuth();

  useEffect(() => {
    async function fetchProfileRole() {
      if (user) {
        // Always fetch latest profile from Supabase
        try {
          const { data: profile, error } = await import('@/lib/supabase').then(m => m.supabase)
            .then(supabase => supabase
              .from('profiles')
              .select('role, full_name')
              .eq('id', user.id)
              .single()
            );
          if (!error && profile) {
            // Accept 'leads' as a valid role for userRole
            const newRole = (profile.role as UserRole) || 'leads';
            if (userRole && userRole !== newRole) {
              setUserRole(newRole);
              setUserName(typeof profile.full_name === 'string' && profile.full_name ? profile.full_name : (typeof user.email === 'string' && user.email ? user.email.split('@')[0] : 'User'));
              // Use a navigation effect in the tab layout instead of here
            } else {
              setUserRole(newRole);
              setUserName(typeof profile.full_name === 'string' && profile.full_name ? profile.full_name : (typeof user.email === 'string' && user.email ? user.email.split('@')[0] : 'User'));
            }
            return;
          }
        } catch (e) {
          // fallback to metadata
        }
        const role = user.user_metadata?.role || 'client';
        setUserRole(role as UserRole);
        const name = typeof user.user_metadata?.full_name === 'string' && user.user_metadata?.full_name ? user.user_metadata.full_name : (typeof user.email === 'string' && user.email ? user.email.split('@')[0] : 'User');
        setUserName(name);
      } else {
        setUserRole(null);
        setUserName('User');
      }
    }
    fetchProfileRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <UserContext.Provider value={{ userRole, setUserRole, userName, setUserName }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserRole() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserRole must be used within a UserProvider');
  }
  return context;
}