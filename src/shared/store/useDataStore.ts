// Local: src/shared/store/useDataStore.ts

import { create } from 'zustand';
import { JobPosting } from '../../features/screening/types';
import { Candidate } from '../types';
import { UserProfile } from '../../features/auth/types';

// A URL base da API é lida da variável de ambiente injetada pelo Vite
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://backend.recrutamentoia.com.br';

interface DataState {
  jobs: JobPosting[];
  candidates: Candidate[];
  isDataLoading: boolean;
  error: string | null;
  fetchAllData: (profile: UserProfile) => Promise<void>;
  addJob: (job: JobPosting) => void;
  updateJobInStore: (job: JobPosting) => void;
  deleteJobById: (jobId: number) => Promise<void>;
  updateCandidateStatusInStore: (candidateId: number, newStatus: 'Triagem' | 'Entrevista' | 'Aprovado' | 'Reprovado') => void;
}

export const useDataStore = create<DataState>((set) => ({
    jobs: [],
    candidates: [],
    isDataLoading: false, // Inicia como false, será true durante o fetch
    error: null,
    
    // --- CORREÇÃO APLICADA AQUI ---
    // A função agora faz uma única chamada para a rota /api/data/all/:userId
    // e extrai 'jobs' e 'candidates' da resposta.
    fetchAllData: async (profile: UserProfile) => {
        set({ isDataLoading: true, error: null });
        try {
            // 1. Faz a chamada para o endpoint centralizado que já retorna tudo.
            const response = await fetch(`${API_BASE_URL}/api/data/all/${profile.id}`);
            if (!response.ok) {
                throw new Error('Falha ao carregar dados do servidor.');
            }
            // 2. Extrai 'jobs' e 'candidates' da resposta JSON.
            const { jobs, candidates } = await response.json();

            // 3. Atualiza o estado com os dados recebidos.
            set({ jobs: jobs || [], candidates: candidates || [], isDataLoading: false });

        } catch (err: any) {
            console.error("Erro ao buscar dados (useDataStore):", err);
            set({ error: 'Falha ao carregar dados.', jobs: [], candidates: [], isDataLoading: false });
        }
    },
    
    addJob: (job: JobPosting) => {
        set((state) => ({ jobs: [job, ...state.jobs] }));
    },
    
    updateJobInStore: (updatedJob: JobPosting) => {
        set((state) => ({
            jobs: state.jobs.map(job => job.id === updatedJob.id ? updatedJob : job)
        }));
    },
    
    deleteJobById: async (jobId: number) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Não foi possível excluir a vaga.");
            }
            
            set((state) => ({
                jobs: state.jobs.filter(job => job.id !== jobId)
            }));
        } catch (error) {
            console.error("Erro ao deletar vaga (useDataStore):", error);
            throw error;
        }
    },

    updateCandidateStatusInStore: (candidateId: number, newStatus: 'Triagem' | 'Entrevista' | 'Aprovado' | 'Reprovado') => {
        set((state) => ({
            candidates: state.candidates.map(c => 
                c.id === candidateId ? { ...c, status: { id: 0, value: newStatus } } : c
            )
        }));
    },
}));