import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button, EmptyState } from '@/components/ui';

interface Props {
  children: ReactNode;
  /** Custom fallback. Defaults to an EmptyState with a "Try again" button. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

// Must be a class: only classes can implement getDerivedStateFromError and
// componentDidCatch.
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    // Hook for real error reporting later.
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  override render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.reset);
    return (
      <div role="alert">
        <EmptyState
          title="Something went wrong"
          message={error.message}
          action={<Button onClick={this.reset}>Try again</Button>}
        />
      </div>
    );
  }
}
