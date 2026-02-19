'use client';
import React from 'react';
import { TEST_IDS } from '@/lib/test-ids';

const MAX_RETRIES = 3;

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; error?: Error; retryCount: number; }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  private handleRetry = () => {
    this.setState((prev) => ({
      hasError: false,
      error: undefined,
      retryCount: prev.retryCount + 1,
    }));
  };
  render() {
    if (this.state.hasError) {
      const canRetry = this.state.retryCount < MAX_RETRIES;
      return (
        <div className="text-center py-20">
          <p className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Something went wrong</p>
          <p className="text-sm text-muted font-mono mb-4">{this.state.error?.message}</p>
          {!canRetry && (
            <p className="text-xs text-muted mb-4">Maximum retries reached. Please reload the page.</p>
          )}
          <div className="flex items-center justify-center gap-3">
            {canRetry && (
              <button
                onClick={this.handleRetry}
                data-testid={TEST_IDS.ERROR.TRY_AGAIN_BTN}
                className="px-4 py-2 bg-accent text-white rounded-lg text-sm hover:opacity-90 transition-opacity"
              >
                Try Again
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              data-testid={TEST_IDS.ERROR.RELOAD_BTN}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:opacity-90 transition-opacity"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
