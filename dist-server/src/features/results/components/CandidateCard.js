import React from 'react';
import { GripVertical, CalendarPlus, Mail, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
const CandidateCard = ({ candidate, index, onViewDetails, onScheduleInterview, onUpdateStatus }) => {
    const getScoreColor = (score) => {
        if (score >= 85)
            return 'bg-green-100 text-green-800';
        if (score >= 70)
            return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };
    const formattedTriagemDate = candidate.data_triagem
        ? format(new Date(candidate.data_triagem), 'dd/MM/yyyy', { locale: ptBR })
        : 'N/A';
    return (<div className={`bg-white rounded-lg border shadow-sm mb-4 group relative 
                  transition-all duration-200 ease-out 
                  hover:shadow-md hover:-translate-y-1`}>
      <div className="absolute top-2 right-2 p-1 text-gray-300 group-hover:text-gray-500">
        <GripVertical size={16}/>
      </div>

      <div className="p-4 cursor-pointer" onClick={() => onViewDetails(candidate)}>
        <div className="flex justify-between items-start">
          <h4 className="font-bold text-gray-900 pr-8">{candidate.nome}</h4>
          <div className={`px-2 py-1 rounded-full text-xs font-bold ${getScoreColor(candidate.score || 0)}`}>
            {candidate.score || 0}%
          </div>
        </div>
        
        {candidate.email && (<p className="text-xs text-gray-500 mt-1 flex items-center">
            <Mail size={16} className="mr-1 flex-shrink-0"/> {candidate.email}
          </p>)}
        <p className="text-xs text-gray-500 mt-1 flex items-center">
          <CalendarDays size={16} className="mr-1 flex-shrink-0"/> Triado em: {formattedTriagemDate}
        </p>

        <p className="text-sm text-gray-600 mt-2 line-clamp-3 h-[60px]">
          {candidate.resumo_ia || 'Sem resumo disponível.'}
        </p>
      </div>

      {candidate.status?.value === 'Entrevista' && (<div className="border-t p-2 flex justify-end">
          <button onClick={(e) => { e.stopPropagation(); onScheduleInterview(candidate); }} className="flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800 p-2 rounded-md hover:bg-indigo-50 transition-colors">
            <CalendarPlus size={16} className="mr-2"/>
            Agendar Entrevista
          </button>
        </div>)}
    </div>);
};
export default CandidateCard;
