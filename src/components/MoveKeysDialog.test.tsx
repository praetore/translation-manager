import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MoveKeysDialog } from '@/components/MoveKeysDialog'
import { renderWithProviders } from '@/test/renderWithProviders'

const keys = ['auth.createAccount', 'auth.login'] as const

describe('MoveKeysDialog', () => {
  it('shows the static example when the lead is empty', () => {
    renderWithProviders(
      <MoveKeysDialog
        open
        sampleKey="auth.createAccount"
        selectedKeys={keys}
        selectedCount={2}
        onClose={() => undefined}
        onConfirm={() => true}
      />,
    )
    expect(screen.getByText(/Example: auth.login.title/)).toBeInTheDocument()
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('$$')).toBeInTheDocument()
    expect(screen.getByText('Current path (before the last segment)')).toBeInTheDocument()
  })

  it('shows a live from → to preview when a lead is typed', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <MoveKeysDialog
        open
        sampleKey="auth.createAccount"
        selectedKeys={keys}
        selectedCount={2}
        onClose={() => undefined}
        onConfirm={() => true}
      />,
    )
    await user.type(screen.getByLabelText('New path'), 'ui.auth')
    expect(screen.getByText('auth.createAccount')).toBeInTheDocument()
    expect(screen.getByText('ui.auth.createAccount')).toBeInTheDocument()
  })

  it('disables confirm and shows an error for invalid placeholders', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <MoveKeysDialog
        open
        sampleKey="auth.createAccount"
        selectedKeys={keys}
        selectedCount={2}
        onClose={() => undefined}
        onConfirm={() => true}
      />,
    )
    await user.type(screen.getByLabelText('New path'), '$9')
    expect(screen.getByRole('button', { name: 'Move' })).toBeDisabled()
    expect(screen.getByText('Unknown or out-of-range placeholder.')).toBeInTheDocument()
    expect(screen.getByLabelText('New path')).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows a conflict message when onConfirm returns false', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <MoveKeysDialog
        open
        sampleKey="auth.createAccount"
        selectedKeys={keys}
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
