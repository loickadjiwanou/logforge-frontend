import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from './button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
              An unexpected error occurred in the application rendering. 
              {this.state.error && (
                <code className="block mt-2 p-2 bg-black/30 rounded text-[10px] text-red-400/80 font-mono break-all">
                  {this.state.error.toString()}
                </code>
              )}
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700 h-11 px-8 rounded-xl"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reload Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
