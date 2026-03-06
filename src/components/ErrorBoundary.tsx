import React, { Component, type ReactNode, type ErrorInfo } from "react";
import * as Sentry from "@sentry/react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
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

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error("ErrorBoundary caught:", error, info.componentStack);
        if (import.meta.env.VITE_SENTRY_DSN) {
            Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
        }
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
                    <h1 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h1>
                    <p className="text-muted-foreground mb-6">Please refresh or try again later.</p>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
                    >
                        Try again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
