import { applyStyle } from '@/components/editor/utils/style';

describe('applyStyle', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('should wrap selected text in span with style', () => {
    container.innerHTML = 'Hello World';
    const textNode = container.firstChild as Text;
    
    // Select "World"
    const range = document.createRange();
    range.setStart(textNode, 6);
    range.setEnd(textNode, 11);
    
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    applyStyle(document, 'color', 'red');

    expect(container.innerHTML).toBe('Hello <span style="color: red;">World</span>');
  });

  test('should do nothing if selection is collapsed', () => {
    container.innerHTML = 'Hello World';
    const textNode = container.firstChild as Text;
    
    // Cursor at "World"
    const range = document.createRange();
    range.setStart(textNode, 6);
    range.setEnd(textNode, 6);
    
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    applyStyle(document, 'color', 'red');

    expect(container.innerHTML).toBe('Hello World');
  });
});
