import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  /** When true, renders a compact inline fallback instead of a full-screen one. */
  inline?: boolean;
  /** Optional context label shown in the fallback (e.g. "Detail Kuota"). */
  label?: string;
  /** Custom fallback renderer. Receives error and a reset callback. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Called whenever an error is caught — useful for logging. */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    const err = this.state.error ?? new Error('Unknown error');

    if (this.props.fallback) return this.props.fallback(err, this.reset);

    if (this.props.inline) {
      return (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-destructive">
            <AlertTriangle className="w-4 h-4" />
            <p className="text-sm font-semibold">
              {this.props.label ? `Gagal memuat ${this.props.label}` : 'Terjadi kesalahan'}
            </p>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{err.message}</p>
          <div className="flex gap-2 justify-center">
            <Button size="sm" variant="outline" onClick={this.reset}>
              Coba lagi
            </Button>
            <Button size="sm" variant="ghost" onClick={this.handleReload} className="gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Muat ulang
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Terjadi Kesalahan</h2>
          <p className="text-sm text-muted-foreground">
            {this.props.label ? `Halaman "${this.props.label}" gagal dimuat. ` : ''}
            Silakan coba lagi atau muat ulang halaman.
          </p>
          <p className="text-xs text-muted-foreground/80 break-words">{err.message}</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={this.reset}>
              Coba lagi
            </Button>
            <Button onClick={this.handleReload} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Muat Ulang
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
