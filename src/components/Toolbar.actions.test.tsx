import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toolbar } from '@/components/Toolbar'
import { useTranslationStoreBase } from '@/store/translationStore'
import { loadSampleProject, sampleProject } from '@/test/projectFixture'
import { renderWithProviders } from '@/test/renderWithProviders'

describe('Toolbar actions', () => {
  it('adds a row and sets pending key edit', async () => {
    const user = userEvent.setup()
    loadSampleProject()
    const before = useTranslationStoreBase.getState().project!.rows.length
    renderWithProviders(<Toolbar />)
    await user.click(screen.getByRole('button', { name: 'Add row' }))
    const state = useTranslationStoreBase.getState()
    expect(state.project!.rows.length).toBe(before + 1)
    expect(state.pendingKeyEdit).toBeTruthy()
  })

  it('starts the missing filter collapse from the toolbar button', async () => {
    const user = userEvent.setup()
    loadSampleProject()
    renderWithProviders(<Toolbar />)
    const missing = screen.getByRole('button', { name: /Missing \(1\)/ })
    expect(missing).toBeEnabled()
    await user.click(missing)
    const state = useTranslationStoreBase.getState()
    expect(state.layoutMotion).not.toBeNull()
    expect(state.exitingKeys).toContain('greeting')
  })

  it('shows unsaved badge and enables save when dirty', () => {
    loadSampleProject(sampleProject({ dirty: true }))
    renderWithProviders(<Toolbar />)
    expect(screen.getByText('Unsaved')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save *' })).toBeEnabled()
  })

  it('disables save when the project is clean', () => {
    loadSampleProject(sampleProject({ dirty: false }))
    renderWithProviders(<Toolbar />)
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('disables browse while loading', () => {
    loadSampleProject()
    useTranslationStoreBase.setState({
      load: { loading: true, saving: false, error: null, status: null },
    })
    renderWithProviders(<Toolbar />)
    expect(screen.getByRole('button', { name: 'Browse…' })).toBeDisabled()
  })
})
