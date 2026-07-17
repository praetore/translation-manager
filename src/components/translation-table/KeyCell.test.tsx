import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KeyCell } from '@/components/translation-table/KeyCell'
import { SelectedKeysProvider } from '@/components/translation-table/selectionContext'
import { renderWithProviders } from '@/test/renderWithProviders'

describe('KeyCell', () => {
  it('starts editing from the edit button and renames on Enter', async () => {
    const user = userEvent.setup()
    const onRenameKey = vi.fn(() => true)
    renderWithProviders(
      <SelectedKeysProvider selectedKeys={new Set()}>
        <KeyCell
          keyName="auth.login"
          rowIndex={0}
          onSelectionPointerDown={vi.fn()}
          onDeleteRow={vi.fn()}
          onRenameKey={onRenameKey}
        />
      </SelectedKeysProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Edit key' }))
    const input = screen.getByRole('textbox', { name: 'Edit key' })
    await user.clear(input)
    await user.type(input, 'auth.signin{Enter}')
    expect(onRenameKey).toHaveBeenCalledWith('auth.login', 'auth.signin')
  })

  it('stays in edit mode when rename fails', async () => {
    const user = userEvent.setup()
    const onRenameKey = vi.fn(() => false)
    renderWithProviders(
      <SelectedKeysProvider selectedKeys={new Set()}>
        <KeyCell
          keyName="auth.login"
          rowIndex={0}
          onSelectionPointerDown={vi.fn()}
          onDeleteRow={vi.fn()}
          onRenameKey={onRenameKey}
        />
      </SelectedKeysProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Edit key' }))
    await user.type(screen.getByRole('textbox', { name: 'Edit key' }), 'x{Enter}')
    expect(onRenameKey).toHaveBeenCalled()
    expect(screen.getByRole('textbox', { name: 'Edit key' })).toBeInTheDocument()
  })

  it('confirms row delete via dialog', async () => {
    const user = userEvent.setup()
    const onDeleteRow = vi.fn()
    renderWithProviders(
      <SelectedKeysProvider selectedKeys={new Set()}>
        <KeyCell
          keyName="auth.login"
          rowIndex={0}
          onSelectionPointerDown={vi.fn()}
          onDeleteRow={onDeleteRow}
          onRenameKey={vi.fn(() => true)}
        />
      </SelectedKeysProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Delete row' }))
    expect(screen.getByRole('heading', { name: /Delete/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onDeleteRow).toHaveBeenCalledWith('auth.login')
  })

  it('forwards pointer down on the key area to the selection handler', () => {
    const onSelectionPointerDown = vi.fn()
    renderWithProviders(
      <SelectedKeysProvider selectedKeys={new Set(['auth.login'])}>
        <KeyCell
          keyName="auth.login"
          rowIndex={2}
          onSelectionPointerDown={onSelectionPointerDown}
          onDeleteRow={vi.fn()}
          onRenameKey={vi.fn(() => true)}
        />
      </SelectedKeysProvider>,
    )
    fireEvent.pointerDown(screen.getByText('auth.login'), { button: 0 })
    expect(onSelectionPointerDown).toHaveBeenCalledWith(2, {
      shift: false,
      ctrl: false,
    })
  })
})
