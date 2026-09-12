import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallbackTitle?: string
  fallbackMessage?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  errorMessage: string | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      errorMessage: null,
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error instanceof Error ? error.message : 'An unexpected error occurred.',
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Sanitize and log for client telemetry without leaking PII or raw user tokens
    const sanitizedMsg = error instanceof Error ? error.message : 'Unknown runtime error'
    const componentStack = errorInfo?.componentStack ? errorInfo.componentStack.slice(0, 300) : ''
    console.error(`[ErrorBoundary] Caught render error: ${sanitizedMsg} at ${componentStack}`)
  }

  handleReload = (): void => {
    window.location.reload()
  }

  handleGoHome = (): void => {
    window.location.href = '/'
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main
          role="alert"
          aria-live="assertive"
          className="flex min-h-[60vh] w-full items-center justify-center p-6 text-foreground bg-background"
        >
          <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-8 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger-fg">
              <svg
                className="h-7 w-7"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            </div>

            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {this.props.fallbackTitle || 'Something went wrong'}
            </h1>

            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {this.props.fallbackMessage ||
                'JobTrack encountered an unexpected problem while rendering this view. Your saved jobs and applications remain safe.'}
            </p>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
              >
                Reload Application
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
              >
                Return to Home
              </button>
            </div>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}
