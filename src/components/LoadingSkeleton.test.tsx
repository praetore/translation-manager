import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { renderWithProviders } from '@/test/renderWithProviders'

describe('LoadingSkeleton', () => {
  it('exposes busy loading semantics', () => {
    renderWithProviders(<LoadingSkeleton />)
    const root = screen.getByLabelText('Loading')
    expect(root).toHaveAttribute('aria-busy', 'true')
  })
})
