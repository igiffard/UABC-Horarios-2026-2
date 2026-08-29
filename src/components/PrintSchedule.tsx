import React from 'react';
import { ScheduleSession, DayName } from '../types';
import { CONFIG } from '../config';

interface PrintScheduleProps {
  viewTitle: string;
  viewSubtitle?: string;
  sessions: ScheduleSession[];
  lastLoadedAt: Date;
}

const DAYS = CONFIG.CALENDAR.DAYS;
const HOURS = Array.from({ length: 15 }, (_, i) => {
  const h = 7 + i;
  return `${h.toString().padStart(2, '0')}:00`;
});

export const PrintSchedule: React.FC<PrintScheduleProps> = ({
  viewTitle,
  viewSubtitle,
  sessions,
  lastLoadedAt
}) => {
  const now = new Date();
  const printTimestamp = now.toLocaleString('es-MX', {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  return (
    <div className="hidden print:block print-container bg-white text-black p-4">
      {/* Header for print */}
      <div className="border-b-2 border-slate-900 pb-3 mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900 font-serif">
            {CONFIG.INSTITUTION_NAME}
          </h1>
          <h2 className="text-sm font-semibold text-slate-700">
            {CONFIG.APP_TITLE} — Semestre 2026-2
          </h2>
          <div className="text-base font-bold text-slate-900 mt-1">
            {viewTitle}
          </div>
          {viewSubtitle && (
            <p className="text-xs text-slate-600">{viewSubtitle}</p>
          )}
        </div>

        <div className="text-right text-xs text-slate-500">
          <div><strong>Fecha de Consulta:</strong> {printTimestamp}</div>
          <div><strong>Estado:</strong> Horario Oficial Consolidado</div>
        </div>
      </div>

      {/* Grid Table for Landscape Letter Print */}
      <table className="w-full border-collapse border border-slate-400 text-[11px] table-fixed">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-slate-400 p-1.5 w-16 text-center font-bold">Hora</th>
            {DAYS.map(day => (
              <th key={day} className="border border-slate-400 p-1.5 text-center font-bold">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Table rows for each hour or summary */}
          {HOURS.slice(0, -1).map((hour, hIdx) => {
            const hStart = (7 + hIdx) * 60;
            const hEnd = (8 + hIdx) * 60;

            return (
              <tr key={hour} className="min-h-[36px]">
                <td className="border border-slate-300 p-1 text-center font-mono font-bold bg-slate-50 text-[10px]">
                  {hour}
                </td>
                {DAYS.map(day => {
                  // Find sessions in this hour slot
                  const slotSessions = sessions.filter(s => {
                    if (s.dia !== day) return false;
                    return s.startMinutes < hEnd && s.endMinutes > hStart;
                  });

                  return (
                    <td key={day} className="border border-slate-300 p-1 align-top bg-white">
                      {slotSessions.map(s => (
                        <div key={s.id} className="mb-1 p-1 rounded bg-slate-50 border border-slate-300 text-[10px] leading-tight">
                          <div className="font-bold text-slate-900 truncate">{s.asignatura}</div>
                          <div className="text-slate-600 text-[9px]">
                            {s.horaInicio} - {s.horaFin} • {s.aula} {s.grupo ? `(G.${s.grupo})` : ''}
                          </div>
                          {s.profesor && <div className="text-slate-700 text-[9px] truncate">{s.profesor}</div>}
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Footer notes on print */}
      <div className="mt-4 pt-2 border-t border-slate-300 flex justify-between text-[10px] text-slate-500">
        <span>Documento oficial de consulta generado desde el sistema institucional de horarios de la FCM.</span>
        <span>Página 1 de 1</span>
      </div>
    </div>
  );
};
