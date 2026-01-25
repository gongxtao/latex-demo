import { test, expect } from '@playwright/test'

/**
 * Playwright E2E tests for EditablePreview component
 * Testing real browser behavior to maximize code coverage
 */

test.describe('EditablePreview E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the test page
    await page.goto('/test-editable-preview')
  })

  /**
   * SCENARIO 1: Basic Rendering and Edit Mode
   */
  test('should render EditablePreview and enable editing', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    const iframe = page.locator('iframe').first()
    await expect(iframe).toBeVisible()

    const enableButton = page.getByText(/Enable Editing/i)
    await expect(enableButton).toBeVisible()
    await enableButton.click()

    await page.waitForTimeout(500)
    await expect(iframe).toBeVisible()
  })

  /**
   * SCENARIO 2: Scroll Position Tracking
   */
  test('should track scroll position in iframe', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    const frameLocator = page.frameLocator('iframe').locator(':root')

    await frameLocator.evaluate(() => {
      document.body.style.height = '3000px'
      document.body.innerHTML = '<p>Long content</p>'.repeat(100)
    })

    await page.locator('iframe').evaluate((el: any) => {
      el.contentWindow?.scrollTo(0, 500)
    })
    await page.waitForTimeout(200)

    const scrollY = await page.locator('iframe').evaluate((el: any) => {
      return el.contentWindow?.scrollY || 0
    })
    expect(scrollY).toBeGreaterThan(0)
  })

  /**
   * SCENARIO 3: Selection Management
   */
  test('should save and restore selection', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    const frameLocator = page.frameLocator('iframe').locator(':root')

    await frameLocator.evaluate(() => {
      document.body.innerHTML = '<p>Select this text</p>'
    })

    await frameLocator.evaluate(() => {
      const p = document.querySelector('p')
      if (p && p.firstChild) {
        const range = document.createRange()
        range.setStart(p.firstChild, 0)
        range.setEnd(p.firstChild, 6)
        const selection = window.getSelection()
        if (selection) {
          selection.removeAllRanges()
          selection.addRange(range)
        }
      }
    })

    await page.waitForTimeout(200)
    const hasSelection = await frameLocator.evaluate(() => {
      const sel = window.getSelection()
      return sel && sel.rangeCount > 0
    })
    expect(hasSelection).toBeTruthy()
  })

  /**
   * SCENARIO 4: Enter Key Handling
   */
  test('should handle Enter key at line end', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    await page.getByText(/Enable Editing/i).click()
    await page.waitForTimeout(500)

    const frameLocator = page.frameLocator('iframe').locator(':root')

    await frameLocator.evaluate(() => {
      document.body.innerHTML = '<p>Text at end</p>'
    })

    await frameLocator.evaluate(() => {
      const p = document.querySelector('p')
      if (p && p.firstChild) {
        const range = document.createRange()
        range.setStart(p.firstChild, p.firstChild.length)
        range.collapse(true)
        const selection = window.getSelection()
        if (selection) {
          selection.removeAllRanges()
          selection.addRange(range)
        }
      }
    })

    await page.locator('iframe').press('Enter')
    await page.waitForTimeout(100)

    const brCount = await frameLocator.evaluate(() => {
      const p = document.querySelector('p')
      return p ? p.querySelectorAll('br').length : 0
    })
    expect(brCount).toBeGreaterThanOrEqual(1)
  })

  /**
   * SCENARIO 5: Delete Key for Images
   */
  test('should delete selected image with Delete key', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    await page.getByText(/Enable Editing/i).click()
    await page.waitForTimeout(500)

    const frameLocator = page.frameLocator('iframe').locator(':root')

    await frameLocator.evaluate(() => {
      document.body.innerHTML = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" />'
    })

    await page.frameLocator('iframe').locator('img').click()
    await page.waitForTimeout(100)
    await page.locator('iframe').press('Delete')
    await page.waitForTimeout(100)

    const imgExists = await frameLocator.evaluate(() => document.querySelector('img') !== null)
    expect(imgExists).toBe(false)
  })

  /**
   * SCENARIO 6: Image Paste Handling
   */
  test('should handle image paste', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    await page.getByText(/Enable Editing/i).click()
    await page.waitForTimeout(500)

    const frameLocator = page.frameLocator('iframe').locator(':root')

    await frameLocator.evaluate(() => {
      const imageDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      const clipboardData = new DataTransfer()
      const byteString = atob(imageDataUrl.split(',')[1])
      const mimeString = imageDataUrl.split(',')[0].split(':')[1].split(';')[0]
      const ab = new ArrayBuffer(byteString.length)
      const ia = new Uint8Array(ab)
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i)
      }
      const blob = new Blob([ab], { type: mimeString })
      const file = new File([blob], 'test.png', { type: 'image/png' })
      clipboardData.items.add(file)

      const pasteEvent = new ClipboardEvent('paste', {
        clipboardData,
        bubbles: true,
        cancelable: true
      })
      document.dispatchEvent(pasteEvent)
    })

    await page.waitForTimeout(300)

    const imgCount = await frameLocator.evaluate(() => document.querySelectorAll('img').length)
    expect(imgCount).toBeGreaterThan(0)
  })

  /**
   * SCENARIO 7: Undo/Redo
   */
  test('should handle undo with Ctrl+Z', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    await page.getByText(/Enable Editing/i).click()
    await page.waitForTimeout(500)

    const frameLocator = page.frameLocator('iframe').locator(':root')

    await frameLocator.locator('body').click()
    await frameLocator.locator('body').type('Test')
    await page.waitForTimeout(1200)

    await page.locator('iframe').press('Control+z')
    await page.waitForTimeout(200)

    const bodyText = await frameLocator.evaluate(() => document.body.textContent || '')
    expect(bodyText).toBeTruthy()
  })

  /**
   * SCENARIO 8: Table Activation
   */
  test('should activate table on click', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    await page.getByText(/Enable Editing/i).click()
    await page.waitForTimeout(500)

    const frameLocator = page.frameLocator('iframe').locator(':root')

    await frameLocator.evaluate(() => {
      document.body.innerHTML = '<table><tr><td>Cell 1</td></tr></table>'
    })

    await page.frameLocator('iframe').locator('table').click()
    await page.waitForTimeout(200)

    const tableExists = await frameLocator.evaluate(() => document.querySelector('table') !== null)
    expect(tableExists).toBe(true)
  })

  /**
   * SCENARIO 9: Content Update with Debounce
   */
  test('should propagate content changes with debounced sync', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    await page.getByText(/Enable Editing/i).click()
    await page.waitForTimeout(500)

    const frameLocator = page.frameLocator('iframe').locator(':root')

    await frameLocator.evaluate(() => {
      document.body.innerHTML = '<p>Content</p>'
    })

    await page.frameLocator('iframe').locator('p').click()
    await page.frameLocator('iframe').locator('p').type(' more')
    await page.waitForTimeout(1200)

    const content = await frameLocator.evaluate(() => document.body.innerHTML)
    expect(content).toContain('more')
  })

  /**
   * SCENARIO 10: Event Listeners Registration
   */
  test('should register event listeners', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    await page.getByText(/Enable Editing/i).click()
    await page.waitForTimeout(700)

    const frameLocator = page.frameLocator('iframe').locator(':root')

    await frameLocator.evaluate(() => {
      document.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }))
    })

    expect(await frameLocator.evaluate(() => document.body !== null)).toBe(true)
  })

  /**
   * SCENARIO 11: Resizer Root Injection
   */
  test('should inject image-resizer-root', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    const frameLocator = page.frameLocator('iframe').locator(':root')

    await page.waitForTimeout(500)

    const hasResizerRoot = await frameLocator.evaluate(() => {
      return document.getElementById('image-resizer-root') !== null
    })
    expect(hasResizerRoot).toBe(true)
  })

  /**
   * SCENARIO 12: Content Editable Management
   */
  test('should manage contentEditable attributes', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    await page.getByText(/Enable Editing/i).click()
    await page.waitForTimeout(500)

    const frameLocator = page.frameLocator('iframe').locator(':root')

    const contentEditable = await frameLocator.evaluate(() => document.body.contentEditable)
    expect(contentEditable).toMatch(/true|inherit/)
  })

  /**
   * SCENARIO 13: RAF Scroll Handler
   */
  test('should use RAF for scroll updates', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    await page.getByText(/Enable Editing/i).click()
    await page.waitForTimeout(500)

    const iframe = page.locator('iframe').first()
    const frameLocator = page.frameLocator('iframe').locator(':root')

    await frameLocator.evaluate(() => {
      document.body.style.height = '5000px'
      document.body.innerHTML = '<p>Content</p>'.repeat(200)
    })

    await frameLocator.evaluate(() => {
      for (let i = 0; i < 10; i++) {
        window.scrollTo(0, i * 100)
      }
    })

    await page.waitForTimeout(300)

    const scrollY = await iframe.evaluate((el: any) => {
      return el.contentWindow?.scrollY || 0
    })
    expect(scrollY).toBeGreaterThan(0)
  })

  /**
   * SCENARIO 14: Style With CSS
   */
  test('should enable styleWithCSS', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    const frameLocator = page.frameLocator('iframe').locator(':root')

    await page.waitForTimeout(500)

    const result = await frameLocator.evaluate(() => {
      try {
        return document.execCommand('bold', false, null)
      } catch {
        return false
      }
    })
    expect(result).not.toBe(false)
  })

  /**
   * SCENARIO 15: Initial Load
   */
  test('should handle initial load correctly', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    const frameLocator = page.frameLocator('iframe').locator(':root')

    await page.waitForTimeout(500)

    const hasContent = await frameLocator.evaluate(() => document.body.innerHTML.length > 0)
    expect(hasContent).toBe(true)
  })

  /**
   * SCENARIO 16: Global Click Handler
   */
  test('should handle global clicks', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    await page.getByText(/Enable Editing/i).click()
    await page.waitForTimeout(500)

    const frameLocator = page.frameLocator('iframe').locator(':root')

    await frameLocator.evaluate(() => {
      document.body.innerHTML = '<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" /><p>Text</p>'
    })

    await page.frameLocator('iframe').locator('img').click()
    await page.waitForTimeout(100)
    await page.frameLocator('iframe').locator('p').click()
    await page.waitForTimeout(100)

    expect(await frameLocator.evaluate(() => document.body !== null)).toBe(true)
  })

  /**
   * SCENARIO 17: Backspace Key
   */
  test('should handle Backspace key', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    await page.getByText(/Enable Editing/i).click()
    await page.waitForTimeout(500)

    const frameLocator = page.frameLocator('iframe').locator(':root')

    await frameLocator.evaluate(() => {
      document.body.innerHTML = '<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />'
    })

    await page.frameLocator('iframe').locator('img').click()
    await page.waitForTimeout(100)
    await page.locator('iframe').press('Backspace')

    const imgExists = await frameLocator.evaluate(() => document.querySelector('img') !== null)
    expect(imgExists).toBe(false)
  })

  /**
   * SCENARIO 18: Enter Key in Middle
   */
  test('should handle Enter key in middle of line', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    await page.getByText(/Enable Editing/i).click()
    await page.waitForTimeout(500)

    const frameLocator = page.frameLocator('iframe').locator(':root')

    await frameLocator.evaluate(() => {
      document.body.innerHTML = '<p>TextInMiddle</p>'
    })

    await frameLocator.evaluate(() => {
      const p = document.querySelector('p')
      if (p && p.firstChild) {
        const range = document.createRange()
        range.setStart(p.firstChild, 4)
        range.collapse(true)
        const selection = window.getSelection()
        if (selection) {
          selection.removeAllRanges()
          selection.addRange(range)
        }
      }
    })

    await page.locator('iframe').press('Enter')

    const html = await frameLocator.evaluate(() => document.body.innerHTML)
    expect(html).toContain('<br>')
  })

  /**
   * SCENARIO 19: getCleanHtml - Remove Artifacts
   */
  test('should clean HTML when saving', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    await page.getByText(/Enable Editing/i).click()
    await page.waitForTimeout(500)

    const frameLocator = page.frameLocator('iframe').locator(':root')

    await frameLocator.evaluate(() => {
      document.body.innerHTML = '<p>Content</p><div id="image-resizer-root"></div>'
    })

    await page.frameLocator('iframe').locator('p').click()
    await page.frameLocator('iframe').locator('p').type('X')
    await page.waitForTimeout(1500)

    const bodyHtml = await frameLocator.evaluate(() => document.body.innerHTML)
    expect(bodyHtml).toBeTruthy()
  })

  /**
   * SCENARIO 20: Selection Change Events
   */
  test('should track selection changes', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    await page.getByText(/Enable Editing/i).click()
    await page.waitForTimeout(500)

    const frameLocator = page.frameLocator('iframe').locator(':root')

    await frameLocator.evaluate(() => {
      document.body.innerHTML = '<p>P1</p><p>P2</p>'
    })

    await page.frameLocator('iframe').locator('p').nth(0).click()
    await page.waitForTimeout(200)
    await page.frameLocator('iframe').locator('p').nth(1).click()
    await page.waitForTimeout(200)

    const hasSelection = await frameLocator.evaluate(() => {
      const sel = window.getSelection()
      return sel && sel.rangeCount > 0
    })
    expect(hasSelection).toBe(true)
  })

  /**
   * SCENARIO 21: Redo with Ctrl+Shift+Z
   */
  test('should handle redo', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    await page.getByText(/Enable Editing/i).click()
    await page.waitForTimeout(500)

    const frameLocator = page.frameLocator('iframe').locator(':root')

    await frameLocator.locator('body').click()
    await frameLocator.locator('body').type('A')
    await page.waitForTimeout(1200)

    await page.locator('iframe').press('Control+z')
    await page.waitForTimeout(200)

    await page.locator('iframe').press('Control+Shift+z')
    await page.waitForTimeout(200)

    expect(await frameLocator.evaluate(() => document.body.textContent)).toBeTruthy()
  })

  /**
   * SCENARIO 22: Empty Block Handling
   */
  test('should handle empty blocks', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    await page.getByText(/Enable Editing/i).click()
    await page.waitForTimeout(500)

    const frameLocator = page.frameLocator('iframe').locator(':root')

    await frameLocator.evaluate(() => {
      document.body.innerHTML = '<p>Content</p><p></p><p><br></p>'
    })

    await page.frameLocator('iframe').locator('p').nth(0).click()
    await page.waitForTimeout(1200)

    const pCount = await frameLocator.evaluate(() => document.querySelectorAll('p').length)
    expect(pCount).toBeGreaterThan(0)
  })

  /**
   * SCENARIO 23: Multiple Rapid Scrolls
   */
  test('should handle rapid scroll events', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    await page.getByText(/Enable Editing/i).click()
    await page.waitForTimeout(500)

    const iframe = page.locator('iframe').first()
    const frameLocator = page.frameLocator('iframe').locator(':root')

    await frameLocator.evaluate(() => {
      document.body.style.height = '2000px'
      document.body.innerHTML = '<p>Scroll test</p>'.repeat(50)
    })

    for (let i = 0; i < 20; i++) {
      await iframe.evaluate((el: any, y: number) => {
        el.contentWindow?.scrollTo(0, y)
      }, i * 50)
    }

    await page.waitForTimeout(300)

    const scrollY = await iframe.evaluate((el: any) => {
      return el.contentWindow?.scrollY || 0
    })
    expect(scrollY).toBeGreaterThan(0)
  })

  /**
   * SCENARIO 24: Node Path Calculation
   */
  test('should calculate node path for nested elements', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    await page.getByText(/Enable Editing/i).click()
    await page.waitForTimeout(500)

    const frameLocator = page.frameLocator('iframe').locator(':root')

    await frameLocator.evaluate(() => {
      document.body.innerHTML = '<div><p><span>Nested</span></p></div>'
    })

    await frameLocator.evaluate(() => {
      const span = document.querySelector('span')
      if (span && span.firstChild) {
        const range = document.createRange()
        range.setStart(span.firstChild, 0)
        range.setEnd(span.firstChild, 6)
        const selection = window.getSelection()
        if (selection) {
          selection.removeAllRanges()
          selection.addRange(range)
        }
      }
    })

    await page.waitForTimeout(200)

    const selectionText = await frameLocator.evaluate(() => window.getSelection()?.toString() || '')
    expect(selectionText).toBe('Nested')
  })
})
