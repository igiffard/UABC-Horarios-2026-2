/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ConsolidatedData, ViewTab, ScheduleSession, DirectoryCategory } from './types';
import { loadConsolidatedSchedule } from './utils/consolidator';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { ProfesorView } from './components/ProfesorView';
import { AulaView } from './components/AulaView';
import { AsignaturaView } from './components/AsignaturaView';
import { GrupoView } from './components/GrupoView';
import { DisponibilidadView } from './components/DisponibilidadView';
import { ClassDetailModal } from './components/ClassDetailModal';
import { CorrectionsTableModal } from './components/CorrectionsTableModal';
import { DirectoryModal } from './components/DirectoryModal';
import { CampusMapModal } from './components/CampusMapModal';
import { getBuildingById } from './data/campusBuildings';
import { PrintSchedule } from './components/PrintSchedule';
import { PrintModal } from './components/PrintModal';
import { PrintOptions, DEFAULT_PRINT_OPTIONS } from './types';
import { CONFIG } from './config';
import { RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function App() {
  const [data, setData] = useState<ConsolidatedData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ViewTab>('profesor');
  const [selectedSessionForModal, setSelectedSessionForModal] = useState<ScheduleSession | null>(null);
  const [isCorrectionsModalOpen, setIsCorrectionsModalOpen] = useState<boolean>(false);
  const [isDirectoryModalOpen, setIsDirectoryModalOpen] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState<boolean>(false);
  const [mapModalInitialBuilding, setMapModalInitialBuilding] = useState<string>('E-21');
  const [printOptions, setPrintOptions] = useState<PrintOptions>(DEFAULT_PRINT_OPTIONS);
  const [directoryInitialCategory, setDirectoryInitialCategory] = useState<DirectoryCategory>('profesores');
  const [selectedEntityByTab, setSelectedEntityByTab] = useState<{ [key in ViewTab]?: string }>({});
  const [lastLoadedAt, setLastLoadedAt] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await loadConsolidatedSchedule();
      setData(result);
      setLastLoadedAt(new Date());
    } catch (err: any) {
      console.error('Error cargando horario consolidado:', err);
      setError(err?.message || 'No fue posible cargar las bases de datos de horarios.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handler to open print modal with current context prefilled
  const handleOpenPrintModal = useCallback((targetType?: 'profesor' | 'aula' | 'grupo' | 'asignatura', targetName?: string) => {
    const effectiveType = targetType || (activeTab === 'disponibilidad' ? 'profesor' : activeTab);
    const effectiveName = targetName || selectedEntityByTab[effectiveType] || '';
    
    setPrintOptions(prev => ({
      ...prev,
      targetType: effectiveType,
      targetName: effectiveName,
      signerTeacher: effectiveType === 'profesor' && effectiveName ? effectiveName : prev.signerTeacher
    }));
    setIsPrintModalOpen(true);
  }, [activeTab, selectedEntityByTab]);

  const handleExecutePrint = () => {
    window.print();
  };

  const handleOpenDirectory = (category: DirectoryCategory = 'profesores') => {
    setDirectoryInitialCategory(category);
    setIsDirectoryModalOpen(true);
  };

  const handleSelectDirectoryEntity = (tab: ViewTab, name: string) => {
    setSelectedEntityByTab(prev => ({ ...prev, [tab]: name }));
    setActiveTab(tab);
    setIsDirectoryModalOpen(false);
  };

  const handleOpenMapModal = useCallback((buildingId?: string) => {
    if (buildingId) {
      setMapModalInitialBuilding(buildingId);
    }
    setIsMapModalOpen(true);
  }, []);

  const handleSelectTeacher = useCallback((teacherName: string) => {
    setSelectedEntityByTab(prev => ({ ...prev, profesor: teacherName }));
    setActiveTab('profesor');
  }, []);

  const handleSelectRoom = useCallback((roomCode: string) => {
    setSelectedEntityByTab(prev => ({ ...prev, aula: roomCode }));
    setActiveTab('aula');
  }, []);

  // Filter sessions specifically for the print container
  const printableSessionsForOutput = React.useMemo(() => {
    if (!data) return [];
    const type = printOptions.targetType;
    const name = printOptions.targetName || selectedEntityByTab[type] || '';
    
    if (!name) {
      // If no entity name selected, fallback to active tab or first item
      if (type === 'profesor') return data.sessions.filter(s => s.profesor === data.professors[0]);
      if (type === 'aula') return data.sessions.filter(s => s.aula === data.classrooms[0]);
      if (type === 'grupo') return data.sessions.filter(s => s.grupo === data.groups[0]);
      if (type === 'asignatura') return data.sessions.filter(s => s.asignatura === data.subjects[0]);
      return data.sessions;
    }

    switch (type) {
      case 'profesor':
        return data.sessions.filter(s => s.profesor === name);
      case 'aula':
        return data.sessions.filter(s => s.aula === name);
      case 'grupo':
        return data.sessions.filter(s => s.grupo === name);
      case 'asignatura':
        return data.sessions.filter(s => s.asignatura === name);
      default:
        return data.sessions;
    }
  }, [data, printOptions.targetType, printOptions.targetName, selectedEntityByTab]);

  const printViewTitle = React.useMemo(() => {
    const typeLabels: Record<string, string> = {
      profesor: 'Docente',
      aula: 'Aula / Salón',
      grupo: 'Grupo',
      asignatura: 'Asignatura'
    };
    const label = typeLabels[printOptions.targetType] || 'Horario';
    const name = printOptions.targetName || selectedEntityByTab[printOptions.targetType] || 'Consolidado';
    return `${label.toUpperCase()}: ${name}`;
  }, [printOptions.targetType, printOptions.targetName, selectedEntityByTab]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col selection:bg-cyan-200 selection:text-cyan-900">
      
      {/* Institutional Top Header */}
      <Header
        data={data}
        isLoading={isLoading}
        onRefresh={fetchData}
        onPrint={() => handleOpenPrintModal()}
        onOpenCorrectionsModal={() => setIsCorrectionsModalOpen(true)}
        onOpenDirectoryModal={() => handleOpenDirectory('profesores')}
        onOpenMapModal={() => handleOpenMapModal()}
      />

      {/* Primary Navigation Tabs */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 no-print">
        
        {/* Loading Skeleton */}
        {isLoading && !data && (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-900 flex items-center justify-center shadow-lg animate-pulse">
              <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-800 font-display">
                Cargando y Consolidando Horarios Oficiales...
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Procesando bases de datos de la Facultad de Ciencias Marinas y aplicando correcciones prioritarias.
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !data && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 max-w-lg mx-auto text-center space-y-4 shadow-sm my-12">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-950">Error al cargar datos</h3>
              <p className="text-xs text-rose-700 mt-1">{error}</p>
            </div>
            <button
              type="button"
              onClick={fetchData}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Reintentar Carga
            </button>
          </div>
        )}

        {/* Tab Views */}
        {data && (
          <div className="animate-in fade-in duration-200">
            {activeTab === 'profesor' && (
              <ProfesorView
                sessions={data.sessions}
                professors={data.professors}
                onSelectSession={setSelectedSessionForModal}
                onOpenDirectory={handleOpenDirectory}
                onOpenPrintModal={handleOpenPrintModal}
                selectedEntity={selectedEntityByTab.profesor}
              />
            )}

            {activeTab === 'aula' && (
              <AulaView
                sessions={data.sessions}
                classrooms={data.classrooms}
                onSelectSession={setSelectedSessionForModal}
                onOpenDirectory={handleOpenDirectory}
                onOpenPrintModal={handleOpenPrintModal}
                onOpenMapModal={handleOpenMapModal}
                onSelectTeacher={handleSelectTeacher}
                selectedEntity={selectedEntityByTab.aula}
              />
            )}

            {activeTab === 'asignatura' && (
              <AsignaturaView
                sessions={data.sessions}
                subjects={data.subjects}
                onSelectSession={setSelectedSessionForModal}
                onOpenDirectory={handleOpenDirectory}
                onOpenPrintModal={handleOpenPrintModal}
                selectedEntity={selectedEntityByTab.asignatura}
              />
            )}

            {activeTab === 'grupo' && (
              <GrupoView
                sessions={data.sessions}
                groups={data.groups}
                onSelectSession={setSelectedSessionForModal}
                onOpenDirectory={handleOpenDirectory}
                onOpenPrintModal={handleOpenPrintModal}
                selectedEntity={selectedEntityByTab.grupo}
              />
            )}

            {activeTab === 'disponibilidad' && (
              <DisponibilidadView
                sessions={data.sessions}
                professors={data.professors}
                classrooms={data.classrooms}
                onSelectSession={setSelectedSessionForModal}
              />
            )}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 space-y-1.5">
          <div className="flex items-center justify-center gap-2 font-medium text-slate-700">
            <ShieldCheck className="w-4 h-4 text-cyan-700" />
            <span>{CONFIG.INSTITUTION_NAME} — Sistema de Consulta de Horarios</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Horario Consolidado Ciclo 2026-2 • Última sincronización: {lastLoadedAt.toLocaleTimeString('es-MX')}
          </p>
        </div>
      </footer>

      {/* Directory & Catalog Browser Modal */}
      {isDirectoryModalOpen && data && (
        <DirectoryModal
          isOpen={isDirectoryModalOpen}
          onClose={() => setIsDirectoryModalOpen(false)}
          sessions={data.sessions}
          initialCategory={directoryInitialCategory}
          onSelectEntity={handleSelectDirectoryEntity}
        />
      )}

      {/* Campus Map & Classroom Keys Modal */}
      {isMapModalOpen && data && (
        <CampusMapModal
          isOpen={isMapModalOpen}
          onClose={() => setIsMapModalOpen(false)}
          sessions={data.sessions}
          initialBuildingId={mapModalInitialBuilding}
          onSelectBuilding={(buildingNumber) => {
            const b = getBuildingById(buildingNumber);
            if (b && b.rooms.length > 0) {
              setSelectedEntityByTab(prev => ({ ...prev, aula: b.rooms[0] }));
            }
            setActiveTab('aula');
            setIsMapModalOpen(false);
          }}
          onSelectRoom={(roomCode) => {
            handleSelectRoom(roomCode);
            setIsMapModalOpen(false);
          }}
          onSelectTeacher={(teacherName) => {
            handleSelectTeacher(teacherName);
            setIsMapModalOpen(false);
          }}
        />
      )}

      {/* Detail Modal on Class Card Click */}
      {selectedSessionForModal && (
        <ClassDetailModal
          session={selectedSessionForModal}
          onClose={() => setSelectedSessionForModal(null)}
        />
      )}

      {/* Corrections Inspection Modal */}
      {isCorrectionsModalOpen && data && (
        <CorrectionsTableModal
          corrections={data.corrections}
          appliedCount={data.appliedCorrectionsCount}
          onClose={() => setIsCorrectionsModalOpen(false)}
        />
      )}

      {/* Print Options & Export Configuration Modal */}
      {isPrintModalOpen && data && (
        <PrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          sessions={data.sessions}
          allProfessors={data.professors}
          allClassrooms={data.classrooms}
          allGroups={data.groups}
          allSubjects={data.subjects}
          activeTab={activeTab}
          currentEntityName={selectedEntityByTab[activeTab === 'disponibilidad' ? 'profesor' : activeTab]}
          lastLoadedAt={lastLoadedAt}
          printOptions={printOptions}
          onChangePrintOptions={setPrintOptions}
          onExecutePrint={handleExecutePrint}
        />
      )}

      {/* Print View Container (rendered strictly during @media print) */}
      {data && (
        <PrintSchedule
          viewTitle={printViewTitle}
          viewSubtitle="Facultad de Ciencias Marinas • UABC Campus Ensenada"
          sessions={printableSessionsForOutput}
          lastLoadedAt={lastLoadedAt}
          printOptions={printOptions}
        />
      )}

    </div>
  );
}

