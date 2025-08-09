// Local: src/features/auth/context/AuthContext.tsx

import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { UserProfile, AuthState, AuthContextType } from '../types';
import { LoginCredentials, SignUpCredentials } from '../types';

// A URL base da API é lida da variável de ambiente injetada pelo Vite
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://backend.recrutamentoia.com.br';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    profile: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('userProfile');
      if (storedUser) {
        setAuthState({
          profile: JSON.parse(storedUser),
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error("Falha ao carregar perfil do localStorage", error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const updateProfile = (newProfileData: Partial<UserProfile>) => {
    setAuthState(prev => {
      if (!prev.profile) return prev;
      const updatedProfile = { ...prev.profile, ...newProfileData };
      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      return { ...prev, profile: updatedProfile };
    });
  };

  const refetchProfile = useCallback(async () => {
    if (!authState.profile?.id) {
      console.warn("Tentativa de re-sincronizar perfil sem usuário logado.");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${authState.profile.id}`);
      if (!response.ok) {
        throw new Error('Falha ao buscar perfil atualizado.');
      }
      const userProfile = await response.json();
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
      setAuthState(prev => ({ ...prev, profile: userProfile }));
    } catch (error) {
      console.error("Erro ao re-sincronizar o perfil do usuário:", error);
    }
  }, [authState.profile?.id]);

  const signUp = async (credentials: SignUpCredentials): Promise<UserProfile | null> => {
    setAuthError(null);
    setAuthState(prev => ({ ...prev, isLoading: true }));
    try {
      // CORREÇÃO: Adicionado o prefixo /api/ na rota
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao cadastrar. Tente novamente.');
      }
      const userProfile = data.user;
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return userProfile;
    } catch (error: any) {
      setAuthError(error.message || 'Ocorreu um erro ao cadastrar. Tente novamente.');
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return null;
    }
  };

  const signIn = async (credentials: LoginCredentials): Promise<boolean> => {
    setAuthError(null);
    setAuthState(prev => ({ ...prev, isLoading: true }));
    try {
      // CORREÇÃO: A rota foi alterada de /auth/signin para /api/auth/login para corresponder ao backend
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Falha no login. Verifique suas credenciais.');
      }
      const userProfile = data.user;
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
      setAuthState({ profile: userProfile, isAuthenticated: true, isLoading: false });
      return true;
    } catch (error: any) {
      setAuthError(error.message || 'Ocorreu um erro ao fazer login. Tente novamente.');
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  const signOut = () => {
    localStorage.clear();
    setAuthState({ profile: null, isAuthenticated: false, isLoading: false });
  };

  const value = {
    ...authState,
    error: authError,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refetchProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};