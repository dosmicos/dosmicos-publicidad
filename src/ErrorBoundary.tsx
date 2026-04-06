import React from 'react';

interface State { error: Error | null }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: '600px', margin: '4rem auto' }}>
          <h1 style={{ color: '#ff5c02', marginBottom: '1rem' }}>Algo salió mal</h1>
          <pre style={{ background: '#f3f3f3', padding: '1rem', borderRadius: '8px', overflow: 'auto', fontSize: '12px', color: '#c00' }}>
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '1.5rem', padding: '0.5rem 1.5rem', background: '#ff5c02', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
