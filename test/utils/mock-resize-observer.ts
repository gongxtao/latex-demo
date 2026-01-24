/**
 * ResizeObserver mock implementation for testing
 * Allows tests to use ResizeObserver without browser implementation
 */

/**
 * ResizeObserver entry interface (minimal implementation)
 */
interface MockResizeObserverEntry {
  target: Element;
  contentRect: DOMRectReadOnly;
  borderBoxSize: ResizeObserverSize[];
  contentBoxSize: ResizeObserverSize[];
  devicePixelContentBoxSize: ResizeObserverSize[];
}

/**
 * ResizeObserver size interface
 */
interface MockResizeObserverSize {
  inlineSize: number;
  blockSize: number;
}

/**
 * ResizeObserver callback function type
 */
type ResizeObserverCallback = (
  entries: MockResizeObserverEntry[],
  observer: MockResizeObserver
) => void;

/**
 * Mock ResizeObserverEntry class
 */
class MockResizeObserverEntryClass {
  readonly target: Element;
  readonly contentRect: DOMRectReadOnly;
  readonly borderBoxSize: MockResizeObserverSize[];
  readonly contentBoxSize: MockResizeObserverSize[];
  readonly devicePixelContentBoxSize: MockResizeObserverSize[];

  constructor(target: Element) {
    this.target = target;

    // Get the element's bounding rect for contentRect
    const rect = target.getBoundingClientRect();
    this.contentRect = {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
      toJSON: () => ({ ...this.contentRect }),
    } as DOMRectReadOnly;

    // Default size values
    this.borderBoxSize = [
      {
        inlineSize: rect.width,
        blockSize: rect.height,
      },
    ];

    this.contentBoxSize = [
      {
        inlineSize: rect.width - parseFloat(getComputedStyle(target).paddingLeft || '0') - parseFloat(getComputedStyle(target).paddingRight || '0'),
        blockSize: rect.height - parseFloat(getComputedStyle(target).paddingTop || '0') - parseFloat(getComputedStyle(target).paddingBottom || '0'),
      },
    ];

    this.devicePixelContentBoxSize = [
      {
        inlineSize: rect.width * window.devicePixelRatio,
        blockSize: rect.height * window.devicePixelRatio,
      },
    ];
  }
}

/**
 * Mock ResizeObserver class
 *
 * @example
 * ```tsx
 * const observer = new MockResizeObserver((entries) => {
 *   entries.forEach(entry => {
 *     console.log('Element resized:', entry.target);
 *   });
 * });
 *
 * const element = document.createElement('div');
 * observer.observe(element);
 * ```
 */
class MockResizeObserver {
  private callback: ResizeObserverCallback;
  private observedElements: Map<Element, ResizeObserverOptions>;
  private isObserving: boolean;

  /**
   * Creates a new MockResizeObserver instance
   *
   * @param callback - Function to call when resize is detected
   */
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    this.observedElements = new Map();
    this.isObserving = false;
  }

  /**
   * Observes an element for size changes
   *
   * @param target - Element to observe
   * @param options - Optional observation options
   */
  observe(target: Element, options?: ResizeObserverOptions): void {
    this.observedElements.set(target, options || {});

    // Trigger callback immediately with current size
    this.triggerCallback([target]);

    // If not already observing, start observing (in real implementation)
    if (!this.isObserving) {
      this.isObserving = true;
    }
  }

  /**
   * Unobserves an element
   *
   * @param target - Element to stop observing
   */
  unobserve(target: Element): void {
    this.observedElements.delete(target);

    if (this.observedElements.size === 0) {
      this.isObserving = false;
    }
  }

  /**
   * Disconnects and stops observing all elements
   */
  disconnect(): void {
    this.observedElements.clear();
    this.isObserving = false;
  }

  /**
   * Triggers the callback with mock entries for specified elements
   * This can be called in tests to simulate resize events
   *
   * @param targets - Elements to create entries for (defaults to all observed)
   */
  triggerCallback(targets?: Element[]): void {
    const elements = targets || Array.from(this.observedElements.keys());

    if (elements.length === 0) {
      return;
    }

    const entries: MockResizeObserverEntry[] = elements.map((target) => {
      return new MockResizeObserverEntryClass(target) as unknown as MockResizeObserverEntry;
    });

    this.callback(entries, this);
  }

  /**
   * Simulates a resize event for a specific element
   *
   * @param target - Element to simulate resize for
   * @param newSize - New size values to apply
   */
  simulateResize(target: Element, newSize: { width?: number; height?: number }): void {
    if (!this.observedElements.has(target)) {
      throw new Error('Element is not being observed');
    }

    // Apply new size to element's style
    if (newSize.width !== undefined) {
      (target as HTMLElement).style.width = `${newSize.width}px`;
    }

    if (newSize.height !== undefined) {
      (target as HTMLElement).style.height = `${newSize.height}px`;
    }

    // Trigger callback with new size
    this.triggerCallback([target]);
  }
}

/**
 * Sets up the ResizeObserver mock globally
 * Should be called in test setup files
 *
 * @example
 * ```tsx
 * // In jest.setup.js or test setup file
 * setupResizeObserverMock();
 * ```
 */
export function setupResizeObserverMock(): void {
  // @ts-ignore - Assigning to global ResizeObserver
  global.ResizeObserver = MockResizeObserver;

  // Also add to window object for completeness
  // @ts-ignore
  window.ResizeObserver = MockResizeObserver;
}

/**
 * Creates a spy for ResizeObserver that can track calls
 *
 * @returns Object containing mock instance and spy functions
 *
 * @example
 * ```tsx
 * const { observer, mockObserve, mockUnobserve, mockDisconnect } = createResizeObserverSpy();
 * element.addEventListener('resize', handler);
 * observer.observe(element);
 * expect(mockObserve).toHaveBeenCalledWith(element);
 * ```
 */
export function createResizeObserverSpy() {
  const mockObserve = jest.fn();
  const mockUnobserve = jest.fn();
  const mockDisconnect = jest.fn();

  class SpyResizeObserver extends MockResizeObserver {
    observe(target: Element, options?: ResizeObserverOptions): void {
      mockObserve(target, options);
      super.observe(target, options);
    }

    unobserve(target: Element): void {
      mockUnobserve(target);
      super.unobserve(target);
    }

    disconnect(): void {
      mockDisconnect();
      super.disconnect();
    }
  }

  return {
    observer: SpyResizeObserver,
    mockObserve,
    mockUnobserve,
    mockDisconnect,
  };
}

export { MockResizeObserver, MockResizeObserverEntryClass };
export type { MockResizeObserverEntry, MockResizeObserverSize, ResizeObserverCallback };
