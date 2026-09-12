import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  declare props: Props;
  declare state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturó un error:', error, errorInfo);
  }

  public handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 sm:p-8 max-w-lg w-full text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto shadow-lg">
              <AlertTriangle className="w-7 h-7" />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-bold font-display text-white">
                Error al iniciar la aplicación
              </h2>
              <p className="text-xs text-slate-400">
                Ocurrió una excepción inesperada durante la carga de la vista.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-700/60 text-left font-mono text-[11px] text-rose-300 max-h-32 overflow-auto">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Recargar Página</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
