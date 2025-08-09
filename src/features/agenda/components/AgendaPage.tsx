// Local: src/features/agenda/components/AgendaPage.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { CalendarEvent, ScheduleEvent } from '../types';
import EventDetailModal from './EventDetailModal';
import DailyEventsSidebar from './DailyEventsSidebar'; 
import { useAuth } from '../../../features/auth/hooks/useAuth';
import MonthView from './MonthView'; 
import WeekView from './WeekView'; 
import DayView from './DayView';   

// CORREÇÃO: Definindo a URL base da API para todas as chamadas.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://backend.recrutamentoia.com.br';

type CustomView = 'month' | 'week' | 'day';

const generateColorForId = (id: number) => {
  const colors = [
    '#4f46e5', '#059669', '#db2777', '#d97706', '#0891b2', 
    '#6d28d9', '#be185d', '#ef4444', '#f97316', '#eab308',
    '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
    '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
  ];
  return colors[id % colors.length];
};

const AgendaPage: React.FC = () => {
  const { profile } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayForSidebar, setSelectedDayForSidebar] = useState(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState<CustomView>('month');

  const vagaColorMap = useMemo(() => {
    const map = new Map<number, string>();
    events.forEach(event => {
      const vagaId = event.resource.Vaga?.[0]?.id;
      if (vagaId && !map.has(vagaId)) {
        map.set(vagaId, generateColorForId(vagaId));
      }
    });
    return map;
  }, [events]);

  const dailyEvents = useMemo(() => {
    return events.filter(event => 
      isSameDay(event.start, selectedDayForSidebar)
    ).sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [events, selectedDayForSidebar]);

  const fetchSchedules = useCallback(async () => {
    if (!profile?.id) {
      setIsLoading(false);
      setError("Usuário não logado. Não foi possível carregar agendamentos.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // CORREÇÃO: Adicionada a URL base da API.
      const response = await fetch(`${API_BASE_URL}/api/schedules/${profile.id}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Erro ao buscar agendamentos do backend.');
      }
      const { results } = await response.json();
      
      if (results) {
        const formattedEvents: CalendarEvent[] = results.map((event: ScheduleEvent) => ({
          title: event.Título,
          start: new Date(event.Início),
          end: new Date(event.Fim),
          resource: event,
        }));
        setEvents(formattedEvents);
      }
    } catch (err: any) {
      console.error("Erro ao buscar agendamentos:", err);
      setError(err.message || "Não foi possível carregar agendamentos. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
  }, []);

  const handleDayClick = useCallback((date: Date) => {
    setSelectedDayForSidebar(date);
    setIsSidebarOpen(true);
  }, []);

  const handleNavigate = useCallback((direction: 'prev' | 'next' | 'today') => {
    let newDate = currentDate;
    if (direction === 'prev') {
      if (currentView === 'month') newDate = subMonths(currentDate, 1);
      else if (currentView === 'week') newDate = subWeeks(currentDate, 1);
      else if (currentView === 'day') newDate = subDays(currentDate, 1);
    } else if (direction === 'next') {
      if (currentView === 'month') newDate = addMonths(currentDate, 1);
      else if (currentView === 'week') newDate = addWeeks(currentDate, 1);
      else if (currentView === 'day') newDate = addDays(currentDate, 1);
    } else if (direction === 'today') {
      newDate = new Date();
    }
    setCurrentDate(newDate);
    setSelectedDayForSidebar(newDate);
  }, [currentDate, currentView]);

  const handleViewChange = useCallback((view: CustomView) => {
    setCurrentView(view);
  }, []);

  const getPeriodLabel = useMemo(() => {
    if (currentView === 'month') {
      return format(currentDate, 'MMMM yyyy', { locale: ptBR });
    } else if (currentView === 'week') {
      const startOfWeekDate = startOfWeek(currentDate, { locale: ptBR });
      const endOfWeekDate = endOfWeek(currentDate, { locale: ptBR });
      const startDay = format(startOfWeekDate, 'd', { locale: ptBR });
      const endDay = format(endOfWeekDate, 'd', { locale: ptBR });
      const startMonth = format(startOfWeekDate, 'MMM', { locale: ptBR });
      const endMonth = format(endOfWeekDate, 'MMM', { locale: ptBR });

      if (startMonth === endMonth) {
        return `${startDay} - ${endDay} ${format(startOfWeekDate, 'MMMM yyyy', { locale: ptBR })}`;
      } else {
        return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${format(endOfWeekDate, 'yyyy', { locale: ptBR })}`;
      }
    } else if (currentView === 'day') {
      return format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR });
    }
    return '';
  }, [currentDate, currentView]);


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="fade-in flex h-full gap-6 p-6">
      <div className="flex flex-col flex-grow calendar-container">
        {error && (
            <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                {error}
            </div>
        )}
        
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 rounded-t-lg">
            <div className="flex items-center gap-2">
                <button 
                onClick={() => handleNavigate('prev')} 
                className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100 transition-colors"
                title="Período Anterior"
                >
                <ChevronLeft size={20} />
                </button>
                <h2 className="text-xl font-bold text-gray-800 capitalize flex-shrink-0 mx-2">
                {getPeriodLabel}
                </h2>
                <button 
                onClick={() => handleNavigate('next')} 
                className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100 transition-colors"
                title="Próximo Período"
                >
                <ChevronRight size={20} />
                </button>
            </div>

            <div className="flex items-center gap-4 ml-auto">
                <div className="inline-flex items-center bg-gray-100 p-1 rounded-lg"> 
                    <button
                        onClick={() => handleViewChange('month')}
                        className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 ${currentView === 'month' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
                    >Mês</button>
                    <button
                        onClick={() => handleViewChange('week')}
                        className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 ${currentView === 'week' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
                    >Semana</button>
                    <button
                        onClick={() => handleViewChange('day')}
                        className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 ${currentView === 'day' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
                    >Dia</button>
                </div>
                <button
                    type="button"
                    onClick={() => handleNavigate('today')}
                    className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
                    title="Ir para Hoje"
                >Hoje</button>
            </div>
        </div>
        
        <div className="flex-grow relative h-full p-4">
            {currentView === 'month' && <MonthView currentDate={currentDate} events={events} onDayClick={handleDayClick} selectedDayForSidebar={selectedDayForSidebar} vagaColorMap={vagaColorMap} onSelectEvent={handleSelectEvent} />}
            {currentView === 'week' && <WeekView currentDate={currentDate} events={events} onDayClick={handleDayClick} selectedDayForSidebar={selectedDayForSidebar} vagaColorMap={vagaColorMap} onSelectEvent={handleSelectEvent} />}
            {currentView === 'day' && <DayView currentDate={currentDate} events={events} vagaColorMap={vagaColorMap} onSelectEvent={handleSelectEvent} />}
        </div>
      </div>
      
      <div className={`flex-shrink-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-80 ml-6' : 'w-12 ml-6'} bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col relative`}>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`absolute p-1 rounded-full shadow-sm z-10 transition-transform duration-300 flex items-center justify-center border border-gray-200 ${isSidebarOpen ? '-left-3 top-4 bg-white text-gray-500 hover:bg-gray-100' : 'left-1/2 -translate-x-1/2 top-4 bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          title={isSidebarOpen ? "Esconder eventos diários" : "Mostrar eventos diários"}
        >
          {isSidebarOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        {isSidebarOpen && <DailyEventsSidebar selectedDate={selectedDayForSidebar} events={dailyEvents} onViewDetails={handleSelectEvent} vagaColorMap={vagaColorMap} />}
      </div>

      {selectedEvent && <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
    </div>
  );
};

export default AgendaPage;