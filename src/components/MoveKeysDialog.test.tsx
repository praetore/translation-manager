import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MoveKeysDialog } from '@/components/MoveKeysDialog'
import { renderWithProviders } from '@/test/renderWithProviders'

describe('MoveKeysDialog', () => {
  it('shows the static example when the lead is empty', () => {
    renderWithProviders(
      <MoveKeysDialog
        open
        sampleKey="auth.createAccount"
        selectedCount={2}
        onClose={() => undefined}
        onConfirm={() => true}
      />,
    )
    expect(
      screen.getByText('Example: auth.login.title → ui.title'),
    ).toBeInTheDocument()
  })

  it('shows a live from → to preview when a lead is typed', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <MoveKeysDialog
        open
        sampleKey="auth.createAccount"
        selectedCount={2}
        onClose={() => undefined}
        onConfirm={() => true}
      />,
    )
    await user.type(screen.getByLabelText('New path'), 'ui.auth')
    expect(screen.getByText('auth.createAccount')).toBeInTheDocument()
    expect(screen.getByText('ui.auth.createAccount')).toBeInTheDocument()
  })

  it('shows a conflict message when onConfirm returns false', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <MoveKeysDialog
        open
        sampleKey="auth.createAccount"
        selectedCount={2}
        onClose={() => undefined}
        onConfirm={() => false}
      />,
    )
    await user.type(screen.getByLabelText('New path'), 'ui')
    await user.click(screen.getByRole('button', { name: 'Move' }))
    expect(
      screen.getByText('That path would create empty or duplicate keys.'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('New path')).toHaveAttribute('aria-invalid', 'true')
  })
})
