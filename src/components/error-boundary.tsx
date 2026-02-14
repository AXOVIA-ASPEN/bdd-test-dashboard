'use client';
import React from 'react';

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center py-20">
          <p className="text-lg font-semibold text-red-400 mb-2">Something went wrong</p>
          <p className="text-sm text-muted font-mono">{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-accent text-white rounded-lg text-sm">Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}
