import { describe, expect, it } from 'vitest'
import { Save } from 'lucide-react'
import { screen } from '@testing-library/react'
import { ToolbarActionButton } from '@/components/ToolbarActionButton'
import { renderWithProviders } from '@/test/renderWithProviders'

describe('ToolbarActionButton', () => {
  it('shows the label when not compact', () => {
    renderWithProviders(
      <ToolbarActionButton icon={Save} label="Save project" />,
      { compact: false },
    )
    expect(screen.getByRole('button', { name: 'Save project' })).toHaveTextContent(
      'Save project',
    )
  })

  it('keeps aria-label but hides visible label text when compact', () => {
    renderWithProviders(
      <ToolbarActionButton icon={Save} label="Save project" />,
      { compact: true },
    )
    const button = screen.getByRole('button', { name: 'Save project' })
    expect(button).toBeInTheDocument()
    expect(button.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })
})
