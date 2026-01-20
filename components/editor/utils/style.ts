export const applyStyle = (doc: Document, styleName: string, styleValue: string) => {
  const selection = doc.getSelection()
  if (!selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)
  const span = doc.createElement('span')
  span.style[styleName as any] = styleValue

  if (selection.isCollapsed) {
    const textNode = doc.createTextNode('\u200B')
    span.appendChild(textNode)
    range.insertNode(span)
    const newRange = doc.createRange()
    newRange.setStart(textNode, 1)
    newRange.setEnd(textNode, 1)
    selection.removeAllRanges()
    selection.addRange(newRange)
    return
  }

  const fragment = range.extractContents()
  span.appendChild(fragment)
  range.insertNode(span)
  selection.removeAllRanges()
  const newRange = doc.createRange()
  newRange.selectNodeContents(span)
  selection.addRange(newRange)
}
