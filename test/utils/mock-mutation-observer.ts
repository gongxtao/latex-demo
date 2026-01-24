/**
 * MutationObserver mock implementation for testing
 * Allows tests to use MutationObserver without browser implementation
 */

/**
 * Creates a mock node list helper
 */
function createMockNodeList(nodes: Node[] = []): NodeList {
  return {
    length: nodes.length,
    item: (index: number) => nodes[index] || null,
    forEach: (callback: (node: Node, index: number) => void) => {
      nodes.forEach(callback);
    },
  } as unknown as NodeList;
}

/**
 * Mock MutationRecord interface
 */
interface MockMutationRecord {
  type: MutationRecordType;
  target: Node;
  addedNodes: NodeList;
  removedNodes: NodeList;
  previousSibling: Node | null;
  nextSibling: Node | null;
  attributeName: string | null;
  attributeNamespace: string | null;
  oldValue: string | null;
}

/**
 * Mutation record type
 */
type MutationRecordType = 'attributes' | 'characterData' | 'childList';

/**
 * MutationObserverInit interface (partial)
 */
interface MockMutationObserverInit {
  attributes?: boolean;
  characterData?: boolean;
  childList?: boolean;
  subtree?: boolean;
  attributeOldValue?: boolean;
  characterDataOldValue?: boolean;
  attributeFilter?: string[];
}

/**
 * Mutation callback function type
 */
type MutationCallback = (mutations: MockMutationRecord[], observer: MockMutationObserver) => void;

/**
 * Mock MutationObserver class
 *
 * @example
 * ```tsx
 * const observer = new MockMutationObserver((mutations) => {
 *   mutations.forEach(mutation => {
 *     console.log('Mutation detected:', mutation.type);
 *   });
 * });
 *
 * const element = document.createElement('div');
 * observer.observe(element, { childList: true });
 *
 * element.appendChild(document.createElement('span'));
 * observer.trigger(); // Trigger callback with recorded mutations
 * ```
 */
class MockMutationObserver {
  private callback: MutationCallback;
  private observedNodes: Map<Node, MockMutationObserverInit>;
  private mutationRecords: MockMutationRecord[];

  /**
   * Creates a new MockMutationObserver instance
   *
   * @param callback - Function to call when mutations are detected
   */
  constructor(callback: MutationCallback) {
    this.callback = callback;
    this.observedNodes = new Map();
    this.mutationRecords = [];
  }

  /**
   * Observes a node for mutations
   *
   * @param target - Node to observe
   * @param options - Observation options
   */
  observe(target: Node, options?: MockMutationObserverInit): void {
    const defaultOptions: MockMutationObserverInit = {
      childList: false,
      attributes: false,
      characterData: false,
      subtree: false,
      attributeOldValue: false,
      characterDataOldValue: false,
      attributeFilter: undefined,
    };

    const mergedOptions = { ...defaultOptions, ...options };
    this.observedNodes.set(target, mergedOptions);

    // Setup mutation listeners for the target
    this.setupMutationListeners(target, mergedOptions);
  }

  /**
   * Disconnects and stops observing all nodes
   */
  disconnect(): void {
    // Remove all mutation listeners
    this.observedNodes.forEach((options, node) => {
      this.removeMutationListeners(node, options);
    });

    this.observedNodes.clear();
    this.mutationRecords = [];
  }

  /**
   * Takes and removes all pending mutation records
   *
   * @returns Array of mutation records
   */
  takeRecords(): MockMutationRecord[] {
    const records = [...this.mutationRecords];
    this.mutationRecords = [];
    return records;
  }

  /**
   * Triggers the callback with recorded mutations
   * This can be called in tests to simulate mutation events
   */
  trigger(): void {
    if (this.mutationRecords.length > 0) {
      const records = [...this.mutationRecords];
      this.mutationRecords = [];

      // In real MutationObserver, records are delivered asynchronously
      // For testing, we deliver them synchronously
      setTimeout(() => {
        this.callback(records, this);
      }, 0);
    }
  }

