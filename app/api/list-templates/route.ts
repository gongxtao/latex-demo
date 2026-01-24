import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

export async function GET() {
  try {
    const htmlDir = path.join(process.cwd(), 'data', 'html')

    // Template categories with their display names
    const categories = {
      'resume-template': '简历模板',
      'cover-letter-template': '求职信模板',
      'invoice': '发票模板',
      'meeting-agenda-template': '会议议程模板'
    }

    const result: Record<string, Array<{ name: string; path: string }>> = {}

    for (const [categoryKey, _categoryName] of Object.entries(categories)) {
      const categoryPath = path.join(htmlDir, categoryKey)

      if (!fs.existsSync(categoryPath)) {
        result[categoryKey] = []
        continue
      }

      const files = fs.readdirSync(categoryPath)
        .filter(file => file.endsWith('.html'))
        .map(file => ({
          name: file.replace('.html', ''),
          path: `${categoryKey}/${file}`
        }))

      result[categoryKey] = files
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to list templates:', error)
    return NextResponse.json(
      { error: 'Failed to list templates' },
      { status: 500 }
    )
  }
}
