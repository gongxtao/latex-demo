# HTML Resume Editor - Full-Featured WYSIWYG Editor

A powerful, feature-rich HTML resume editor with an intuitive **What You See Is What You Get** editing experience. Edit resumes directly in the browser with professional formatting, floating images, table editing, and more.

## ✨ Key Features

### Core Editing
- **Direct In-Document Editing** - Click anywhere to edit text, just like Microsoft Word
- **Rich Text Formatting** - Bold, italic, underline, headings, lists, and more
- **Floating Images** - Insert, drag, resize, and position images anywhere
- **Table Editing** - Smart table toolbar with insert/delete rows/columns, merge cells, resize
- **Format Painter** - Copy formatting from one element and apply to another
- **Undo/Redo** - Full history support with keyboard shortcuts (Ctrl+Z/Ctrl+Shift+Z)

### Document Management
- **Template Library** - Browse and select from professional resume templates
- **Auto-Save** - Changes automatically saved to localStorage (1-second debounce)
- **Save Status Indicator** - Real-time feedback: Saving, Saved, Unsaved
- **New Blank Document** - Start fresh with a blank document
- **Copy HTML** - Export raw HTML to clipboard

### Export Options
- **PDF Export** - High-quality PDF generation with floating images included
- **HTML Export** - Copy clean HTML code

### AI-Powered Generation (Bonus Feature)
- **AI Chat Assistant** - Conversational interface for providing resume information
- **Smart Resume Generation** - AI generates customized resumes based on your input
- **Template Preservation** - Original templates never modified; results saved separately

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

## 📖 Pages & Routes

### `/` - Fullscreen Editor (Main Page)
The primary editing interface with:
- Full-screen A4-style document editing
- Complete formatting toolbar
- File menu (New, Template, Export)
- Floating images and table support
- Auto-save to localStorage

### `/doc-formatter` - AI Document Generator
The original AI-powered resume generator with:
- Template browser at top
- AI chat interface on the left
- Live preview on the right
- Streaming AI generation
- PDF download with high-quality rendering

## 📖 Usage Guide

### Creating a New Document

1. Open [http://localhost:3000](http://localhost:3000)
2. Click **File** → **New Blank Document** to start fresh
3. Or click **File** → **Select Template...** to use a template

### Editing Content

1. Click anywhere in the document to start editing
2. Use the toolbar for formatting:
   - **Bold**, *Italic*, <u>Underline</u>
   - Headings (H1, H2, H3)
   - Lists (bullet, numbered)
   - Text alignment
   - Font size
3. Press **Enter** for new lines (smart line-end detection)
4. Use **Ctrl+Z** to undo, **Ctrl+Shift+Z** to redo

### Working with Images

1. Click the image icon in the toolbar
2. Enter image URL
3. Image appears as a floating layer that you can:
   - **Drag** to reposition
   - **Resize** using corner handles
   - **Delete** with Delete/Backspace key

### Editing Tables

1. Click inside any table to activate the table toolbar
2. Options include:
   - Insert/delete rows and columns
   - Merge/split cells
   - Resize rows and columns
   - Vertical alignment

### Using Format Painter

1. Select text with formatting you want to copy
2. Click the format painter icon in the toolbar
3. Select target text to apply the formatting

### AI Resume Generation (Bonus Feature)

1. Go to [http://localhost:3000/doc-formatter](http://localhost:3000/doc-formatter)
2. Select a template from the top navigation
3. Chat with the AI assistant to provide your information
4. Click "Generate Resume" to create a customized resume
5. Download as high-quality PDF

### Exporting

- **Export PDF** - Generates print-ready PDF with all formatting and images
- **Copy HTML** - Copies the document's HTML source to clipboard

## 🏗️ Project Structure

```
latex-demo/
├── app/
│   ├── api/
│   │   ├── file-content/        # File content API
│   │   ├── list-templates/      # Template listing API
│   │   ├── generate-pdf/        # PDF generation API
│   │   ├── generate-resume-stream/  # AI generation API
│   │   └── temp-result/         # Temporary result storage
│   ├── doc-formatter/
│   │   └── page.tsx             # AI document generator page
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                 # Fullscreen editor (homepage)
├── components/
│   ├── editor/
│   │   ├── EditablePreview.tsx  # Main WYSIWYG editor component
│   │   ├── EditorToolbar.tsx    # Formatting toolbar
│   │   ├── FloatingImageLayer.tsx  # Floating images overlay
│   │   ├── ImageResizer.tsx     # Image resize handles
│   │   ├── TableSmartToolbar.tsx   # Table editing tools
│   │   └── toolbar/
│   │       └── TableHandler.ts  # Table manipulation logic
│   ├── fullscreen-editor/
│   │   ├── EditorPage.tsx       # Fullscreen editor page component
│   │   ├── UnifiedToolbar.tsx   # Combined file + format toolbar
│   │   ├── TemplateModal.tsx    # Template selection modal
│   │   └── useEditorStorage.ts  # localStorage state management
│   ├── FileSelector.tsx         # Template browser
│   └── ChatBox.tsx              # AI chat interface
├── data/
│   └── html/                    # HTML templates
│       ├── resume-template/
│       ├── cover-letter-template/
│       └── invoice/
└── public/                      # Static assets
```

## 🛠️ Technical Stack

- **Framework**: Next.js 14.2 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks + localStorage
- **Icons**: SVG (inline)

## 📝 Component Architecture

### EditablePreview
The core editor component that handles:
- iframe-based document rendering
- Content editing and synchronization
- Selection management
- Undo/redo history
- Floating image layer positioning
- Scroll tracking

### UnifiedToolbar
Combines two toolbars:
1. **File Menu** - Document operations (New, Template, Copy HTML, Export PDF)
2. **Editor Toolbar** - Formatting tools (Bold, Italic, Lists, Images, etc.)

### FloatingImageLayer
Overlay layer that renders floating images:
- Absolute positioning over the document
- Drag-to-move functionality
- Resize handles
- Scroll offset compensation

### TableSmartToolbar
Context-aware toolbar for table operations:
- Row/column manipulation
- Cell merging/splitting
- Resizing controls
- Appears automatically when clicking inside tables

## 🎨 Key Implementation Details

### Scroll-Independent Floating Images
Floating images are rendered in a React layer overlaying the iframe, with scroll offset tracking to maintain position relative to document content.

### Format Painter
Uses Clipboard API to copy and apply inline styles between text selections.

### Table Editing
Direct DOM manipulation of table elements with smart cell detection and boundary handling.

### Auto-Save
Debounced localStorage writes (1 second) to prevent excessive writes during editing.

### PDF Export
Temporarily inserts floating images into the document DOM before printing, then removes them after the print dialog closes.

### AI Streaming Generation
Server-sent events for real-time resume generation with progressive content updates.

## 🔧 Development

### Adding New Templates

1. Create HTML file in `data/html/[category]/`
2. File will automatically appear in template browser

### Customizing Toolbar

Edit `components/editor/EditorToolbar.tsx` to add/remove formatting buttons.

### Modifying Export Behavior

Edit `components/fullscreen-editor/EditorPage.tsx`:
- `handleCopyHTML` - Modify HTML export behavior
- `handleExportPDF` - Modify PDF generation

## 🐛 Known Issues

1. **Floating Images Scroll** - In fullscreen editor mode, floating images don't scroll with the document (this is a known limitation due to different scroll containers)

## 📄 License

Apache License 2.0 - see [LICENSE](LICENSE) file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
