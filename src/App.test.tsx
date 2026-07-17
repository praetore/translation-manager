import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import App from '@/App'
import { useTranslationStoreBase } from '@/store/translationStore'
import { renderWithProviders } from '@/test/renderWithProviders'

describe('App shell', () => {
  it('shows EmptyState when no project is loaded', () => {
    useTranslationStoreBase.setState({
      project: null,
      load: { loading: false, saving: false, error: null, status: null },
    })
    renderWithProviders(<App />)
    expect(screen.getByText('No project loaded')).toBeInTheDocument()
  })

  it('shows LoadingSkeleton while loading without a project', () => {
    useTranslationStoreBase.setState({
      project: null,
      load: { loading: true, saving: false, error: null, status: null },
    })
    renderWithProviders(<App />)
    expect(screen.getByLabelText('Loading')).toBeInTheDocument()
    expect(screen.queryByText('No project loaded')).not.toBeInTheDocument()
  })
})
