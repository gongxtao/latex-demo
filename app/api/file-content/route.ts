import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')
    
    if (!filename) {
      return NextResponse.json(
        { error: 'Missing filename parameter' },
        { status: 400 }
      )
    }
    
    // HTML files are in data/html directory
    const filePath = path.join(process.cwd(), 'data', 'html', filename)
    
    // Security check: ensure file is within data/html directory
    const htmlDir = path.join(process.cwd(), 'data', 'html')
    if (!filePath.startsWith(htmlDir)) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 400 }
      )
    }
    
    const content = fs.readFileSync(filePath, 'utf-8')
    
    return NextResponse.json({ content })
  } catch (error) {
    console.error('Failed to read file content:', error)
    return NextResponse.json(
      { error: 'Failed to read file content' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { filename, content, allowOverwriteTemplate } = await request.json()
    
    if (!filename || content === undefined) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }
    
    // 安全检查：防止意外覆盖原模板
    // 除非明确设置 allowOverwriteTemplate = true
    const isTemplateFile = filename.includes('resume-template') || 
                          filename.includes('cover-letter-template') || 
                          filename.includes('invoice') ||
                          filename.includes('meeting-agenda-template')
    
    if (isTemplateFile && !allowOverwriteTemplate) {
      return NextResponse.json(
        { 
          error: '为保护原模板，此操作已被阻止。AI优化的结果已自动保存到 data/temp_results 目录。',
          suggestion: '如需保存，请使用临时结果功能。'
        },
        { status: 403 }
      )
    }
    
    // HTML files are in data/html directory
    const filePath = path.join(process.cwd(), 'data', 'html', filename)
    
    // Security check: ensure file is within data/html directory
    const htmlDir = path.join(process.cwd(), 'data', 'html')
    if (!filePath.startsWith(htmlDir)) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 400 }
      )
    }
    
    fs.writeFileSync(filePath, content, 'utf-8')
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save file:', error)
    return NextResponse.json(
      { error: 'Failed to save file' },
      { status: 500 }
    )
  }
}

