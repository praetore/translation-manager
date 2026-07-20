import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchControls } from '@/components/toolbar/SearchControls'
import { useTranslationStoreBase } from '@/store/translationStore'
import { loadSampleProject } from '@/test/projectFixture'
import { renderWithProviders } from '@/test/renderWithProviders'

describe('SearchControls', () => {
  it('uses the short placeholder when compact', () => {
    loadSampleProject()
    renderWithProviders(<SearchControls />, { compact: true })
    expect(screen.getByRole('searchbox')).toHaveAttribute('placeholder', 'Search…')
  })

  it('uses the full placeholder when not compact', () => {
    loadSampleProject()
    renderWithProviders(<SearchControls />, { compact: false })
    expect(screen.getByRole('searchbox')).toHaveAttribute(
      'placeholder',
      'Search keys or text…',
    )
  })

  it('shows the scope icon with the label when not compact', () => {
    loadSampleProject()
    renderWithProviders(<SearchControls />, { compact: false })
    const trigger = screen.getByRole('combobox', { name: /Search in/i })
    expect(trigger.querySelector('svg')).toBeTruthy()
    expect(trigger).toHaveTextContent('All')
  })

  it('shows the scope icon when compact', () => {
    loadSampleProject()
    renderWithProviders(<SearchControls />, { compact: true })
    const trigger = screen.getByRole('combobox', { name: /Search in/i })
    expect(trigger.querySelector('svg')).toBeTruthy()
  })

  it('updates search scope from the select', async () => {
    const user = userEvent.setup()
    loadSampleProject()
    useTranslationStoreBase.setState({
      searchQuery: 'log',
      searchScope: 'all',
    })
    renderWithProviders(<SearchControls />)
    await user.click(screen.getByRole('combobox', { name: /Search in/i }))
    await user.click(await screen.findByRole('option', { name: 'Keys' }))
    expect(useTranslationStoreBase.getState().searchScope).toBe('keys')
  })

  it('toggles regex search', async () => {
    const user = userEvent.setup()
    loadSampleProject()
    renderWithProviders(<SearchControls />)
    const toggle = screen.getByRole('button', { name: 'Regex search' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await user.click(toggle)
    expect(useTranslationStoreBase.getState().searchRegex).toBe(true)
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
  })

  it('marks invalid regex on the search input', () => {
    loadSampleProject()
    useTranslationStoreBase.setState({
      searchQuery: '(',
      searchRegex: true,
    })
    renderWithProviders(<SearchControls />)
    expect(screen.getByRole('searchbox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('updates scope to Text', async () => {
    const user = userEvent.setup()
    loadSampleProject()
    useTranslationStoreBase.setState({ searchQuery: 'Hello', searchScope: 'all' })
    renderWithProviders(<SearchControls />)
    await user.click(screen.getByRole('combobox', { name: /Search in/i }))
    await user.click(await screen.findByRole('option', { name: 'Text' }))
    expect(useTranslationStoreBase.getState().searchScope).toBe('text')
    expect(useTranslationStoreBase.getState().searchQuery).toBe('Hello')
  })
})
