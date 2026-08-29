import React, { useState } from 'react';
import { X, Sparkles, Search, CheckCircle2, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { CorrectionRecord } from '../types';

interface CorrectionsTableModalProps {
  corrections: CorrectionRecord[];
  appliedCount: number;
  onClose: () => void;
}

export const CorrectionsTableModal: React.FC<CorrectionsTableModalProps> = ({
  corrections,
  appliedCount,
  onClose
}) => {
  const [filterText, setFilterText] = useState('');

  const filtered = corrections.filter(c => {
    if (!filterText) return true;
    const str = `${c.id} ${c.profesor} ${c.asignatura} ${c.grupo} ${c.tipoAjuste} ${c.estadoAjuste} ${c.salonSolicitadoNuevo} ${c.observaciones}`.toLowerCase();
    return str.includes(filterText.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Fuente Prioritaria
              </span>
              <span className="text-xs text-slate-400">
                {appliedCount} ajustes integrados
              </span>
            </div>
            <h2 className="text-xl font-bold font-display text-white">
              Registro Oficial de Correcciones y Ajustes
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search filter in modal */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Buscar en correcciones por docente, materia, aula, ajuste..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>
        </div>

        {/* Table list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length > 0 ? (
            filtered.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-cyan-300 transition-all space-y-2 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm font-display">#{c.id}</span>
                    <strong className="text-slate-900 text-sm">{c.profesor || 'Docente sin especificar'}</strong>
                    {c.grupo && <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-medium">G. {c.grupo}</span>}
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-50 text-cyan-900 border border-cyan-200 self-start sm:self-auto">
                    {c.tipoAjuste}
                  </span>
                </div>

                <div className="font-semibold text-slate-700">{c.asignatura}</div>

                {/* Change comparison grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Original</span>
                    <div className="text-slate-600">
                      <strong>Día:</strong> {c.diaActual || 'No indicado'} • <strong>Hora:</strong> {c.horarioActual || 'No indicada'}
                    </div>
                    <div className="text-slate-600">
                      <strong>Salón:</strong> {c.salonActual || 'No indicado'}
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200/80">
                    <span className="text-[10px] font-bold uppercase text-emerald-700 block mb-0.5">Ajuste Solicitado / Aplicado</span>
                    <div className="text-emerald-950">
                      <strong>Día:</strong> {c.diaSolicitado || c.diaActual} • <strong>Hora:</strong> {c.horarioSolicitado || c.horarioActual}
                    </div>
                    <div className="text-emerald-950">
                      <strong>Nuevo Salón:</strong> {c.salonSolicitadoNuevo || 'Mismo salón'}
                    </div>
                  </div>
                </div>

                {c.observaciones && (
                  <p className="text-slate-500 italic text-[11px] pt-1">
                    Obs: {c.observaciones}
                  </p>
                )}

              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              No se encontraron correcciones con el término &quot;{filterText}&quot;.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
