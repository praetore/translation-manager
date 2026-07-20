import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MoveKeysDialog } from '@/components/dialogs/MoveKeysDialog'
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
    expect(screen.getByText(/auth.login.email → app\.\$\$\.basic → app.auth.login.basic.email/)).toBeInTheDocument()
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('$$')).toBeInTheDocument()
    expect(screen.getByText('Current path (before the last segment)')).toBeInTheDocument()
    expect(screen.getByText('auth.login')).toBeInTheDocument()
    expect(screen.getByText('$1 → auth · $2 → login')).toBeInTheDocument()
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

  it('suppresses unfinished trailing-$ errors until blur', async () => {
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
    const input = screen.getByLabelText('New path')
    await user.type(input, 'app.$')
    expect(screen.getByRole('button', { name: 'Move' })).toBeDisabled()
    expect(
      screen.queryByText('Unknown or out-of-range placeholder.'),
    ).not.toBeInTheDocument()
    expect(input).not.toHaveAttribute('aria-invalid')

    await user.tab()
    expect(screen.getByText('Unknown or out-of-range placeholder.')).toBeInTheDocument()
    expect(input).toHaveAttribute('aria-invalid', 'true')
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

  it('clears the lead input when the dialog is cancelled', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const { rerender } = renderWithProviders(
      <MoveKeysDialog
        open
        sampleKey="auth.createAccount"
        selectedKeys={keys}
        selectedCount={2}
        onClose={onClose}
        onConfirm={() => true}
      />,
    )
    await user.type(screen.getByLabelText('New path'), 'ui.auth')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalled()

    rerender(
      <MoveKeysDialog
        open
        sampleKey="auth.createAccount"
        selectedKeys={keys}
        selectedCount={2}
        onClose={onClose}
        onConfirm={() => true}
      />,
    )
    expect(screen.getByLabelText('New path')).toHaveValue('')
  })
})
