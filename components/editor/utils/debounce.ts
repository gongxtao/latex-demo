/**
 * 防抖工具函数
 *
 * @param func 要防抖的函数
 * @param wait 等待时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args)
      timeoutId = null
    }, wait)
  }
}

/**
 * 节流工具函数
 *
 * @param func 要节流的函数
 * @param limit 时间限制（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  let lastResult: ReturnType<T>

  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      inThrottle = true
      lastResult = func.apply(this, args)

      setTimeout(() => {
        inThrottle = false
      }, limit)
    }

    return lastResult
  }
}

/**
 * 带取消功能的防抖
 *
 * @param func 要防抖的函数
 * @param wait 等待时间（毫秒）
 * @returns 包含防抖函数和取消函数的对象
 */
export function debounceWithCancel<T extends (...args: any[]) => any>(
  func: T,
  wait: number
) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const debounced = function (this: any, ...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args)
      timeoutId = null
    }, wait)
  }

  const cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  const flush = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      func()
      timeoutId = null
    }
  }

  return { debounced, cancel, flush }
}