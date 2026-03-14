import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import ToolbarDropdown from './ToolbarDropdown'

jest.mock('../../icons', () => ({
  ChevronDownIcon: ({ size, className }: any) => (
    <div data-testid="chevron-icon" data-size={size} className={className}>
      ▼
    </div>
  )
}))

describe('ToolbarDropdown', () => {
  const options = [
    { value: 'p', label: '正文' },
    { value: 'h1', label: '标题 1' }
  ]

  it('keeps dropdown open after first click and allows selection', () => {
    const handleChange = jest.fn()
    render(
      <ToolbarDropdown
        label="段落"
        value="p"
        options={options}
        onChange={handleChange}
        width={90}
      />
    )

    const triggerButton = screen.getByText('正文').closest('button') as HTMLButtonElement
    fireEvent.click(triggerButton)
    expect(screen.getByRole('menu')).toBeInTheDocument()

    fireEvent.click(screen.getByText('标题 1'))
    expect(handleChange).toHaveBeenCalledWith('h1')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('does not close on mousedown inside portal before option click', () => {
    const handleChange = jest.fn()
    render(
      <ToolbarDropdown
        label="段落"
        value="p"
        options={options}
        onChange={handleChange}
        width={90}
      />
    )

    const triggerButton = screen.getByText('正文').closest('button') as HTMLButtonElement
    fireEvent.click(triggerButton)
    const optionNode = screen.getByText('标题 1')
    fireEvent.mouseDown(optionNode)
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.click(optionNode)
    expect(handleChange).toHaveBeenCalledWith('h1')
  })

  it('positions dropdown based on trigger rect instead of top-left default', () => {
    render(
      <ToolbarDropdown
        label="字体"
        value="p"
        options={options}
        onChange={jest.fn()}
        width={90}
      />
    )

    const triggerButton = screen.getByText('正文').closest('button') as HTMLButtonElement
    const triggerWrapper = triggerButton.parentElement as HTMLDivElement
    jest.spyOn(triggerWrapper, 'getBoundingClientRect').mockReturnValue({
      top: 100,
      left: 200,
      right: 290,
      bottom: 132,
      width: 90,
      height: 32,
      x: 200,
      y: 100,
      toJSON: () => ({})
    } as DOMRect)

    fireEvent.click(triggerButton)
    const menu = screen.getByRole('menu')
    expect(menu).toBeInTheDocument()
    expect((menu as HTMLElement).style.left).toBe('200px')
    expect((menu as HTMLElement).style.top).toBe('132px')
  })
})
