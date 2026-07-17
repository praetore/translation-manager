import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { EmptyState } from '@/components/EmptyState'
import { renderWithProviders } from '@/test/renderWithProviders'

describe('EmptyState', () => {
  it('shows the title and highlights the open-menu path', () => {
    renderWithProviders(<EmptyState />)
    expect(screen.getByText('No project loaded')).toBeInTheDocument()
    expect(screen.getByText('File → Open…').tagName).toBe('STRONG')
    expect(screen.getByText(/Choose a local folder/)).toBeInTheDocument()
  })
})
