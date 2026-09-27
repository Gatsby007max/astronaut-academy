import { Component, type ReactNode } from 'react'

interface Props {
  fallback: (error: Error, reset: () => void) => ReactNode
  children: ReactNode
  resetKey?: unknown
}

interface State {
  error: Error | null
  key: unknown
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, key: this.props.resetKey }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    if (props.resetKey !== state.key) return { error: null, key: props.resetKey }
    return null
  }

  componentDidCatch(error: Error) {
    console.error(error)
  }

  render() {
    if (this.state.error) return this.props.fallback(this.state.error, () => this.setState({ error: null }))
    return this.props.children
  }
}
