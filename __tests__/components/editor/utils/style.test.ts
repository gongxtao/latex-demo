import { applyStyle } from '@/components/editor/utils/style';

describe('applyStyle', () => {
  test('should not throw error with null selection', () => {
    // Test that the function handles null/undefined selection gracefully
    expect(() => {
      applyStyle(document, 'color', 'red');
    }).not.toThrow();
  });

  test('should not throw error with empty selection', () => {
    // Test with mock selection that has no ranges
    const mockSelection = {
      rangeCount: 0,
      getRangeAt: jest.fn(),
      isCollapsed: true,
      removeAllRanges: jest.fn(),
      addRange: jest.fn(),
    } as any;

    jest.spyOn(document, 'getSelection').mockReturnValue(mockSelection);

    expect(() => {
      applyStyle(document, 'color', 'red');
    }).not.toThrow();

    jest.restoreAllMocks();
  });

  // NOTE: Full DOM manipulation tests require jsdom's Range API to work correctly,
  // which is not fully reliable. The function is covered by integration tests
  // in EditablePreview and useEditorCommands test suites.
});
