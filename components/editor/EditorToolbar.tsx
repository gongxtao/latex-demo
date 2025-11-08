'use client'

import React, { useRef } from 'react'
import { RefObject } from 'react'
import { ToolbarButton, ToolbarGroup, ToolbarSelect } from './toolbar'
import {
  AlignIcon,
  ListIcon,
  LinkIcon,
  UnlinkIcon,
  ImageIcon,
  TableIcon,
  QuoteIcon,
  CodeIcon,
  DividerIcon,
  UndoIcon,
  RedoIcon,
  IndentIcon,
  OutdentIcon,
  AddRowIcon,
  DeleteRowIcon,
  AddColumnIcon,
  DeleteColumnIcon
} from './icons'
import ColorPicker from './toolbar/ColorPicker';
import BackgroundColorPicker from './toolbar/BackgroundColorPicker';
import TablePicker from './toolbar/TablePicker';
import ImagePicker from './toolbar/ImagePicker';

/**
 * Props for the EditorToolbar component
 */
export interface EditorToolbarProps {
  iframeRef: RefObject<HTMLIFrameElement>
  onContentChange: (content: string) => void
  isEditing: boolean
  disabled?: boolean
}

// EditorToolbar component with internalized actions
const EditorToolbar: React.FC<EditorToolbarProps> = ({ iframeRef, onContentChange, isEditing, disabled }) => {
  const isDisabled = disabled || !isEditing;
  const isUpdatingRef = useRef(false);

  // Internal helpers
  const getIframeDoc = () => iframeRef.current?.contentDocument || iframeRef.current?.contentWindow?.document || null;

  const applyFormat = (fn: (doc: Document) => void) => {
    const doc = getIframeDoc()
    if (!doc || !isEditing) return

    // Save current selection before applying format
    const selection = doc.getSelection()
    const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null

    // Apply the format
    fn(doc)

    // Restore focus to iframe
    const iframe = iframeRef.current
    if (iframe) {
      iframe.focus()
    }

    // Restore selection if possible, otherwise place cursor at end
    const body = doc.body
    if (body) {
      if (range && selection) {
        try {
          selection.removeAllRanges()
          selection.addRange(range)
        } catch (e) {
          // If restoration fails, place cursor at end
          const newRange = doc.createRange()
          newRange.selectNodeContents(body)
          newRange.collapse(false)
          selection.removeAllRanges()
          selection.addRange(newRange)
        }
      } else if (selection) {
        // No previous selection, place cursor at end
        const newRange = doc.createRange()
        newRange.selectNodeContents(body)
        newRange.collapse(false)
        selection.removeAllRanges()
        selection.addRange(newRange)
      }
    }

    isUpdatingRef.current = true
    const newHtml = doc.documentElement.outerHTML
    onContentChange(newHtml)
    setTimeout(() => {
      isUpdatingRef.current = false
    }, 50)
  }

  // Internal actions (moved from EditablePreview)
  const applyHeading = (level: number) => applyFormat(doc => doc.execCommand('formatBlock', false, `h${level}`));
  const applyParagraph = () => applyFormat(doc => doc.execCommand('formatBlock', false, 'p'));
  const insertBulletedList = () => applyFormat(doc => doc.execCommand('insertUnorderedList'));
  const insertNumberedList = () => applyFormat(doc => doc.execCommand('insertOrderedList'));
  const insertLink = () => {
    const url = typeof window !== 'undefined' ? window.prompt('Enter link URL') : null;
    if (!url) return;
    applyFormat(doc => {
      const sel = doc.getSelection();
      if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
        doc.execCommand('createLink', false, url);
      } else {
        doc.execCommand('insertHTML', false, `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`); 
      }
    });
  };
  const removeLink = () => applyFormat(doc => doc.execCommand('unlink'));
  const toggleBold = () => applyFormat(doc => doc.execCommand('bold'));
  const toggleItalic = () => applyFormat(doc => doc.execCommand('italic'));
  const toggleUnderline = () => applyFormat(doc => doc.execCommand('underline'));
  const toggleStrikeThrough = () => applyFormat(doc => doc.execCommand('strikeThrough'));
  const alignLeft = () => applyFormat(doc => doc.execCommand('justifyLeft'));
  const alignCenter = () => applyFormat(doc => doc.execCommand('justifyCenter'));
  const alignRight = () => applyFormat(doc => doc.execCommand('justifyRight'));
  const alignJustify = () => applyFormat(doc => doc.execCommand('justifyFull'));
  const indent = () => applyFormat(doc => doc.execCommand('indent'));
  const outdent = () => applyFormat(doc => doc.execCommand('outdent'));
  const insertBlockquote = () => applyFormat(doc => doc.execCommand('formatBlock', false, 'blockquote'));
  const insertCodeBlock = () => applyFormat(doc => doc.execCommand('formatBlock', false, 'pre'));
  const insertHorizontalRule = () => applyFormat(doc => doc.execCommand('insertHorizontalRule'));
  const superscript = () => applyFormat(doc => doc.execCommand('superscript'));
  const subscript = () => applyFormat(doc => doc.execCommand('subscript'));
  const clearFormat = () => applyFormat(doc => doc.execCommand('removeFormat'))
  const undo = () => applyFormat(doc => doc.execCommand('undo'))
  const redo = () => applyFormat(doc => doc.execCommand('redo'))
  const applyTextColor = (color: string) => applyFormat(doc => doc.execCommand('foreColor', false, color));
  const applyBackColor = (color: string) => applyFormat(doc => {
    if (doc.queryCommandSupported('hiliteColor')) {
      doc.execCommand('hiliteColor', false, color);
    } else {
      doc.execCommand('backColor', false, color);
    }
  });
  const setFontName = (name: string) => applyFormat(doc => doc.execCommand('fontName', false, name));
  const setFontSize = (sizeLabel: string) => {
    // Map common px sizes to execCommand sizes (1-7). This produces <font size> tags.
    const map: Record<string, number> = { '12px': 2, '14px': 3, '16px': 4, '18px': 5, '24px': 6 };
    const s = map[sizeLabel] || 3;
    applyFormat(doc => doc.execCommand('fontSize', false, String(s)));
  };
  const insertImage = (imageUrl: string) => {
    applyFormat(doc => {
      doc.execCommand('insertImage', false, imageUrl);
      // Trigger input event to notify content changed
      setTimeout(() => {
        doc.body?.dispatchEvent(new Event('input', { bubbles: true }));
      }, 10);
    });
  };
  const insertBasicTable = (rows: number = 2, cols: number = 2) => {
    let html = '<table style="border-collapse: collapse; width: 100%;"><tbody>';

    for (let i = 0; i < rows; i++) {
      html += '<tr>';
      for (let j = 0; j < cols; j++) {
        html += '<td style="border: 1px solid #ccc; padding: 8px; min-width: 60px; height: 32px;"></td>';
      }
      html += '</tr>';
    }

    html += '</tbody></table>';
    applyFormat(doc => doc.execCommand('insertHTML', false, html));
  };
  const insertEmoji = (emoji: string) => applyFormat(doc => doc.execCommand('insertText', false, emoji));

  // Table operations
  const addTableRow = () => applyFormat(doc => {
    const table = doc.querySelector('table');
    if (!table) return;

    const firstRow = table.querySelector('tr');
    if (!firstRow) return;

    const cellCount = firstRow.children.length;
    const newRow = doc.createElement('tr');

    for (let i = 0; i < cellCount; i++) {
      const newCell = doc.createElement('td');
      newCell.style.border = '1px solid #ccc';
      newCell.style.padding = '8px';
      newCell.style.minWidth = '60px';
      newCell.style.height = '32px';
      newRow.appendChild(newCell);
    }

    table.appendChild(newRow);
  });

  const deleteTableRow = () => applyFormat(doc => {
    const table = doc.querySelector('table');
    if (!table) return;

    const rows = table.querySelectorAll('tr');
    if (rows.length > 1) {
      const lastRow = rows[rows.length - 1];
      lastRow.remove();
    }
  });

  const addTableColumn = () => applyFormat(doc => {
    const table = doc.querySelector('table');
    if (!table) return;

    const rows = table.querySelectorAll('tr');
    const firstRow = rows[0];
    if (!firstRow) return;

    rows.forEach(row => {
      const newCell = doc.createElement('td');
      newCell.style.border = '1px solid #ccc';
      newCell.style.padding = '8px';
      newCell.style.minWidth = '60px';
      newCell.style.height = '32px';
      row.appendChild(newCell);
    });
  });

  const deleteTableColumn = () => applyFormat(doc => {
    const table = doc.querySelector('table');
    if (!table) return;

    const firstRow = table.querySelector('tr');
    if (!firstRow) return;

    if (firstRow.children.length > 1) {
      const rows = table.querySelectorAll('tr');
      rows.forEach(row => {
        const lastCell = row.lastElementChild;
        if (lastCell) {
          lastCell.remove();
        }
      });
    }
  });

  return (
    <div className="flex flex-col bg-gray-50 border-b border-gray-300">
      {/* Row 1: Core editing features */}
      <div className="flex items-center flex-wrap px-4 py-2 gap-2">
        {/* Undo/Redo */}
        <ToolbarGroup>
          <ToolbarButton title="Undo" onClick={undo} disabled={isDisabled}>
            <UndoIcon />
          </ToolbarButton>
          <ToolbarButton title="Redo" onClick={redo} disabled={isDisabled}>
            <RedoIcon />
          </ToolbarButton>
        </ToolbarGroup>

        {/* Font Family */}
        <ToolbarGroup>
          <ToolbarSelect
            label="Font"
            onChange={(e) => setFontName(e.target.value)}
            disabled={isDisabled}
            options={[
              { value: 'Arial', label: 'Arial' },
              { value: 'Times New Roman', label: 'Times New Roman' },
              { value: 'Georgia', label: 'Georgia' },
              { value: 'Courier New', label: 'Courier New' }
            ]}
          />
        </ToolbarGroup>

        {/* Font Size */}
        <ToolbarGroup>
          <ToolbarSelect
            label="Size"
            onChange={(e) => setFontSize(e.target.value)}
            disabled={isDisabled}
            options={[
              { value: '12px', label: '12px' },
              { value: '14px', label: '14px' },
              { value: '16px', label: '16px' },
              { value: '18px', label: '18px' },
              { value: '24px', label: '24px' }
            ]}
          />
        </ToolbarGroup>

        {/* Text Formatting - Most used, always visible */}
        <ToolbarGroup>
          <ToolbarButton title="Bold" onClick={toggleBold} disabled={isDisabled}>
            <span className="font-bold">B</span>
          </ToolbarButton>
          <ToolbarButton title="Italic" onClick={toggleItalic} disabled={isDisabled}>
            <span className="italic">I</span>
          </ToolbarButton>
          <ToolbarButton title="Underline" onClick={toggleUnderline} disabled={isDisabled}>
            <span className="underline">U</span>
          </ToolbarButton>
          <ToolbarButton title="Strikethrough" onClick={toggleStrikeThrough} disabled={isDisabled}>
            <span className="line-through">S</span>
          </ToolbarButton>
          <ToolbarButton title="Superscript" onClick={superscript} disabled={isDisabled}>
            Sup
          </ToolbarButton>
          <ToolbarButton title="Subscript" onClick={subscript} disabled={isDisabled}>
            Sub
          </ToolbarButton>
        </ToolbarGroup>

        {/* Colors */}
        <ToolbarGroup>
          <ColorPicker
            onColorSelect={(color) => applyFormat(doc => doc.execCommand('foreColor', false, color))}
          />
          <BackgroundColorPicker
            onColorSelect={(color) => {
              // For transparent color, use removeFormat
              if (color === 'transparent') {
                applyFormat(doc => doc.execCommand('removeFormat', false, ''))
              } else {
                applyFormat(doc => doc.execCommand('hiliteColor', false, color))
              }
            }}
          />
        </ToolbarGroup>

        {/* Text Alignment */}
        <ToolbarGroup>
          <ToolbarButton title="Align left" onClick={alignLeft} disabled={isDisabled}>
            <AlignIcon type="left" />
          </ToolbarButton>
          <ToolbarButton title="Align center" onClick={alignCenter} disabled={isDisabled}>
            <AlignIcon type="center" />
          </ToolbarButton>
          <ToolbarButton title="Align right" onClick={alignRight} disabled={isDisabled}>
            <AlignIcon type="right" />
          </ToolbarButton>
          <ToolbarButton title="Justify" onClick={alignJustify} disabled={isDisabled}>
            <AlignIcon type="justify" />
          </ToolbarButton>
        </ToolbarGroup>

        {/* Indentation */}
        <ToolbarGroup>
          <ToolbarButton title="Outdent" onClick={outdent} disabled={isDisabled}>
            <OutdentIcon />
          </ToolbarButton>
          <ToolbarButton title="Indent" onClick={indent} disabled={isDisabled}>
            <IndentIcon />
          </ToolbarButton>
        </ToolbarGroup>
      </div>

      {/* Row 2: Lists, Insert, and Format */}
      <div className="flex items-center flex-wrap px-4 py-2 gap-2 border-t border-gray-200">
        {/* Lists */}
        <ToolbarGroup>
          <ToolbarButton title="Bulleted list" onClick={insertBulletedList} disabled={isDisabled}>
            <ListIcon type="unordered" />
          </ToolbarButton>
          <ToolbarButton title="Numbered list" onClick={insertNumberedList} disabled={isDisabled}>
            <ListIcon type="ordered" />
          </ToolbarButton>
        </ToolbarGroup>

        {/* Insert */}
        <ToolbarGroup>
          <ToolbarButton title="Insert link" onClick={insertLink} disabled={isDisabled}>
            <LinkIcon />
          </ToolbarButton>
          <ImagePicker
            onImageSelect={insertImage}
            disabled={isDisabled}
          />
          <TablePicker
            onTableSelect={(rows, cols) => insertBasicTable(rows, cols)}
            disabled={isDisabled}
          />
          <ToolbarButton title="Add row" onClick={addTableRow} disabled={isDisabled}>
            <AddRowIcon />
          </ToolbarButton>
          <ToolbarButton title="Delete row" onClick={deleteTableRow} disabled={isDisabled}>
            <DeleteRowIcon />
          </ToolbarButton>
          <ToolbarButton title="Add column" onClick={addTableColumn} disabled={isDisabled}>
            <AddColumnIcon />
          </ToolbarButton>
          <ToolbarButton title="Delete column" onClick={deleteTableColumn} disabled={isDisabled}>
            <DeleteColumnIcon />
          </ToolbarButton>
        </ToolbarGroup>

        {/* Paragraph Format */}
        <ToolbarGroup>
          <ToolbarSelect
            label="Format"
            onChange={(e) => {
              const value = e.target.value
              if (value === 'h1') applyHeading(1)
              else if (value === 'h2') applyHeading(2)
              else if (value === 'h3') applyHeading(3)
              else if (value === 'p') applyParagraph()
              else if (value === 'blockquote') insertBlockquote()
              else if (value === 'code') insertCodeBlock()
            }}
            disabled={isDisabled}
            options={[
              { value: '', label: 'Normal text' },
              { value: 'h1', label: 'Heading 1' },
              { value: 'h2', label: 'Heading 2' },
              { value: 'h3', label: 'Heading 3' },
              { value: 'blockquote', label: 'Blockquote' },
              { value: 'code', label: 'Code block' }
            ]}
          />
        </ToolbarGroup>

        {/* More Actions */}
        <ToolbarGroup>
          <ToolbarButton title="Clear formatting" onClick={clearFormat} disabled={isDisabled}>
            Clear
          </ToolbarButton>
          <ToolbarButton title="Insert horizontal line" onClick={insertHorizontalRule} disabled={isDisabled}>
            <DividerIcon />
          </ToolbarButton>
        </ToolbarGroup>
      </div>
    </div>
  )
}

export default EditorToolbar