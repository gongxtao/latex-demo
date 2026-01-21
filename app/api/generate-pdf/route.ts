import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer'

// Windows 系统常见 Chrome/Edge 路径
const POSSIBLE_CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Users\\' + process.env.USERNAME + '\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
]

export async function POST(request: Request) {
  let browser = null

  try {
    const { htmlContent, filename, floatingImages } = await request.json()

    if (!htmlContent) {
      return NextResponse.json(
        { error: '缺少HTML内容' },
        { status: 400 }
      )
    }

    // 启动浏览器 - 优先使用系统 Chrome，失败则使用 Puppeteer 默认
    const launchOptions: Parameters<typeof puppeteer.launch>[0] = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    }

    // 尝试使用系统安装的 Chrome
    const fs = await import('fs')
    for (const path of POSSIBLE_CHROME_PATHS) {
      if (fs.existsSync(path)) {
        launchOptions.executablePath = path
        console.log('使用系统浏览器:', path)
        break
      }
    }

    browser = await puppeteer.launch(launchOptions)

    const page = await browser.newPage()
    
    const withFloatingImages = appendFloatingImages(htmlContent, floatingImages)

    // 设置页面内容
    await page.setContent(withFloatingImages, {
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
    return new NextResponse(Buffer.from(pdfBuffer), {
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

const appendFloatingImages = (htmlContent: string, floatingImages?: Array<{
  id: string
  src: string
  x: number
  y: number
  width: number
  height: number
}>) => {
  if (!floatingImages || floatingImages.length === 0) {
    return htmlContent
  }

  const overlay = `
<div id="floating-image-overlay" style="position:absolute;inset:0;pointer-events:none;z-index:999999;">
${floatingImages.map(image => (
  `<img src="${image.src}" style="position:absolute;left:${image.x}px;top:${image.y}px;width:${image.width}px;height:${image.height}px;" />`
)).join('')}
</div>
`

  const overlayStyle = `
<style id="floating-image-overlay-style">
  body { position: relative; }
</style>
`

  let nextHtml = htmlContent
  if (nextHtml.includes('</head>')) {
    nextHtml = nextHtml.replace('</head>', `${overlayStyle}</head>`)
  } else {
    nextHtml = `${overlayStyle}${nextHtml}`
  }

  if (nextHtml.includes('</body>')) {
    nextHtml = nextHtml.replace('</body>', `${overlay}</body>`)
  } else {
    nextHtml = `${nextHtml}${overlay}`
  }

  return nextHtml
}

