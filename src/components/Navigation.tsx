import React from 'react';
import { User, Building2, BookOpen, Users, Clock } from 'lucide-react';
import { ViewTab } from '../types';

interface NavigationProps {
  activeTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
}

interface TabItem {
  id: ViewTab;
  label: string;
  icon: React.ElementType;
  description: string;
}

const TABS: TabItem[] = [
  { id: 'profesor', label: 'Profesor', icon: User, description: 'Horario por docente' },
  { id: 'aula', label: 'Aula', icon: Building2, description: 'Horario por salón/laboratorio' },
  { id: 'asignatura', label: 'Asignatura', icon: BookOpen, description: 'Horario por materia' },
  { id: 'grupo', label: 'Grupo', icon: Users, description: 'Horario por grupo estudiantil' },
  { id: 'disponibilidad', label: 'Disponibilidad', icon: Clock, description: 'Búsqueda de espacios y tiempos libres' },
];

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onSelectTab }) => {
  return (
    <nav className="bg-white border-b border-slate-200 shadow-xs sticky top-0 z-30 tabs-nav no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-start sm:justify-center overflow-x-auto py-2.5 gap-2 scrollbar-none">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-cyan-900 text-white shadow-md shadow-cyan-950/10'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 bg-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
