import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  Eye, 
  Layers, 
  Palette, 
  Check, 
  RotateCcw,
  Sparkles,
  ChevronDown,
  LayoutGrid
} from 'lucide-react';
import { CalendarDisplayOptions, DEFAULT_DISPLAY_OPTIONS } from '../types';

interface CalendarDisplayControlsProps {
  options: CalendarDisplayOptions;
  onChangeOptions: (newOptions: CalendarDisplayOptions) => void;
}

export const CalendarDisplayControls: React.FC<CalendarDisplayControlsProps> = ({
  options,
  onChangeOptions,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const toggleOption = (key: keyof Omit<CalendarDisplayOptions, 'viewMode' | 'density'>) => {
    onChangeOptions({
      ...options,
      [key]: !options[key],
    });
  };

  const setViewMode = (mode: 'asc' | 'modern') => {
    onChangeOptions({
      ...options,
      viewMode: mode,
    });
  };

  const resetDefaults = () => {
    onChangeOptions({ ...DEFAULT_DISPLAY_OPTIONS });
  };

  const activeTogglesCount = [
    options.showTeacher,
    options.showRoom,
    options.showGroup,
    options.showTime,
    options.showType,
    options.showCapacity,
  ].filter(Boolean).length;

  return (
    <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
      
      {/* Left side: View style switch (aSc Clásico vs Moderno) */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
          <LayoutGrid className="w-3.5 h-3.5 text-cyan-700" />
          <span>Estilo:</span>
        </span>

        <div className="inline-flex p-0.5 bg-slate-200/80 rounded-xl border border-slate-300">
          <button
            type="button"
            onClick={() => setViewMode('asc')}
            title="Formato de cuadrícula institucional similar a aSc Horarios UABC"
            className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              options.viewMode === 'asc'
                ? 'bg-white text-cyan-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>aSc Institucional</span>
            {options.viewMode === 'asc' && <span className="w-1.5 h-1.5 rounded-full bg-cyan-600"></span>}
          </button>

          <button
            type="button"
            onClick={() => setViewMode('modern')}
            title="Formato moderno con colores temáticos por materia"
            className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              options.viewMode === 'modern'
                ? 'bg-white text-cyan-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Moderno Color</span>
            {options.viewMode === 'modern' && <span className="w-1.5 h-1.5 rounded-full bg-cyan-600"></span>}
          </button>
        </div>
      </div>

      {/* Right side: Field Display Toggles */}
      <div className="flex items-center flex-wrap gap-2">
        <div className="hidden sm:flex items-center gap-1.5 mr-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Mostrar:
          </span>

          {/* Quick inline toggles on desktop */}
          <button
            type="button"
            onClick={() => toggleOption('showTeacher')}
            className={`px-2 py-1 rounded-lg border font-medium text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
              options.showTeacher
                ? 'bg-cyan-50 border-cyan-300 text-cyan-900 font-semibold'
                : 'bg-white border-slate-200 text-slate-400 line-through'
            }`}
          >
            <Check className={`w-3 h-3 ${options.showTeacher ? 'opacity-100 text-cyan-700' : 'opacity-0'}`} />
            Docente
          </button>

          <button
            type="button"
            onClick={() => toggleOption('showRoom')}
            className={`px-2 py-1 rounded-lg border font-medium text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
              options.showRoom
                ? 'bg-cyan-50 border-cyan-300 text-cyan-900 font-semibold'
                : 'bg-white border-slate-200 text-slate-400 line-through'
            }`}
          >
            <Check className={`w-3 h-3 ${options.showRoom ? 'opacity-100 text-cyan-700' : 'opacity-0'}`} />
            Aula
          </button>

          <button
            type="button"
            onClick={() => toggleOption('showGroup')}
            className={`px-2 py-1 rounded-lg border font-medium text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
              options.showGroup
                ? 'bg-cyan-50 border-cyan-300 text-cyan-900 font-semibold'
                : 'bg-white border-slate-200 text-slate-400 line-through'
            }`}
          >
            <Check className={`w-3 h-3 ${options.showGroup ? 'opacity-100 text-cyan-700' : 'opacity-0'}`} />
            Grupo
          </button>

          <button
            type="button"
            onClick={() => toggleOption('showCapacity')}
            title="Mostrar capacidad del grupo, alumnos inscritos y capacidad del salón"
            className={`px-2 py-1 rounded-lg border font-medium text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
              options.showCapacity
                ? 'bg-cyan-50 border-cyan-300 text-cyan-900 font-semibold'
                : 'bg-white border-slate-200 text-slate-400 line-through'
            }`}
          >
            <Check className={`w-3 h-3 ${options.showCapacity ? 'opacity-100 text-cyan-700' : 'opacity-0'}`} />
            Capacidad/Alumnos
          </button>

          <button
            type="button"
            onClick={() => toggleOption('showTime')}
            className={`px-2 py-1 rounded-lg border font-medium text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
              options.showTime
                ? 'bg-cyan-50 border-cyan-300 text-cyan-900 font-semibold'
                : 'bg-white border-slate-200 text-slate-400 line-through'
            }`}
          >
            <Check className={`w-3 h-3 ${options.showTime ? 'opacity-100 text-cyan-700' : 'opacity-0'}`} />
            Horario
          </button>

          <button
            type="button"
            onClick={() => toggleOption('showType')}
            className={`px-2 py-1 rounded-lg border font-medium text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
              options.showType
                ? 'bg-cyan-50 border-cyan-300 text-cyan-900 font-semibold'
                : 'bg-white border-slate-200 text-slate-400 line-through'
            }`}
          >
            <Check className={`w-3 h-3 ${options.showType ? 'opacity-100 text-cyan-700' : 'opacity-0'}`} />
            Tipo/Badges
          </button>
        </div>

        {/* Expandable settings button for mobile or compact view */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="sm:hidden flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-700" />
            <span>Filtros ({activeTogglesCount}/6)</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Mobile dropdown */}
          {isOpen && (
            <div className="sm:hidden absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-40 space-y-2 animate-in fade-in zoom-in-95 duration-150">
              <div className="font-bold text-slate-900 text-xs pb-1 border-b border-slate-100 flex items-center justify-between">
                <span>Elementos Visibles</span>
                <button
                  type="button"
                  onClick={resetDefaults}
                  className="text-[10px] text-cyan-700 hover:underline"
                >
                  Restablecer
                </button>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={options.showTeacher}
                  onChange={() => toggleOption('showTeacher')}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Nombre del Docente</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={options.showRoom}
                  onChange={() => toggleOption('showRoom')}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Aula / Salón</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={options.showGroup}
                  onChange={() => toggleOption('showGroup')}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Grupo / Subgrupo</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={options.showCapacity}
                  onChange={() => toggleOption('showCapacity')}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Capacidad y Alumnos</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={options.showTime}
                  onChange={() => toggleOption('showTime')}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Rango de Horario</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={options.showType}
                  onChange={() => toggleOption('showType')}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Tipo (P, I, T, L) / Badges</span>
              </label>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
