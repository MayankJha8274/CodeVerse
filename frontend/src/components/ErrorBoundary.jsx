import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error: error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h2 style={{ color: '#ef4444' }}>Oops! Something went wrong getting this page.</h2>
          <p style={{ color: '#6b7280', margin: '1rem 0' }}>
            A chunk failed to load or an unexpected error occurred.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Refresh Application
          </button>
          <details style={{ marginTop: '2rem', textAlign: 'left', background: '#f3f4f6', padding: '1rem', borderRadius: '4px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Error Details</summary>
            <pre style={{ marginTop: '1rem', overflowX: 'auto', fontSize: '0.875rem' }}>
              {this.state.error?.toString()}
            </pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;