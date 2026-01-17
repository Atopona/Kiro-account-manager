import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  handleReload = (): void => {
    window.location.reload()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-2xl w-full space-y-6">
            <div className="text-center space-y-4">
              <div className="text-destructive text-6xl">💥</div>
              <h1 className="text-2xl font-bold">应用遇到了一个错误</h1>
              <p className="text-muted-foreground">
                很抱歉，应用遇到了一个意外错误。您可以尝试重新加载应用。
              </p>
            </div>

            {this.state.error && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h2 className="font-semibold text-sm">错误详情：</h2>
                <pre className="text-xs text-destructive overflow-auto max-h-40">
                  {this.state.error.toString()}
                </pre>
                {this.state.errorInfo && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      查看堆栈跟踪
                    </summary>
                    <pre className="mt-2 text-muted-foreground overflow-auto max-h-60">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleReload}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                重新加载应用
              </button>
              <button
                onClick={() => window.api?.openExternal('https://github.com/chaogei/Kiro-account-manager/issues')}
                className="px-6 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
              >
                报告问题
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
