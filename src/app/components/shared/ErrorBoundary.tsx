import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('[Canchazo] Error capturado:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '2rem', fontFamily: 'system-ui, sans-serif',
          background: '#f8fafc'
        }}>
          <div style={{ maxWidth: '480px', textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16, background: '#dcfce7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem', fontSize: 28
            }}>🏆</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>
              Canchazo
            </h1>
            <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Ocurrió un error inesperado. Por favor recarga la página.
            </p>
            {this.state.error && (
              <details style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                <summary style={{ fontSize: '0.8rem', color: '#94a3b8', cursor: 'pointer', userSelect: 'none' }}>
                  Ver detalle del error
                </summary>
                <pre style={{
                  fontSize: '0.75rem', color: '#ef4444', marginTop: '0.75rem',
                  whiteSpace: 'pre-wrap', overflowWrap: 'break-word',
                  background: '#fef2f2', padding: '0.75rem', borderRadius: 8,
                  border: '1px solid #fecaca'
                }}>
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#16a34a', color: 'white', border: 'none',
                borderRadius: 10, padding: '0.625rem 1.5rem',
                fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem',
                marginRight: '0.5rem'
              }}
            >
              Recargar página
            </button>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); }}
              style={{
                background: 'transparent', color: '#64748b',
                border: '1px solid #e2e8f0', borderRadius: 10,
                padding: '0.625rem 1.5rem', fontWeight: 500,
                cursor: 'pointer', fontSize: '0.875rem'
              }}
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
