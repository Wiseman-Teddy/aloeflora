import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMsg: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, errorMsg: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error strictly intercepted by ALOEFLORA ErrorBoundary:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white border-2 border-red-100 max-w-md w-full rounded-3xl p-8 text-center shadow-xl">
            <div className="mx-auto bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-500 mb-6">
              Our servers encountered an unexpected error while processing your request. Our engineers have been notified.
            </p>
            <div className="bg-gray-100 p-3 rounded-xl text-xs font-mono text-left text-gray-600 mb-8 overflow-x-auto">
              {this.state.errorMsg || "Unknown Error Component Exception"}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black transition flex justify-center items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Restart Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
