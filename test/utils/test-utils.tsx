/**
 * Core testing utility functions and providers
 * Provides custom render functions, mock creators, and helper utilities for tests
 */

import * as React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * Provider wrapper configuration interface
 */
interface WrapperProps {
  children: React.ReactNode;
}

/**
 * Custom render options interface
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  providers?: Array<{
    provider: React.ComponentType<{ children: React.ReactNode }>;
    props?: Record<string, unknown>;
  }>;
}

/**
 * Default wrapper component for rendering with providers
 */
const AllTheProviders: React.FC<
  WrapperProps & {
    providers?: Array<{
      provider: React.ComponentType<{ children: React.ReactNode }>;
      props?: Record<string, unknown>;
    }>;
  }
> = ({ children, providers = [] }) => {
  return (
    <>
      {providers.reduceRight(
        (acc, { provider: Provider, props = {} }) => (
          <Provider {...props}>{acc}</Provider>
        ),
        children
      )}
    </>
  );
};

/**
 * Custom render function that wraps components with providers
 *
 * @param ui - React component to render
 * @param options - Render options including custom providers
 * @returns RenderResult with component and helpers
 *
 * @example
 * ```tsx
 * const { getByText } = renderWithProviders(<MyComponent />, {
 *   providers: [
 *     { provider: ThemeProvider, props: { theme: mockTheme } }
 *   ]
 * });
 * ```
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: CustomRenderOptions
): RenderResult {
  const { providers = [], ...renderOptions } = options || {};

  function Wrapper({ children }: WrapperProps) {
    return <AllTheProviders providers={providers}>{children}</AllTheProviders>;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Creates a mock iframe element for testing editor functionality
 *
 * @param content - HTML content to populate in iframe
 * @param options - Optional configuration for iframe
 * @returns Mock iframe element with populated content
 *
 * @example
 * ```tsx
 * const iframe = createMockIframe('<p>Test content</p>');
 * document.body.appendChild(iframe);
 * ```
 */
export function createMockIframe(
  content: string = '',
  options: {
    id?: string;
    className?: string;
    width?: string;
    height?: string;
  } = {}
): HTMLIFrameElement {
  const iframe = document.createElement('iframe');
  iframe.id = options.id || 'mock-iframe';
  iframe.className = options.className || '';
  iframe.style.width = options.width || '100%';
  iframe.style.height = options.height || '400px';

  // Create mock document for iframe
  const mockDocument = document.implementation.createHTMLDocument('iframe');

  if (content) {
    mockDocument.body.innerHTML = content;
  }

  // Mock the contentDocument property
  Object.defineProperty(iframe, 'contentDocument', {
    value: mockDocument,
    writable: false,
  });

  // Create event listeners storage for the mock window
  const eventListeners: Map<string, Function[]> = new Map();

  // Mock the contentWindow property
  Object.defineProperty(iframe, 'contentWindow', {
    value: {
      document: mockDocument,
      getComputedStyle: window.getComputedStyle.bind(window),
      Selection: window.Selection,
      Range: window.Range,
      addEventListener: (event: string, handler: Function) => {
        if (!eventListeners.has(event)) {
          eventListeners.set(event, []);
        }
        eventListeners.get(event)!.push(handler);
      },
      removeEventListener: (event: string, handler: Function) => {
        const handlers = eventListeners.get(event);
        if (handlers) {
          const index = handlers.indexOf(handler);
          if (index > -1) {
            handlers.splice(index, 1);
          }
        }
      },
      dispatchEvent: (event: Event) => {
        const handlers = eventListeners.get(event.type);
        if (handlers) {
          handlers.forEach(handler => handler(event));
        }
        return true;
      },
    },
    writable: false,
  });

  return iframe;
}

/**
 * Cleans up mock iframe elements and removes them from DOM
 *
 * @param iframe - iframe element to cleanup
 *
 * @example
 * ```tsx
 * const iframe = createMockIframe();
 * document.body.appendChild(iframe);
 * // ... perform tests ...
 * cleanupMockIframe(iframe);
 * ```
 */
export function cleanupMockIframe(iframe: HTMLIFrameElement): void {
  if (iframe && iframe.parentNode) {
    iframe.parentNode.removeChild(iframe);
  }
}

