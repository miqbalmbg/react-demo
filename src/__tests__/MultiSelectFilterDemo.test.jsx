import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MultiSelectFilterDemo from '../MultiSelectFilterDemo'

jest.mock('antd')

const setup = () => {
  const user = userEvent.setup()
  render(<MultiSelectFilterDemo />)
  return { user }
}

const getSummaryText = () =>
  screen.getByText((content, element) => element.classList?.contains('filter-count') ?? false)

describe('MultiSelectFilterDemo', () => {
  it('renders all articles by default (positive)', () => {
    setup()

    expect(getSummaryText().textContent.trim()).toBe('Showing 5 of 5 resources')
    const articleHeadings = screen
      .getAllByRole('heading', { level: 3 })
      .filter((heading) => heading.classList.contains('filter-article-title'))
    expect(articleHeadings).toHaveLength(5)
  })

  it('filters results when applying a single React tag (positive)', async () => {
    const { user } = setup()

    await user.click(screen.getByLabelText('React'))
    await user.click(screen.getByRole('button', { name: 'Apply' }))

    expect(getSummaryText().textContent.trim()).toBe('Showing 2 of 5 resources')
    const visibleArticles = screen
      .getAllByRole('heading', { level: 3 })
      .filter((heading) => heading.classList.contains('filter-article-title'))
      .map((heading) => heading.textContent)
    expect(visibleArticles).toEqual([
      'Mastering React Concurrency Patterns',
      'Progressive Data Fetching Recipes',
    ])
  })

  it('keeps clear button disabled when nothing is selected (negative)', () => {
    setup()

    expect(screen.getByRole('button', { name: 'Clear all' })).toBeDisabled()
  })

  it('indicates pending changes before filters are applied (negative)', async () => {
    const { user } = setup()

    await user.click(screen.getByLabelText('UI'))

    expect(screen.getByText('Pending changes not yet applied.')).toBeInTheDocument()
    expect(screen.getByTestId('max-tag-placeholder').textContent).toBe('UI')
  })

  it('selects every tag when primary action is triggered with no draft tags (negative)', async () => {
    const { user } = setup()

    await user.click(screen.getByTestId('toggle-dropdown'))
    await user.click(screen.getByTestId('toggle-dropdown'))
    await user.click(screen.getByRole('button', { name: 'Select all' }))
    await waitFor(() =>
      expect(getSummaryText().textContent.trim()).toBe('Showing 0 of 5 resources'),
    )
    expect(screen.getByTestId('max-tag-placeholder').textContent).toBe('Multiple Options is Selected')
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled()
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
  })

  it('shows empty state when no resources satisfy the chosen tags (negative)', async () => {
    const { user } = setup()

    await user.click(screen.getByLabelText('Edge'))
    await user.click(screen.getByLabelText('React'))
    expect(screen.getByText('Pending changes not yet applied.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Apply' }))

    await waitFor(() =>
      expect(getSummaryText().textContent.trim()).toBe('Showing 0 of 5 resources'),
    )
    expect(screen.getByTestId('empty-state')).toHaveTextContent('No resources match the selected tags')
  })

  it('clears applied and draft selections returning to the initial state (negative)', async () => {
    const { user } = setup()

    await user.click(screen.getByLabelText('React'))
    await user.click(screen.getByRole('button', { name: 'Apply' }))
    expect(screen.queryByText('Pending changes not yet applied.')).not.toBeInTheDocument()
    await waitFor(() =>
      expect(getSummaryText().textContent.trim()).toBe('Showing 2 of 5 resources'),
    )

    await user.click(screen.getByRole('button', { name: 'Clear all' }))

    expect(screen.queryByText('Pending changes not yet applied.')).not.toBeInTheDocument()
    expect(getSummaryText().textContent.trim()).toBe('Showing 5 of 5 resources')
    expect(screen.getByTestId('max-tag-placeholder').textContent).toBe('Select the Option(s)')
  })
})