  /**
   * Sets up mutation listeners for a node
   */
  private setupMutationListeners(node: Node, options: MockMutationObserverInit): void {
    // Store original methods for wrapper
    const originalAppendChild = node.appendChild;
    const originalInsertBefore = node.insertBefore;
    const originalRemoveChild = node.removeChild;
    const originalReplaceChild = node.replaceChild;
    const originalSetAttribute = (node as Element).setAttribute;
    const originalRemoveAttribute = (node as Element).removeAttribute;

    // Wrap appendChild to detect childList mutations
    if (options.childList && node.appendChild) {
      node.appendChild = ((newChild: Node) => {
        const result = originalAppendChild.call(node, newChild);

        this.recordMutation({
          type: 'childList',
          target: node,
          addedNodes: createMockNodeList([newChild]),
          removedNodes: createMockNodeList([]),
          previousSibling: newChild.previousSibling,
          nextSibling: newChild.nextSibling,
          attributeName: null,
          attributeNamespace: null,
          oldValue: null,
        });

        return result;
      }) as typeof node.appendChild;
    }

    // Wrap insertBefore to detect childList mutations
    if (options.childList && node.insertBefore) {
      node.insertBefore = ((newChild: Node, referenceNode: Node | null) => {
        const result = originalInsertBefore.call(node, newChild, referenceNode);

        this.recordMutation({
          type: 'childList',
          target: node,
          addedNodes: createMockNodeList([newChild]),
          removedNodes: createMockNodeList([]),
          previousSibling: newChild.previousSibling,
          nextSibling: newChild.nextSibling,
          attributeName: null,
          attributeNamespace: null,
          oldValue: null,
        });

        return result;
      }) as typeof node.insertBefore;
    }

    // Wrap removeChild to detect childList mutations
    if (options.childList && node.removeChild) {
      node.removeChild = ((oldChild: Node) => {
        const result = originalRemoveChild.call(node, oldChild);

        this.recordMutation({
          type: 'childList',
          target: node,
          addedNodes: createMockNodeList([]),
          removedNodes: createMockNodeList([oldChild]),
          previousSibling: oldChild.previousSibling,
          nextSibling: oldChild.nextSibling,
          attributeName: null,
          attributeNamespace: null,
          oldValue: null,
        });

        return result;
      }) as typeof node.removeChild;
    }

    // Wrap replaceChild to detect childList mutations
    if (options.childList && node.replaceChild) {
      node.replaceChild = ((newChild: Node, oldChild: Node) => {
        const result = originalReplaceChild.call(node, newChild, oldChild);

        this.recordMutation({
          type: 'childList',
          target: node,
          addedNodes: createMockNodeList([newChild]),
          removedNodes: createMockNodeList([oldChild]),
          previousSibling: oldChild.previousSibling,
          nextSibling: oldChild.nextSibling,
          attributeName: null,
          attributeNamespace: null,
          oldValue: null,
        });

        return result;
      }) as any;
    }

    // Wrap setAttribute to detect attribute mutations
    if (options.attributes && (node as Element).setAttribute) {
      (node as Element).setAttribute = ((name: string, value: string) => {
        const oldValue = options.attributeOldValue ? (node as Element).getAttribute(name) : null;
        originalSetAttribute.call(node as Element, name, value);

        this.recordMutation({
          type: 'attributes',
          target: node,
          addedNodes: createMockNodeList([]),
          removedNodes: createMockNodeList([]),
          previousSibling: null,
          nextSibling: null,
          attributeName: name,
          attributeNamespace: null,
          oldValue,
        });
      }) as any;
    }

    // Wrap removeAttribute to detect attribute mutations
    if (options.attributes && (node as Element).removeAttribute) {
      (node as Element).removeAttribute = ((name: string) => {
        const oldValue = options.attributeOldValue ? (node as Element).getAttribute(name) : null;
        originalRemoveAttribute.call(node as Element, name);

        this.recordMutation({
          type: 'attributes',
          target: node,
          addedNodes: createMockNodeList([]),
          removedNodes: createMockNodeList([]),
          previousSibling: null,
          nextSibling: null,
          attributeName: name,
          attributeNamespace: null,
          oldValue,
        });
      }) as any;
    }
  }