/**
 * Waits for a single requestAnimationFrame frame
 * Useful for testing animations and transitions
 *
 * @returns Promise that resolves after RAF
 *
 * @example
 * ```tsx
 * await waitForRAF();
 * expect(element).toHaveClass('active');
 * ```
 */
export function waitForRAF(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  });
}

/**
 * Waits for specified amount of time
 *
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after timeout
 *
 * @example
 * ```tsx
 * await wait(100);
 * expect(mockFunction).toHaveBeenCalled();
 * ```
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Simulates pointer events (mouse, touch, pen) on an element
 * Falls back to MouseEvent if PointerEvent is not available (jsdom)
 *
 * @param element - Target element
 * @param eventType - Type of pointer event
 * @param options - Event options
 *
 * @example
 * ```tsx
 * const button = getByRole('button');
 * simulatePointerEvents(button, 'pointerdown', { clientX: 100, clientY: 100 });
 * ```
 */
export function simulatePointerEvents(
  element: Element,
  eventType: string,
  options: PointerEventInit = {}
): void {
  // Try to use PointerEvent if available, otherwise fall back to MouseEvent
  let event;
  try {
    event = new PointerEvent(eventType, {
      bubbles: true,
      cancelable: true,
      view: window,
      ...options,
    });
  } catch (e) {
    // PointerEvent not available (jsdom), use MouseEvent instead
    const mouseEventType = eventType
      .replace('pointerdown', 'mousedown')
      .replace('pointerup', 'mouseup')
      .replace('pointermove', 'mousemove')
      .replace('pointerenter', 'mouseenter')
      .replace('pointerleave', 'mouseleave')
      .replace('pointer', 'mouse');
    event = new MouseEvent(mouseEventType, {
      bubbles: true,
      cancelable: true,
      view: window,
      ...options,
    } as MouseEventInit);
  }
  element.dispatchEvent(event);
}

/**
 * Simulates drag and drop operations
 *
 * @param source - Element to drag from
 * @param target - Element to drop on
 * @param options - Drag options including coordinates
 *
 * @example
 * ```tsx
 * const draggable = getByTestId('draggable');
 * const dropzone = getByTestId('dropzone');
 * simulateDrag(draggable, dropzone, {
 *   startX: 0,
 *   startY: 0,
 *   endX: 100,
 *   endY: 100
 * });
 * ```
 */
export function simulateDrag(
  source: Element,
  target: Element,
  options: {
    startX?: number;
    startY?: number;
    endX?: number;
    endY?: number;
    dragStartEvents?: string[];
    dragEvents?: string[];
    dropEvents?: string[];
  } = {}
): void {
  const {
    startX = 0,
    startY = 0,
    endX = 100,
    endY = 100,
    dragStartEvents = ['pointerdown', 'dragstart'],
    dragEvents = ['pointermove', 'drag'],
    dropEvents = ['pointerup', 'dragend', 'drop'],
  } = options;

  // Drag start
  dragStartEvents.forEach((eventType) => {
    simulatePointerEvents(source, eventType, {
      clientX: startX,
      clientY: startY,
      bubbles: true,
    });
  });

  // Drag move
  dragEvents.forEach((eventType) => {
    simulatePointerEvents(source, eventType, {
      clientX: endX,
      clientY: endY,
      bubbles: true,
    });
  });

  // Drop
  dropEvents.forEach((eventType) => {
    const event = new Event(eventType, { bubbles: true, cancelable: true });
    Object.assign(event, { clientX: endX, clientY: endY });
    target.dispatchEvent(event);
  });
}

/**
 * Creates a mock selection range for testing editor operations
 *
 * @param startNode - Start node of selection
 * @param startOffset - Start offset within node
 * @param endNode - End node of selection
 * @param endOffset - End offset within node
 * @returns Range object representing selection
 *
 * @example
 * ```tsx
 * const textNode = document.createTextNode('Hello world');
 * const range = createMockRange(textNode, 0, textNode, 5);
 * ```
 */
export function createMockRange(
  startNode: Node,
  startOffset: number,
  endNode: Node,
  endOffset: number
): Range {
  const range = document.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  return range;
}

/**
 * Re-exports from @testing-library/react for convenience
 */
export * from '@testing-library/react';
