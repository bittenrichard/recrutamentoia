// Local: src/shared/hooks/useGoogleAuth.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { UserProfile } from '../../features/auth/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://backend.recrutamentoia.com.br';

const hasGoogleToken = (profile: UserProfile | null): boolean => {
  return !!profile && !!profile.google_refresh_token;
};

export const useGoogleAuth = () => {
  const { profile, refetchProfile } = useAuth();
  const [isGoogleConnected, setIsGoogleConnected] = useState(hasGoogleToken(profile));
  
  // Usamos uma referência para saber se iniciamos o processo de conexão.
  const isConnecting = useRef(false);

  useEffect(() => {
    setIsGoogleConnected(hasGoogleToken(profile));
  }, [profile]);

  // --- LÓGICA DE ATUALIZAÇÃO REFINADA ---
  // Esta lógica escuta quando a janela principal da aplicação ganha foco novamente.
  useEffect(() => {
    const handleFocus = () => {
      // Se a janela ganhou foco e nós estávamos no meio de um processo de conexão...
      if (isConnecting.current) {
        console.log("[useGoogleAuth] Janela principal recuperou o foco. Verificando status da conexão...");
        // ...então, buscamos o perfil mais recente do servidor.
        refetchProfile();
        // Resetamos a flag para não buscar novamente sem necessidade.
        isConnecting.current = false;
      }
    };

    // Adiciona o "ouvinte" de foco à janela.
    window.addEventListener('focus', handleFocus);
    // Remove o "ouvinte" quando o componente for desmontado para evitar vazamentos de memória.
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [refetchProfile]); // A dependência aqui é apenas a função refetchProfile.
  // --- FIM DA LÓGICA DE ATUALIZAÇÃO ---


  const connectGoogleCalendar = useCallback(async () => {
    if (!profile) {
      alert('Você precisa estar logado para conectar sua agenda.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/google/auth/connect?userId=${profile.id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao obter URL de autenticação do servidor.');
      }
      
      const { url } = await response.json();
      
      if (url) {
        // 1. Ativamos a nossa flag para indicar que um processo de conexão foi iniciado.
        isConnecting.current = true;
        
        // 2. Abrimos o popup. O useEffect de 'focus' agora cuidará da atualização.
        window.open(url, '_blank', 'width=600,height=700,noopener,noreferrer');
      }
    } catch (error) {
      console.error('Erro ao iniciar conexão com Google:', error);
      alert('Não foi possível iniciar a conexão com o Google Calendar. Verifique o console para mais detalhes.');
    }
  }, [profile]);

  const disconnectGoogleCalendar = useCallback(async () => {
    if (!profile) return;
    try {
      await fetch(`${API_BASE_URL}/api/google/auth/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id }),
      });

      console.log("[useGoogleAuth] Desconectado. Buscando perfil atualizado...");
      refetchProfile();
    } catch (error) {
      console.error('Erro ao desconectar do Google:', error);
      alert('Não foi possível desconectar a conta do Google.');
    }
  }, [profile, refetchProfile]);

  return {
    isGoogleConnected,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
  };
};