import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer'

export async function POST(request: Request) {
  let browser = null
  
  try {
    const { htmlContent, filename } = await request.json()
    
    if (!htmlContent) {
      return NextResponse.json(
        { error: '缺少HTML内容' },
        { status: 400 }
      )
    }

    // 启动浏览器
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    })

    const page = await browser.newPage()
    
    // 设置页面内容
    await page.setContent(htmlContent, {
      waitUntil: ['networkidle0', 'load'],
      timeout: 30000
    })

    // 等待样式完全加载
    await page.evaluateHandle('document.fonts.ready')
    
    // 生成PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true, // 重要：打印背景色
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm',
      },
      preferCSSPageSize: false,
    })

    await browser.close()

    // 返回PDF文件
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename || 'resume'}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF生成失败:', error)
    
    if (browser) {
      await browser.close()
    }
    
    return NextResponse.json(
      { error: 'PDF生成失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

