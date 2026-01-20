import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

interface FileCategory {
  category: string
  displayName: string
  files: string[]
}

export async function GET() {
  try {
    const htmlDir = path.join(process.cwd(), 'data', 'html')
    
    // 读取所有子目录
    const categories = fs.readdirSync(htmlDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
    
    // 读取每个分类下的HTML文件
    const filesByCategory: FileCategory[] = categories.map(category => {
      const categoryPath = path.join(htmlDir, category)
      const files = fs.readdirSync(categoryPath)
        .filter(file => file.endsWith('.html'))
      
      // 生成友好的分类名称
      const displayName = category
        .replace(/-/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      
      return {
        category,
        displayName,
        files: files.map(file => `${category}/${file}`)
      }
    }).filter(cat => cat.files.length > 0)
    
    return NextResponse.json({ categories: filesByCategory })
  } catch (error) {
    console.error('Failed to read file list:', error)
    return NextResponse.json(
      { error: 'Failed to read file list' },
      { status: 500 }
    )
  }
}

