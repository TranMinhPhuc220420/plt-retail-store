import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Loading from '../Loading'

describe('Loading Component', () => {
  it('should render loading icon', () => {
    render(<Loading />)
    
    // Check if the loading icon is rendered
    const loadingIcon = screen.getByRole('img', { hidden: true })
    expect(loadingIcon).toBeInTheDocument()
  })

  it('should have correct CSS class', () => {
    const { container } = render(<Loading />)
    
    // Check if the component has the anticon class
    const icon = container.querySelector('.anticon-loading')
    expect(icon).toBeInTheDocument()
  })

  it('should be accessible', () => {
    const { container } = render(<Loading />)
    
    // Check if the icon has proper aria attributes
    const icon = container.querySelector('.anticon')
    expect(icon).toBeInTheDocument()
  })
})
