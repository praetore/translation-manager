import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OpenProjectFilesDialog } from '@/components/dialogs/OpenProjectFilesDialog'
import { renderWithProviders } from '@/test/renderWithProviders'

const mixedPicker = {
  directoryPath: '/locales',
  candidates: [
    {
      filePath: '/locales/en.json',
      fileName: 'en.json',
      locale: 'en',
      format: 'json' as const,
      content: '{"hi":"Hello"}',
    },
    {
      filePath: '/locales/nl.json',
      fileName: 'nl.json',
      locale: 'nl',
      format: 'json' as const,
      content: '{"hi":"Hallo"}',
    },
    {
      filePath: '/locales/de.properties',
      fileName: 'messages_de.properties',
      locale: 'de',
      format: 'properties' as const,
      content: 'hi=Hallo\n',
    },
  ],
  skipped: [
    {
      filePath: '/locales/zz.json',
      fileName: 'zz.json',
      reason: 'invalidLocale' as const,
    },
    {
      filePath: '/locales/package.json',
      fileName: 'package.json',
      reason: 'invalidLocale' as const,
    },
    {
      filePath: '/locales/fr.json',
      fileName: 'fr.json',
      reason: 'parseError' as const,
    },
  ],
}

describe('OpenProjectFilesDialog', () => {
  it('shows a mix of valid (selectable) and invalid (skipped) files', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    renderWithProviders(
      <OpenProjectFilesDialog
        picker={mixedPicker}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    )

    expect(screen.getByText('Ready to load (3)')).toBeInTheDocument()
    expect(screen.getByText('Skipped (3)')).toBeInTheDocument()

    expect(screen.getByText('English')).toBeInTheDocument()
    expect(screen.getByText('Dutch')).toBeInTheDocument()
    expect(screen.getByText('German')).toBeInTheDocument()
    expect(screen.getByText('en.json')).toBeInTheDocument()
    expect(screen.getByText('messages_de.properties')).toBeInTheDocument()

    expect(screen.getByText('zz.json')).toBeInTheDocument()
    expect(screen.getByText('package.json')).toBeInTheDocument()
    expect(screen.getByText('fr.json')).toBeInTheDocument()
    expect(
      screen.getAllByText('Filename is not a valid language code'),
    ).toHaveLength(2)
    expect(screen.getByText('File could not be parsed')).toBeInTheDocument()

    // Skipped files are not checkboxes — only valid candidates are.
    expect(screen.getAllByRole('checkbox')).toHaveLength(3)

    await user.click(screen.getByLabelText(/Dutch/i))
    await user.click(screen.getByLabelText(/German/i))
    await user.click(screen.getByRole('button', { name: /Open \(1\)/i }))
    expect(onConfirm).toHaveBeenCalledWith(['/locales/en.json'])
  })

  it('select-all / deselect-all only affects valid candidates', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    renderWithProviders(
      <OpenProjectFilesDialog
        picker={mixedPicker}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Deselect all/i }))
    expect(screen.getByRole('button', { name: /Open \(0\)/i })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: /Select all/i }))
    const open = screen.getByRole('button', { name: /Open \(3\)/i })
    expect(open).toBeEnabled()
    await user.click(open)
    expect(onConfirm).toHaveBeenCalledWith([
      '/locales/en.json',
      '/locales/nl.json',
      '/locales/de.properties',
    ])
  })
})
