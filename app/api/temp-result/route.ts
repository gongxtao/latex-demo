import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// 保存AI优化后的结果到临时文件
export async function POST(request: Request) {
  try {
    const { originalFilename, content } = await request.json()
    
    if (!originalFilename || content === undefined) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }
    
    // 确保临时结果目录存在
    const tempDir = path.join(process.cwd(), 'data', 'temp_results')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    
    // 生成临时文件名：原文件名_时间戳.html
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const originalName = path.basename(originalFilename, '.html')
    const tempFilename = `${originalName}_${timestamp}.html`
    const tempFilePath = path.join(tempDir, tempFilename)
    
    // 保存到临时文件
    fs.writeFileSync(tempFilePath, content, 'utf-8')
    
    return NextResponse.json({ 
      success: true,
      tempFilename,
      message: `已保存到临时文件: ${tempFilename}`
    })
  } catch (error) {
    console.error('保存临时文件失败:', error)
    return NextResponse.json(
      { error: '保存临时文件失败' },
      { status: 500 }
    )
  }
}

// 获取所有临时结果文件列表
export async function GET() {
  try {
    const tempDir = path.join(process.cwd(), 'data', 'temp_results')
    
    if (!fs.existsSync(tempDir)) {
      return NextResponse.json({ files: [] })
    }
    
    const files = fs.readdirSync(tempDir)
      .filter(file => file.endsWith('.html'))
      .map(file => {
        const filePath = path.join(tempDir, file)
        const stats = fs.statSync(filePath)
        return {
          name: file,
          size: stats.size,
          modified: stats.mtime.toISOString()
        }
      })
      .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime())
    
    return NextResponse.json({ files })
  } catch (error) {
    console.error('读取临时文件列表失败:', error)
    return NextResponse.json(
      { error: '读取临时文件列表失败' },
      { status: 500 }
    )
  }
}

// 删除临时文件
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')
    
    if (!filename) {
      return NextResponse.json(
        { error: '缺少文件名参数' },
        { status: 400 }
      )
    }
    
    const tempFilePath = path.join(process.cwd(), 'data', 'temp_results', filename)
    
    // 安全检查：确保文件在temp_results目录内
    const tempDir = path.join(process.cwd(), 'data', 'temp_results')
    if (!tempFilePath.startsWith(tempDir)) {
      return NextResponse.json(
        { error: '非法文件路径' },
        { status: 400 }
      )
    }
    
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath)
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: '文件不存在' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('删除临时文件失败:', error)
    return NextResponse.json(
      { error: '删除临时文件失败' },
      { status: 500 }
    )
  }
}

