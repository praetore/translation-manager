import { describe, expect, it } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SelectionToolbarActions } from '@/components/SelectionToolbarActions'
import { useTranslationStoreBase } from '@/store/translationStore'
import { loadSampleProject, sampleProject } from '@/test/projectFixture'
import { renderWithProviders } from '@/test/renderWithProviders'

describe('SelectionToolbarActions', () => {
  it('renders nothing actionable when there is no selection', () => {
    renderWithProviders(<SelectionToolbarActions />)
    expect(screen.queryByRole('button', { name: 'Move' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Deselect' })).not.toBeInTheDocument()
  })

  it('clears selection from the selected-count badge', async () => {
    const user = userEvent.setup()
    useTranslationStoreBase.setState({ selectedKeys: ['a', 'b'] })
    renderWithProviders(<SelectionToolbarActions />)
    await user.click(screen.getByRole('button', { name: 'Deselect' }))
    expect(useTranslationStoreBase.getState().selectedKeys).toEqual([])
  })

  it('shows move, delete, and a selected-count badge with deselect', () => {
    useTranslationStoreBase.setState({ selectedKeys: ['a', 'b', 'c'] })
    renderWithProviders(<SelectionToolbarActions />)
    expect(screen.getByRole('button', { name: 'Move' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Deselect' })).toBeInTheDocument()
    expect(screen.getByText('selected')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).not.toHaveAccessibleName(
      /Delete \(3\)/,
    )
  })

  it('opens the delete confirm dialog without count in the trigger label', async () => {
    const user = userEvent.setup()
    useTranslationStoreBase.setState({ selectedKeys: ['a', 'b'] })
    renderWithProviders(<SelectionToolbarActions />)
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.getByRole('heading', { name: 'Delete keys' })).toBeInTheDocument()
    expect(screen.getByText(/Delete 2 selected key/)).toBeInTheDocument()
  })

  it('deletes selected rows after confirm', async () => {
    const user = userEvent.setup()
    loadSampleProject()
    useTranslationStoreBase.setState({ selectedKeys: ['greeting', 'auth.login'] })
    renderWithProviders(<SelectionToolbarActions />)
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }))
    await waitFor(() => {
      expect(useTranslationStoreBase.getState().selectedKeys).toEqual([])
      expect(useTranslationStoreBase.getState().project!.rows.map((row) => row.key)).toEqual([
        'farewell',
      ])
    })
  })

  it('moves selected keys when the lead is valid', async () => {
    const user = userEvent.setup()
    loadSampleProject()
    useTranslationStoreBase.setState({ selectedKeys: ['greeting'] })
    renderWithProviders(<SelectionToolbarActions />)
    await user.click(screen.getByRole('button', { name: 'Move' }))
    await user.type(screen.getByLabelText('New path'), 'ui')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Move' }))
    const keys = useTranslationStoreBase.getState().project!.rows.map((row) => row.key)
    expect(keys).toContain('ui.greeting')
    expect(keys).not.toContain('greeting')
  })

  it('shows a conflict when the move lead is invalid', async () => {
    const user = userEvent.setup()
    loadSampleProject(
      sampleProject({
        rows: [
          { key: 'a.item', values: { en: 'A', nl: 'A' } },
          { key: 'b.item', values: { en: 'B', nl: 'B' } },
        ],
      }),
    )
    useTranslationStoreBase.setState({ selectedKeys: ['a.item', 'b.item'] })
    renderWithProviders(<SelectionToolbarActions />)
    await user.click(screen.getByRole('button', { name: 'Move' }))
    await user.type(screen.getByLabelText('New path'), 'ui')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Move' }))
    expect(
      screen.getByText('That path would create empty or duplicate keys.'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('New path')).toHaveAttribute('aria-invalid', 'true')
    expect(useTranslationStoreBase.getState().project!.rows.map((r) => r.key)).toEqual([
      'a.item',
      'b.item',
    ])
  })
})
