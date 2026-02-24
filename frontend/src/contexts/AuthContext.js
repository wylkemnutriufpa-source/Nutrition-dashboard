import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, getCurrentUser, getUserProfile, signOut } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão inicial
    checkUser();

    // Listener para mudanças de auth
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const userProfile = await getUserProfile(session.user.id);
        setUser(session.user);
        setProfile(userProfile);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        const userProfile = await getUserProfile(currentUser.id);
        setUser(currentUser);
        setProfile(userProfile);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut();
    setUser(null);
    setProfile(null);
  };

  const value = {
    user,
    profile,
    loading,
    logout,
    isAuthenticated: !!user,
    role: profile?.role
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
