
import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global console and JSON sanitizer to prevent circular structure errors during telemetry/logging
try {
  const originalStringify = JSON.stringify;
  JSON.stringify = function(value: any, replacer?: any, space?: any) {
    try {
      return originalStringify(value, replacer, space);
    } catch {
      try {
        const seen = new WeakSet();
        const safeReplacer = function(this: any, key: string, val: any) {
          let currentVal = val;
          if (typeof replacer === 'function') {
            currentVal = replacer.call(this, key, val);
          }
          if (typeof currentVal === 'object' && currentVal !== null) {
            if (seen.has(currentVal)) {
              return '[Circular]';
            }
            seen.add(currentVal);
          }
          return currentVal;
        };
        return originalStringify(value, safeReplacer, space);
      } catch {
        return '"{}"';
      }
    }
  };
} catch {
  // ignore
}

const wrapConsoleMethod = (method: 'log' | 'warn' | 'error' | 'info') => {
  const original = console[method];
  console[method] = (...args: any[]) => {
    try {
      original.apply(console, args);
    } catch {
      // If native console failed due to circular structure or similar, sanitize args safely
      try {
        const safeArgs = args.map(arg => {
          if (arg instanceof Error) {
            return `${arg.name}: ${arg.message}`;
          }
          if (arg && typeof arg === 'object') {
            try {
              return String(arg);
            } catch {
              return '[CircularObject]';
            }
          }
          return arg;
        });
        original.apply(console, safeArgs);
      } catch {
        // no-op
      }
    }
  };
};

wrapConsoleMethod('error');
wrapConsoleMethod('warn');
wrapConsoleMethod('log');
wrapConsoleMethod('info');

// Register Service Worker for PWA capabilities
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Usando caminho relativo para ser compatível com diferentes base paths
    navigator.serviceWorker.register('./sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

import { FocusProvider } from './contexts/FocusContext';

class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    if ('caches' in window) {
      caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
    }
  }

  handleClearAndReload = () => {
    if ('caches' in window) {
      caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(r => r.unregister());
      });
    }
    localStorage.removeItem("nexo_sw_cache");
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '30px', fontFamily: 'sans-serif', color: '#1e293b', maxWidth: '600px', margin: '40px auto', textAlign: 'center', background: '#f8fafc', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
          <h1 style={{ color: '#e11d48', fontSize: '22px', fontWeight: 'bold' }}>Ops! Ocorreu um erro ao carregar o aplicativo.</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '10px' }}>
            Se você acabou de atualizar o app no Git, isso pode ser causado por arquivos antigos salvos em cache no seu navegador.
          </p>
          <pre style={{ background: '#0f172a', color: '#f8fafc', padding: '15px', borderRadius: '8px', overflowX: 'auto', marginTop: '15px', textAlign: 'left', fontSize: '12px' }}>
            {this.state.error?.toString()}
          </pre>
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={this.handleClearAndReload}
              style={{ padding: '12px 24px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Limpar Cache e Recarregar
            </button>
            <button 
              onClick={() => window.location.reload()}
              style={{ padding: '12px 20px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Apenas Recarregar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

let root = (window as any).__REACT_ROOT__;
if (!root) {
  root = ReactDOM.createRoot(rootElement);
  (window as any).__REACT_ROOT__ = root;
}

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <FocusProvider>
        <App />
      </FocusProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
