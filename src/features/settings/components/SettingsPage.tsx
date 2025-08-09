// Local: src/features/settings/components/SettingsPage.tsx

import React from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import UpdateProfileForm from './UpdateProfileForm';
import UpdatePasswordForm from './UpdatePasswordForm';
import { useGoogleAuth } from '../../../shared/hooks/useGoogleAuth';
import { Loader2 } from 'lucide-react';

const SettingsPage: React.FC = () => {
    const { profile, isLoading, updateProfile } = useAuth();
    const { isGoogleConnected, connectGoogleCalendar, disconnectGoogleCalendar } = useGoogleAuth();

    if (isLoading || !profile) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
        );
    }
    
    // --- MUDANÇA AQUI ---
    // Adicionamos e.stopPropagation() para evitar que o evento de clique
    // se propague para outros elementos e cause re-renderizações inesperadas.
    const handleConnectClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation(); // Impede a propagação do evento
        connectGoogleCalendar();
    };

    const handleDisconnectClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation(); // Impede a propagação do evento
        disconnectGoogleCalendar();
    };

    return (
        <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Configurações</h1>
            <div className="space-y-10">
                <UpdateProfileForm profile={profile} onProfileUpdate={updateProfile} />
                
                <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-xl font-semibold mb-2 text-gray-800">Integrações</h3>
                    <p className="text-sm text-gray-500 mb-6">Conecte sua conta para agendar entrevistas diretamente no seu calendário.</p>
                    <div className="flex items-center justify-between p-4 border rounded-md">
                        <div className="flex items-center gap-4">
                            <img src="/google-calendar-icon.png" alt="Google Calendar" className="h-10 w-10" />
                            <div>
                                <h4 className="font-semibold text-gray-700">Google Calendar</h4>
                                <span className={`text-sm font-medium ${isGoogleConnected ? 'text-green-600' : 'text-gray-500'}`}>
                                    {isGoogleConnected ? 'Conectado' : 'Não conectado'}
                                </span>
                            </div>
                        </div>
                        {isGoogleConnected ? (
                            <button
                                type="button"
                                onClick={handleDisconnectClick}
                                className="px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-md hover:bg-red-200 transition-colors"
                            >
                                Desconectar
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleConnectClick}
                                className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors"
                            >
                                Conectar
                            </button>
                        )}
                    </div>
                </div>

                <UpdatePasswordForm />
            </div>
        </div>
    );
};

export default SettingsPage;