import { renderHook, act } from '@testing-library/react';
import useHistory from '@/components/editor/hooks/useHistory';

describe('useHistory', () => {
  test('should initialize with content', () => {
    const { result } = renderHook(() => useHistory({ html: 'initial', floatingImages: [] }));
    expect(result.current.current.html).toBe('initial');
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  test('should push new state', () => {
    const { result } = renderHook(() => useHistory({ html: 'initial', floatingImages: [] }));

    act(() => {
      result.current.push({ html: 'state 1', floatingImages: [] });
    });

    expect(result.current.current.html).toBe('state 1');
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  test('should undo state', () => {
    const { result } = renderHook(() => useHistory({ html: 'initial', floatingImages: [] }));

    act(() => {
      result.current.push({ html: 'state 1', floatingImages: [] });
    });

    act(() => {
      const undoResult = result.current.undo();
      expect(undoResult?.html).toBe('initial');
    });

    expect(result.current.current.html).toBe('initial');
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  test('should redo state', () => {
    const { result } = renderHook(() => useHistory({ html: 'initial', floatingImages: [] }));

    act(() => {
      result.current.push({ html: 'state 1', floatingImages: [] });
    });

    act(() => {
      result.current.undo();
    });

    act(() => {
      const redoResult = result.current.redo();
      expect(redoResult?.html).toBe('state 1');
    });

    expect(result.current.current.html).toBe('state 1');
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  test('should limit history size', () => {
    const { result } = renderHook(() => useHistory({ html: '0', floatingImages: [] }));

    // Push 60 states
    for (let i = 1; i <= 60; i++) {
      act(() => {
        result.current.push({ html: String(i), floatingImages: [] });
      });
    }

    expect(result.current.current.html).toBe('60');
    
    // Undo 50 times should reach limit (actually 50 items in past stack)
    // The implementation keeps 50 items in past.
    // So we can undo 50 times.
    
    for (let i = 0; i < 50; i++) {
        expect(result.current.canUndo).toBe(true);
        act(() => {
            result.current.undo();
        });
    }
    
    // Should be at state 10 (since 0..9 were dropped)
    expect(result.current.current.html).toBe('10');
    expect(result.current.canUndo).toBe(false); // Stack exhausted
  });
});
