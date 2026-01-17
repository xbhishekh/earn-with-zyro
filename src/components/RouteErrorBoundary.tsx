import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  routeName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`RouteErrorBoundary [${this.props.routeName || "unknown"}]:`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-foreground">
                  {this.props.routeName ? `${this.props.routeName} failed to load` : "Something went wrong"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  This section encountered an error. Try refreshing or go back home.
                </p>
              </div>
              {import.meta.env.DEV && this.state.error && (
                <div className="bg-muted/50 rounded p-3 text-left overflow-auto max-h-24">
                  <code className="text-xs text-destructive break-all">
                    {this.state.error.message}
                  </code>
                </div>
              )}
              <div className="flex gap-2 justify-center pt-2">
                <Button variant="outline" size="sm" onClick={this.handleRetry}>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Retry
                </Button>
                <Button size="sm" onClick={this.handleGoHome}>
                  <Home className="w-4 h-4 mr-1" />
                  Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RouteErrorBoundary;
