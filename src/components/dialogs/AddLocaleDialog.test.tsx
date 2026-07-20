import { describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddLocaleDialog } from '@/components/dialogs/AddLocaleDialog'
import { renderWithProviders } from '@/test/renderWithProviders'

describe('AddLocaleDialog', () => {
  it('requires a language selection before confirming', () => {
    renderWithProviders(
      <AddLocaleDialog
        open
        existingLocales={['en', 'nl']}
        templateFileName="en.json"
        defaultFormat="json"
        onClose={vi.fn()}
        onConfirm={vi.fn(() => true)}
      />,
    )

    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled()
    expect(screen.getByRole('combobox', { name: 'Language' })).toBeInTheDocument()
  })

  it('adds a locale chosen from the select', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn(() => true)
    const onClose = vi.fn()
    renderWithProviders(
      <AddLocaleDialog
        open
        existingLocales={['en', 'nl']}
        templateFileName="en.json"
        defaultFormat="json"
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    )

    await user.click(screen.getByRole('combobox', { name: 'Language' }))
    const listbox = await screen.findByRole('listbox')
    await user.click(within(listbox).getByRole('option', { name: /German/i }))
    expect(screen.getByText(/File: de\.json/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(onConfirm).toHaveBeenCalledWith('de', 'json')
    expect(onClose).toHaveBeenCalled()
  })
})
