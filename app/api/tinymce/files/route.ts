import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const htmlDir = path.join(process.cwd(), 'data', 'html');

    // 递归读取所有HTML文件
    const getHtmlFiles = (dir: string, baseDir = ''): string[] => {
      const files: string[] = [];
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          files.push(...getHtmlFiles(fullPath, path.join(baseDir, item)));
        } else if (item.endsWith('.html')) {
          // 移除 .html 扩展名，只返回相对路径
          const relativePath = path.join(baseDir, item).replace(/\.html$/, '');
          files.push(relativePath);
        }
      }

      return files;
    };

    const htmlFiles = getHtmlFiles(htmlDir);

    return NextResponse.json({
      success: true,
      files: htmlFiles
    });
  } catch (error) {
    console.error('Error reading HTML files:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to read HTML files'
      },
      { status: 500 }
    );
  }
}
