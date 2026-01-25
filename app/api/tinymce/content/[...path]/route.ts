import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // 获取文件路径参数
    const filePath = params.path.join('/');

    // 构建完整的文件路径
    const fullPath = path.join(process.cwd(), 'data', 'html', `${filePath}.html`);

    // 检查文件是否存在
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json(
        {
          success: false,
          error: 'File not found'
        },
        { status: 404 }
      );
    }

    // 读取文件内容
    const content = fs.readFileSync(fullPath, 'utf-8');

    return NextResponse.json({
      success: true,
      content,
      fileName: filePath
    });
  } catch (error) {
    console.error('Error reading HTML file:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to read HTML file'
      },
      { status: 500 }
    );
  }
}