  /**
   * Removes mutation listeners from a node
   * Note: This is a simplified implementation that doesn't fully restore original methods
   */
  private removeMutationListeners(_node: Node, _options: MockMutationObserverInit): void {
    // In a real implementation, we would restore the original methods here
    // For testing purposes, this is usually not necessary
  }

  /**
   * Records a mutation
   */
  private recordMutation(mutation: MockMutationRecord): void {
    this.mutationRecords.push(mutation);
  }

  /**
   * Simulates a mutation event for testing
   *
   * @param mutation - Mutation to simulate
   */
  simulateMutation(mutation: MockMutationRecord): void {
    this.recordMutation(mutation);
    this.trigger();
  }
}

/**
 * Sets up the MutationObserver mock globally
 * Should be called in test setup files
 *
 * @example
 * ```tsx
 * // In jest.setup.js or test setup file
 * setupMutationObserverMock();
 * ```
 */
export function setupMutationObserverMock(): void {
  // @ts-ignore - Assigning to global MutationObserver
  global.MutationObserver = MockMutationObserver;

  // Also add to window object for completeness
  // @ts-ignore
  window.MutationObserver = MockMutationObserver;
}

/**
 * Creates a spy for MutationObserver that can track calls
 *
 * @returns Object containing mock instance and spy functions
 *
 * @example
 * ```tsx
 * const { observer, mockObserve, mockDisconnect } = createMutationObserverSpy();
 * const obs = new observer(callback);
 * obs.observe(element);
 * expect(mockObserve).toHaveBeenCalledWith(element, expect.any(Object));
 * ```
 */
export function createMutationObserverSpy() {
  const mockObserve = jest.fn();
  const mockDisconnect = jest.fn();
  const mockTakeRecords = jest.fn<MockMutationRecord[], []>(() => []);

  class SpyMutationObserver extends MockMutationObserver {
    observe(target: Node, options?: MockMutationObserverInit): void {
      mockObserve(target, options);
      super.observe(target, options);
    }

    disconnect(): void {
      mockDisconnect();
      super.disconnect();
    }

    takeRecords(): MockMutationRecord[] {
      const records = super.takeRecords();
      mockTakeRecords.mockReturnValue(records);
      return records;
    }
  }

  return {
    observer: SpyMutationObserver,
    mockObserve,
    mockDisconnect,
    mockTakeRecords,
  };
}

/**
 * Creates a mock mutation record for testing
 *
 * @param mutation - Partial mutation record
 * @returns Complete mock mutation record
 *
 * @example
 * ```tsx
 * const mockRecord = createMockMutationRecord({
 *   type: 'childList',
 *   target: document.body
 * });
 * ```
 */
export function createMockMutationRecord(
  mutation: Partial<MockMutationRecord>
): MockMutationRecord {
  return {
    type: mutation.type || 'childList',
    target: mutation.target || document.createElement('div'),
    addedNodes: mutation.addedNodes || createMockNodeList([]),
    removedNodes: mutation.removedNodes || createMockNodeList([]),
    previousSibling: mutation.previousSibling || null,
    nextSibling: mutation.nextSibling || null,
    attributeName: mutation.attributeName || null,
    attributeNamespace: mutation.attributeNamespace || null,
    oldValue: mutation.oldValue || null,
  };
}

export {
  MockMutationObserver,
};
export type {
  MockMutationRecord,
  MockMutationObserverInit,
  MutationCallback,
  MutationRecordType,
};
