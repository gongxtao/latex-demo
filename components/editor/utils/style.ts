export const applyStyle = (doc: Document, styleName: string, styleValue: string) => {
  const selection = doc.getSelection()
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return

  const range = selection.getRangeAt(0)
  
  // Use extractContents to handle complex selections
  const fragment = range.extractContents()
  
  // Create wrapper span
  const span = doc.createElement('span')
  span.style[styleName as any] = styleValue
  span.appendChild(fragment)
  
  // Insert back
  range.insertNode(span)
  
  // Restore selection
  selection.removeAllRanges()
  const newRange = doc.createRange()
  newRange.selectNodeContents(span)
  selection.addRange(newRange)
}
