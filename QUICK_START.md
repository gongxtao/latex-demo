# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API Key
```bash
# Copy the example file
cp .env.local.example .env.local

# Edit and add your OpenRouter API key
# OPENROUTER_API_KEY=sk-or-v1-xxxxx
```

Get your API key from: https://openrouter.ai/

### 3. Start Development Server
```bash
npm run dev
```

Open http://localhost:3000

### 4. Create Your Resume

#### Step 1: Select Template
Click any template in the top navigation bar

#### Step 2: Chat with AI
```
You: Hi, I'm Sarah Chen, a software engineer with 5 years of experience

AI: Hello Sarah! Tell me about your work experience...

You: I worked at Google and Microsoft, building web apps with React

AI: Great! What about your education?

You: I have a BS in Computer Science from Stanford, graduated 2018
```

#### Step 3: Generate Resume
Click the **"✨ Generate Resume"** button

**Watch the magic happen:**
- ⟳ Button shows spinning animation
- 🔵 Blue banner appears: "Generating in real-time..."
- ✨ Content streams into preview word by word
- 🎉 Complete in ~30 seconds

#### Step 4: Edit Directly
1. Click **"✏️ Enable Editing"**
2. Click anywhere in the preview
3. Edit text directly
4. Click **"🔒 Lock Preview"** when done

#### Step 5: Save
Click **"💾 Save File"**

Done! 🎉

---

## 🎬 What You'll See

### Streaming Generation Effect

```
┌────────────────────────────────────┐
│ ⟳ Generating...                   │ ← Button animates
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ ✨ Generating in real-time...      │ ← Banner appears
├────────────────────────────────────┤
│ <html>                             │
│   <head>                           │ ← Content appears
│     <style>                        │   word by word
│       ... (streaming...)           │
│                                    │
└────────────────────────────────────┘
```

### Features

✅ **Live Streaming** - Watch content generate in real-time  
✅ **Visual Feedback** - Spinning icons and progress banners  
✅ **WYSIWYG Editing** - Click and edit directly  
✅ **Auto-Save Ready** - One-click save  

---

## 📁 Template Categories

Browse templates by type:
- **Resume Template** - Professional resumes
- **Cover Letter Template** - Matching cover letters  
- **Invoice** - Business invoices
- **Meeting Agenda Template** - Meeting documents

---

## 💡 Pro Tips

### Tip 1: Let AI Do the Heavy Lifting
```
✓ Provide all info in chat first
✓ Let AI generate 90% of content
✓ Manually edit the final 10%
```

### Tip 2: Use Multiple Templates
```
1. Try different templates
2. See which style fits you
3. Generate with different templates
4. Pick your favorite
```

### Tip 3: Iterative Refinement
```
1. Basic info → Generate
2. Add projects → Regenerate
3. Add skills → Regenerate
4. Final edit → Save
```

### Tip 4: Watch the Generation
```
- Don't click away during generation
- Watch what AI writes
- See if it captures your info correctly
- Edit if something is missed
```

---

## ⚡ Key Features

| Feature | Description |
|---------|-------------|
| **Streaming Output** | Watch resume generate word by word |
| **WYSIWYG Editor** | Edit directly in preview, no code |
| **AI Assistant** | Natural conversation to collect info |
| **Multiple Templates** | Professional designs for any field |
| **One-Click Save** | Save changes instantly |
| **Real-Time Preview** | See exactly what you get |

---

## 🐛 Troubleshooting

**Problem:** Can't see any templates  
**Solution:** Make sure `data/html/` directory has HTML files

**Problem:** Generate button doesn't work  
**Solution:** Check `.env.local` has valid API key

**Problem:** Content not streaming  
**Solution:** Check browser console, try refreshing

**Problem:** Can't edit preview  
**Solution:** Click "✏️ Enable Editing" button first

---

## 📚 Documentation

- `README.md` - Full project documentation
- `EDITING_GUIDE.md` - Detailed editing instructions
- `STREAMING_FEATURE.md` - Streaming feature details
- `CHANGELOG.md` - Version history

---

## 🎯 Example Workflow

### Creating a Tech Resume

```
1. Select "Modern chronological resume"

2. Chat with AI:
   "I'm a full-stack developer with 7 years experience.
    I worked at Amazon, building e-commerce platforms
    with React, Node.js, and AWS. I have a CS degree
    from MIT. My key skills are: React, TypeScript,
    Node.js, PostgreSQL, Docker, AWS."

3. Click "Generate Resume"
   → Watch content stream in

4. Enable editing
   → Click on dates, fix to exact dates
   → Add specific project names
   → Tweak job descriptions

5. Lock preview
   → Review everything

6. Save file
   → Done!
```

**Time:** ~3 minutes total  
**Quality:** Professional, complete resume

---

## 🚀 Next Steps

1. ✅ Create your first resume (follow steps above)
2. 📖 Read `EDITING_GUIDE.md` for advanced tips
3. 🎨 Try different templates for different styles
4. 💾 Export to PDF (use browser print → save as PDF)
5. 🎉 Land your dream job!

---

**Need Help?**
- Check documentation files
- Review browser console for errors
- Ensure API key is configured correctly

**Ready to Start?**
```bash
npm run dev
```

Good luck! 🎉

