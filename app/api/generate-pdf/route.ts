import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import type { Page } from 'puppeteer'

interface FloatingImagePayload {
  id: string
  src: string
  x: number
  y: number
  width: number
  height: number
}

interface OffsetPayload {
  left: number
  top: number
}

interface PdfDebugMeta {
  editorBodyLeft: number
  editorBodyTop: number
  pdfBodyLeft: number
  pdfBodyTop: number
  deltaX: number
  deltaY: number
  viewportWidth: number
  floatingImageCount: number
  coordinateSpace: string
}

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
    const { htmlContent, filename, floatingImages, floatingCoordinateSpace, viewportWidth, editorBodyOffset, debug } = await request.json()

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
    await page.emulateMediaType('screen')
    const normalizedViewportWidth = Number.isFinite(viewportWidth) ? Math.max(800, Math.round(viewportWidth)) : 1024
    await page.setViewport({ width: normalizedViewportWidth, height: 1400, deviceScaleFactor: 1 })
    
    const withEditorCompatStyles = appendEditorCompatStyles(htmlContent)

    // 设置页面内容
    await page.setContent(withEditorCompatStyles, {
      waitUntil: ['networkidle0', 'load'],
      timeout: 30000
    })

    // 等待样式完全加载
    await page.evaluateHandle('document.fonts.ready')

    let debugMeta: PdfDebugMeta | null = null
    if (Array.isArray(floatingImages) && floatingImages.length > 0) {
      const coordinateSpace = floatingCoordinateSpace === 'body' ? 'body' : 'document'
      const editorOffset = normalizeOffset(editorBodyOffset)
      const pdfOffset = await page.evaluate(() => {
        const rect = document.body?.getBoundingClientRect()
        return {
          left: rect?.left ?? 0,
          top: rect?.top ?? 0
        }
      })

      const deltaX = coordinateSpace === 'body' ? 0 : (pdfOffset.left - editorOffset.left)
      const deltaY = coordinateSpace === 'body' ? 0 : (pdfOffset.top - editorOffset.top)
      debugMeta = {
        editorBodyLeft: editorOffset.left,
        editorBodyTop: editorOffset.top,
        pdfBodyLeft: pdfOffset.left,
        pdfBodyTop: pdfOffset.top,
        deltaX,
        deltaY,
        viewportWidth: normalizedViewportWidth,
        floatingImageCount: floatingImages.length,
        coordinateSpace
      }
      const adjustedImages: FloatingImagePayload[] = (floatingImages as FloatingImagePayload[]).map(image => ({
        ...image,
        x: image.x + deltaX,
        y: image.y + deltaY
      }))

      await injectFloatingImages(page, adjustedImages, coordinateSpace)
    }
    
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
        ...(debug && debugMeta ? {
          'X-PDF-Debug-Editor-Body-Left': String(debugMeta.editorBodyLeft),
          'X-PDF-Debug-Editor-Body-Top': String(debugMeta.editorBodyTop),
          'X-PDF-Debug-Render-Body-Left': String(debugMeta.pdfBodyLeft),
          'X-PDF-Debug-Render-Body-Top': String(debugMeta.pdfBodyTop),
          'X-PDF-Debug-Delta-X': String(debugMeta.deltaX),
          'X-PDF-Debug-Delta-Y': String(debugMeta.deltaY),
          'X-PDF-Debug-Viewport-Width': String(debugMeta.viewportWidth),
          'X-PDF-Debug-Floating-Count': String(debugMeta.floatingImageCount),
          'X-PDF-Debug-Coordinate-Space': String(debugMeta.coordinateSpace)
        } : {})
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

const appendEditorCompatStyles = (htmlContent: string) => {
  const compatStyle = `
<style id="editor-pdf-compat-style">
  img {
    max-width: 100%;
  }
</style>
`
  if (htmlContent.includes('</head>')) {
    return htmlContent.replace('</head>', `${compatStyle}</head>`)
  }
  return `${compatStyle}${htmlContent}`
}

const normalizeOffset = (offset: unknown): OffsetPayload => {
  const input = (offset || {}) as Partial<OffsetPayload>
  return {
    left: Number.isFinite(input.left) ? Number(input.left) : 0,
    top: Number.isFinite(input.top) ? Number(input.top) : 0
  }
}

const injectFloatingImages = async (page: Page, images: FloatingImagePayload[], coordinateSpace: 'body' | 'document') => {
  await page.evaluate((floatingImages: FloatingImagePayload[], space: 'body' | 'document') => {
    const existingOverlay = document.getElementById('floating-image-overlay')
    if (existingOverlay) {
      existingOverlay.remove()
    }
    const existingStyle = document.getElementById('floating-image-overlay-style')
    if (existingStyle) {
      existingStyle.remove()
    }

    const style = document.createElement('style')
    style.id = 'floating-image-overlay-style'
    style.textContent = `
      html { position: relative; }
      body { position: relative; }
      #floating-image-overlay {
        position: absolute;
        left: 0;
        top: 0;
        width: 0;
        height: 0;
        pointer-events: none;
        z-index: 999999;
      }
      #floating-image-overlay img {
        position: absolute;
        max-width: none;
      }
    `
    document.head.appendChild(style)

    const overlay = document.createElement('div')
    overlay.id = 'floating-image-overlay'

    floatingImages.forEach((image: FloatingImagePayload) => {
      const img = document.createElement('img')
      img.src = image.src
      img.style.left = `${image.x}px`
      img.style.top = `${image.y}px`
      img.style.width = `${image.width}px`
      img.style.height = `${image.height}px`
      overlay.appendChild(img)
    })

    if (space === 'body') {
      document.body.appendChild(overlay)
    } else {
      document.documentElement.appendChild(overlay)
    }
  }, images, coordinateSpace)
}
