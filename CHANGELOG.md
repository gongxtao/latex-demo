# Changelog

## Version 4.3 - Scroll Position Fix (Current)

### 🐛 Critical Bug Fix

**Fixed: Preview scroll jumping to top while editing**

#### Problem
When editing in preview mode, every keystroke caused the preview to scroll to the top, making editing extremely frustrating and unusable.

#### Solution
- ✅ Implemented scroll position preservation
- ✅ Saves scroll position before content updates
- ✅ Restores scroll position after content updates
- ✅ Maintains user's editing context perfectly

#### Impact
- **Before**: 😤 Frustrating, unusable editing
- **After**: 😊 Smooth, natural editing flow

**Documentation:**
- See `SCROLL_FIX.md` for technical details

---

## Version 4.2 - Chat Streaming

### 🎬 New Feature: Streaming Chat Responses

**Watch AI responses appear word by word!**

#### What's New
- ✅ **Chat Streaming** - AI responses stream in real-time
- ✅ **Typing Cursor** - Blinking cursor shows AI is "typing"
- ✅ **Natural Feel** - Like chatting with a real person
- ✅ **Instant Feedback** - Know AI is responding immediately
- ✅ **Better UX** - More engaging conversation experience

#### Technical Changes
- 🆕 `/api/chat-stream` - New streaming chat endpoint
- 🎨 Added typing cursor animation to chat bubbles
- ⚡ Real-time message updates as AI generates response
- 🔄 Improved ChatBox component with streaming support

**Documentation:**
- See `CHAT_STREAMING.md` for complete details

---

## Version 4.1 - Layout Fixes

### 🐛 Bug Fixes
- ✅ Fixed navbar overlapping content issue
- ✅ Fixed empty space below Generate Resume button
- ✅ Improved height calculations for better layout
- ✅ Hide save button during generation

**Documentation:**
- See `LAYOUT_FIX.md` for details

---

## Version 4.0 - Real-Time Streaming Generation

### 🎬 New Feature: Streaming Output

**Watch Your Resume Being Generated in Real-Time!**

#### What's New
- ✅ **Streaming Generation** - See resume content appear word by word
- ✅ **Loading Animation** - Spinning icon on "Generate Resume" button
- ✅ **Progress Banner** - Blue banner shows "Generating in real-time..."
- ✅ **Live Preview Updates** - Content streams into preview as AI generates
- ✅ **Better UX** - Users know exactly what's happening

#### Technical Changes
- 🆕 `/api/generate-resume-stream` - New streaming endpoint
- 🔄 Updated frontend to handle SSE (Server-Sent Events)
- 🎨 Added loading animations and visual feedback
- ⚡ Real-time content updates in preview

#### User Experience
```
Before: Click → Wait (no feedback) → Suddenly done
After:  Click → Spinning icon → Watch content appear → Done!
```

**Documentation:**
- See `STREAMING_FEATURE.md` for complete details

---

## Version 3.0 - True WYSIWYG Editor

### Major Changes
- ✅ Direct editing in preview (no HTML code shown)
- ✅ Click anywhere to edit text
- ✅ Enable/Lock editing modes
- ✅ Removed code editor component

---

## Version 2.0 - HTML Resume Editor

### Major Changes

#### 1. **Switched from LaTeX to HTML**
- ✅ All resume templates are now HTML-based (located in `data/html/`)
- ✅ Better WYSIWYG (What You See Is What You Get) editing experience
- ✅ Real-time preview with no compilation needed

#### 2. **Improved Editor Experience**
- ✅ New `HtmlEditor` component with three view modes:
  - **Code Only**: Full-screen code editor
  - **Split View**: Side-by-side code and preview (recommended)
  - **Preview Only**: Full-screen live preview
- ✅ Real-time HTML rendering in iframe
- ✅ Syntax highlighting for HTML/CSS
- ✅ Live preview updates as you type

#### 3. **Enhanced File Organization**
- ✅ Files organized by categories:
  - Resume Template
  - Cover Letter Template
  - Invoice
  - Meeting Agenda Template
- ✅ Category-based file selector in top navigation
- ✅ Improved file browsing experience

#### 4. **Internationalization**
- ✅ All UI text converted to English
- ✅ AI prompts in English
- ✅ Error messages in English
- ✅ Better for international users

#### 5. **API Updates**
- ✅ `/api/files` - Now returns categorized HTML files
- ✅ `/api/file-content` - Reads/writes from `data/html/` directory
- ✅ `/api/chat` - AI assistant with English prompts
- ✅ `/api/generate-resume` - Generates HTML instead of LaTeX
- ❌ `/api/render-latex` - Removed (no longer needed)

### Technical Improvements

- **Better Performance**: No need for LaTeX compilation
- **Instant Preview**: Real-time rendering with iframe
- **Simpler Stack**: Removed LaTeX dependencies
- **Cleaner Code**: Removed unused packages

### File Structure

```
data/html/
├── resume-template/
│   ├── ATS finance resume.html
│   ├── Modern chronological resume.html
│   ├── Resume cover letter for unsolicited resume.html
│   └── Simple healthcare resume.html
├── cover-letter-template/
│   ├── Bold minimalist professional cover letter.html
│   ├── Bold nursing cover letter.html
│   ├── Modern chronological cover letter.html
│   └── Monochrome professional cover letter.html
├── invoice/
│   ├── Business sales invoice.html
│   ├── Invoice Simple modern.html
│   ├── Sales invoice.html
│   └── Service invoice.html
└── meeting-agenda-template/
    ├── business-meeting-agenda_table.html
    ├── Education meeting agenda.html
    └── Team meeting agenda informal.html
```

### Usage

1. **Select a Template**: Click on any template in the top navigation
2. **Chat with AI**: Provide your information in the left chat box
3. **Generate Resume**: Click "Generate Resume" button
4. **Edit & Preview**: Use split view to see changes in real-time
5. **Save**: Click "Save File" when done

### Breaking Changes

- LaTeX templates are no longer supported
- Old `LatexEditor` component removed
- Must use HTML templates from `data/html/` directory

---

## Version 1.0 - LaTeX Resume Editor (Deprecated)

Initial release with LaTeX support.

