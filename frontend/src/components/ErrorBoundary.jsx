import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-50 p-6 text-center">
          <div className="mb-3 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <p className="text-[13px] font-semibold text-[#1a1f2e] mb-1">Terjadi kesalahan</p>
          <p className="text-[11px] text-[#9aa0b8] mb-4">{this.state.error?.message || 'Unknown error'}</p>
          <button
            onClick={this.handleReset}
            className="px-3 py-1.5 text-[11px] font-medium rounded-md border border-[#dde2ee] bg-white text-[#5a6380] hover:bg-[#f7f8fc] transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
