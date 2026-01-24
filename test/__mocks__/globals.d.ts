/**
 * Global type definitions for testing environment
 * Extends the global namespace with test-specific utilities and mocks
 */

declare namespace NodeJS {
  interface Global {
    /**
     * Mock ResizeObserver implementation
     */
    ResizeObserver: {
      prototype: ResizeObserver;
      new (callback: ResizeObserverCallback): ResizeObserver;
    };

    /**
     * Mock MutationObserver implementation
     */
    MutationObserver: {
      prototype: MutationObserver;
      new (callback: MutationCallback): MutationObserver;
    };
  }
}

/**
 * Extended Window interface for test mocks
 */
interface Window {
  /**
   * Mock prompt function for testing
   */
  prompt: jest.Mock;

  /**
   * Mock confirm function for testing
   */
  confirm: jest.Mock;
}

/**
 * ResizeObserver callback type
 */
interface ResizeObserverCallback {
  (entries: ResizeObserverEntry[], observer: ResizeObserver): void;
}

/**
 * ResizeObserver entry interface
 */
interface ResizeObserverEntry {
  target: Element;
  contentRect: DOMRectReadOnly;
  borderBoxSize: ResizeObserverSize[];
  contentBoxSize: ResizeObserverSize[];
  devicePixelContentBoxSize: ResizeObserverSize[];
}

/**
 * ResizeObserver size interface
 */
interface ResizeObserverSize {
  inlineSize: number;
  blockSize: number;
}

/**
 * ResizeObserver mock class interface
 */
interface ResizeObserver {
  observe(target: Element, options?: ResizeObserverOptions): void;
  unobserve(target: Element): void;
  disconnect(): void;
}

/**
 * ResizeObserver options interface
 */
interface ResizeObserverOptions {
  box?: 'content-box' | 'border-box' | 'device-pixel-content-box';
}

/**
 * MutationObserver callback type
 */
type MutationCallback = (mutations: MutationRecord[], observer: MutationObserver) => void;

/**
 * MutationObserver mock class interface
 */
interface MutationObserver {
  observe(target: Node, options?: MutationObserverInit): void;
  disconnect(): void;
  takeRecords(): MutationRecord[];
}

export {};
