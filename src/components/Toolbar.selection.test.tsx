import { describe, expect, it } from 'vitest'
import { screen, waitForElementToBeRemoved } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toolbar } from '@/components/Toolbar'
import { useTranslationStoreBase } from '@/store/translationStore'
import { loadSampleProject } from '@/test/projectFixture'
import { renderWithProviders } from '@/test/renderWithProviders'

describe('Toolbar selection badge', () => {
  it('clears selection from the selected-count badge', async () => {
    const user = userEvent.setup()
    loadSampleProject()
    useTranslationStoreBase.setState({ selectedKeys: ['greeting', 'farewell'] })
    renderWithProviders(<Toolbar />)
    const deselect = screen.getByRole('button', { name: 'Deselect' })
    await user.click(deselect)
    expect(useTranslationStoreBase.getState().selectedKeys).toEqual([])
    await waitForElementToBeRemoved(deselect)
  })
})
