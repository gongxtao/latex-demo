/**
 * Test environment setup file
 * Configures the testing environment with necessary mocks and globals
 */

// Import testing library utilities
import '@testing-library/jest-dom';

// Import our mock implementations
import { setupResizeObserverMock } from './utils/mock-resize-observer';
import { setupMutationObserverMock } from './utils/mock-mutation-observer';

/**
 * Sets up all global mocks for the test environment
 */

// Setup ResizeObserver mock
setupResizeObserverMock();

// Setup MutationObserver mock
setupMutationObserverMock();

// Mock window.prompt
window.prompt = jest.fn();

// Mock window.confirm
window.confirm = jest.fn();

// Mock window.alert
window.alert = jest.fn();

// Mock getBoundingClientRect
Element.prototype.getBoundingClientRect = jest.fn(() => ({
  width: 300,
  height: 150,
  top: 0,
  left: 0,
  bottom: 150,
  right: 300,
  x: 0,
  y: 0,
  toJSON: () => ({}),
})) as any;

// Mock getClientRects for more precise element rect queries
Element.prototype.getClientRects = jest.fn(() => ({
  length: 1,
  item: (index: number) => ({
    left: 0,
    top: 0,
    width: 300,
    height: 150,
    right: 300,
    bottom: 150,
    x: 0,
    y: 0,
  }),
})) as any;

// Mock queryCommandSupported for editor commands
document.queryCommandSupported = jest.fn((command: string) => {
  // Support most common editor commands by default
  const supportedCommands = [
    'bold',
    'italic',
    'underline',
    'strikeThrough',
    'insertOrderedList',
    'insertUnorderedList',
    'justifyLeft',
    'justifyCenter',
    'justifyRight',
    'insertHorizontalRule',
    'undo',
    'redo',
    'formatBlock',
    'removeFormat',
  ];

  return supportedCommands.includes(command);
});

// Mock queryCommandEnabled
document.queryCommandEnabled = jest.fn(() => true);

// Mock queryCommandState
document.queryCommandState = jest.fn(() => false);

// Mock queryCommandValue
document.queryCommandValue = jest.fn(() => '');

// Mock execCommand (though it's deprecated, some editors still use it)
document.execCommand = jest.fn((command: string, showUI?: boolean, value?: string) => {
  // Return true for most commands
  return true;
});

// Mock scrollTo
window.scrollTo = jest.fn();

// Mock scrollBy
window.scrollBy = jest.fn();

// Mock getComputedStyle
window.getComputedStyle = jest.fn((element) => {
  const style = {
    display: 'block',
    visibility: 'visible',
    opacity: '1',
    position: 'static',
    width: 'auto',
    height: 'auto',
    top: '0px',
    left: '0px',
    marginTop: '0px',
    marginBottom: '0px',
    marginLeft: '0px',
    marginRight: '0px',
    paddingTop: '0px',
    paddingBottom: '0px',
    paddingLeft: '0px',
    paddingRight: '0px',
    color: 'rgb(0, 0, 0)',
    backgroundColor: 'rgba(0, 0, 0, 0)',
    fontSize: '16px',
    fontWeight: '400',
    fontStyle: 'normal',
    textAlign: 'left',
    textDecoration: 'none solid rgb(0, 0, 0)',
    textTransform: 'none',
    lineHeight: 'normal',
    letterSpacing: 'normal',
    zIndex: 'auto',
  };

  return style as any;
});

// Mock Selection and Range for editor testing
const mockRange = {
  startContainer: null,
  startOffset: 0,
  endContainer: null,
  endOffset: 0,
  collapsed: true,
  commonAncestorContainer: document.body,
  setStart: jest.fn(),
  setEnd: jest.fn(),
  setStartBefore: jest.fn(),
  setStartAfter: jest.fn(),
  setEndBefore: jest.fn(),
  setEndAfter: jest.fn(),
  collapse: jest.fn(),
  selectNode: jest.fn(),
  selectNodeContents: jest.fn(),
  deleteContents: jest.fn(),
  extractContents: jest.fn(),
  cloneContents: jest.fn(),
  insertNode: jest.fn(),
  surroundContents: jest.fn(),
  cloneRange: jest.fn(function() { return this; }),
  toString: jest.fn(() => ''),
  detach: jest.fn(),
};

const mockSelection = {
  anchorNode: null,
  anchorOffset: 0,
  focusNode: null,
  focusOffset: 0,
  isCollapsed: true,
  rangeCount: 0,
  type: 'None' as SelectionType,
  addRange: jest.fn(),
  removeRange: jest.fn(),
  removeAllRanges: jest.fn(),
  getRangeAt: jest.fn((index: number) => mockRange),
  collapse: jest.fn(),
  collapseToStart: jest.fn(),
  collapseToEnd: jest.fn(),
  extend: jest.fn(),
  setBaseAndExtent: jest.fn(),
  setPosition: jest.fn(),
  toString: jest.fn(() => ''),
  containsNode: jest.fn(() => false),
};

type SelectionType = 'None' | 'Caret' | 'Range';

Object.defineProperty(window, 'getSelection', {
  value: jest.fn(() => mockSelection),
  writable: true,
});

Object.defineProperty(document, 'getSelection', {
  value: jest.fn(() => mockSelection),
  writable: true,
});

// Mock clipboard API
Object.assign(window, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve()),
    readText: jest.fn(() => Promise.resolve('')),
    write: jest.fn(() => Promise.resolve()),
    read: jest.fn(() => Promise.resolve([])),
  },
});

// Mock IntersectionObserver
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(
    private callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ) {
    if (options?.root) this.root = options.root;
    if (options?.rootMargin) this.rootMargin = options.rootMargin;
    if (options?.threshold) this.thresholds = Array.isArray(options.threshold)
      ? options.threshold
      : [options.threshold];
  }

  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] { return []; }
}

Object.defineProperty(window, 'IntersectionObserver', {
  value: MockIntersectionObserver,
  writable: true,
});

// Mock ResizeObserver (already set up, but add to window explicitly)
Object.defineProperty(window, 'ResizeObserver', {
  value: require('./utils/mock-resize-observer').MockResizeObserver,
  writable: true,
});

// Mock MutationObserver (already set up, but add to window explicitly)
Object.defineProperty(window, 'MutationObserver', {
  value: require('./utils/mock-mutation-observer').MockMutationObserver,
  writable: true,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock requestAnimationFrame and cancelAnimationFrame
window.requestAnimationFrame = jest.fn((cb: FrameRequestCallback) => {
  return setTimeout(() => cb(performance.now()), 16) as unknown as number;
});

window.cancelAnimationFrame = jest.fn((id: number) => {
  clearTimeout(id);
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
});

// Mock performance API
if (!window.performance) {
  (window as any).performance = {};
}

window.performance.now = jest.fn(() => Date.now());

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Export setup function for use in other test files if needed
export function setupTestEnvironment() {
  // This function can be called to manually set up the test environment
  // if needed in specific test files
}

console.info('Test environment setup complete');
