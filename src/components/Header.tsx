import React from 'react';
import { RefreshCw, Printer, AlertTriangle, CheckCircle2, ShieldAlert, Layers } from 'lucide-react';
import { ConsolidatedData } from '../types';
import { CONFIG } from '../config';

interface HeaderProps {
  data: ConsolidatedData | null;
  isLoading: boolean;
  onRefresh: () => void;
  onPrint: () => void;
  onOpenCorrectionsModal?: () => void;
  onOpenDirectoryModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  data,
  isLoading,
  onRefresh,
  onPrint,
  onOpenCorrectionsModal,
  onOpenDirectoryModal
}) => {
  const hasCorrectionsWarning = data?.sourcesStatus?.correctionsWarning;
  const totalConflicts = data?.conflictsCount ?? 0;

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md no-print">
      {/* Top Banner if Corrections or Base failed */}
      {hasCorrectionsWarning && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs md:text-sm font-semibold flex items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-slate-950" />
            <span>{hasCorrectionsWarning}</span>
          </div>
          <span className="text-[11px] bg-slate-900/10 px-2 py-0.5 rounded">Aviso Oficial</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Institution and App Branding */}
          <div className="flex items-center gap-3.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-wider text-cyan-400 uppercase">
                  {CONFIG.INSTITUTION_NAME}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-medium">
                  Ciclo 2026-2
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
                {CONFIG.APP_TITLE}
              </h1>
            </div>
          </div>

          {/* Actions & Status Bar */}
          <div className="flex items-center flex-wrap gap-2.5">
            
            {/* Directory / Catalog browser button */}
            {onOpenDirectoryModal && (
              <button
                type="button"
                onClick={onOpenDirectoryModal}
                id="btn-open-directory"
                title="Explorar directorio completo de profesores, aulas, asignaturas y grupos"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-cyan-300 transition-colors shadow-2xs cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Directorio y Catálogos</span>
              </button>
            )}

            {/* Consolidated status badge */}
            {data && (
              <button
                type="button"
                onClick={onOpenCorrectionsModal}
                title="Ver detalles de consolidación y correcciones aplicadas"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Consolidación</span>
                <span className="bg-cyan-900/60 text-cyan-300 px-1.5 py-0.2 rounded font-semibold text-[11px] border border-cyan-700/50">
                  {data.appliedCorrectionsCount} corr.
                </span>
              </button>
            )}

            {/* Conflicts counter badge if any */}
            {totalConflicts > 0 && (
              <div 
                title={`${totalConflicts} choques de horario o aula detectados`}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-medium"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>{totalConflicts} conflictos</span>
              </div>
            )}

            {/* Print Button */}
            <button
              type="button"
              onClick={onPrint}
              id="btn-print-schedule"
              title="Imprimir horario actual en formato horizontal"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors shadow-sm active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Imprimir</span>
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              id="btn-refresh-data"
              title="Actualizar datos desde las fuentes remotas"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-md shadow-cyan-600/20 active:scale-95 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Cargando...' : 'Actualizar'}</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
