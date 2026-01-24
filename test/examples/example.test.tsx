/**
 * Example test file demonstrating the use of test infrastructure
 * This file shows how to use the testing utilities, mocks, and fixtures
 */

import React from 'react';
import {
  render,
  screen,
  renderWithProviders,
  createMockIframe,
  cleanupMockIframe,
  waitForRAF,
  simulatePointerEvents,
  simulateDrag,
  createMockImage,
  createMockTable,
  createMockSelection,
  setupResizeObserverMock,
  setupMutationObserverMock,
} from '../index';
import { getContentFixture } from '../fixtures/editor-content';
import { createMockFloatingImage } from '../fixtures/floating-images';
import { createMockTableFromFixture } from '../fixtures/table-data';

// Setup mocks for all tests in this file
beforeAll(() => {
  setupResizeObserverMock();
  setupMutationObserverMock();
});

describe('Test Infrastructure Examples', () => {
  describe('Basic Rendering', () => {
    it('should render a simple component', () => {
      const TestComponent = () => <div>Hello World</div>;

      render(<TestComponent />);

      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });
  });

  describe('Mock DOM Elements', () => {
    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('should create and use mock image', () => {
      const mockImg = createMockImage({
        src: 'data:image/png;base64,test',
        alt: 'Test Image',
        width: 100,
        height: 100,
      });

      document.body.appendChild(mockImg);

      const img = document.querySelector('img');
      expect(img).toBeInTheDocument();
      expect(img?.alt).toBe('Test Image');
      expect(img?.width).toBe(100);
    });

    it('should create and use mock table', () => {
      const mockTable = createMockTable({
        rows: 2,
        cols: 2,
        headers: true,
      });

      document.body.appendChild(mockTable);

      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();

      const headers = table?.querySelectorAll('th');
      expect(headers?.length).toBe(2);
    });

    it('should create mock selection', () => {
      const textNode = document.createTextNode('Hello World');
      const selection = createMockSelection({
        anchorNode: textNode,
        anchorOffset: 0,
        focusNode: textNode,
        focusOffset: 5,
        type: 'Range',
      });

      expect(selection.toString()).toBe('Hello');
      expect(selection.isCollapsed).toBe(false);
    });
  });

  describe('Mock Iframe', () => {
    it('should create and use mock iframe', () => {
      const iframe = createMockIframe('<p>Test Content</p>', {
        id: 'test-iframe',
        width: '100%',
        height: '400px',
      });

      document.body.appendChild(iframe);

      expect(iframe.id).toBe('test-iframe');
      expect(iframe.contentDocument?.querySelector('p')?.textContent).toBe('Test Content');

      cleanupMockIframe(iframe);
    });
  });

  describe('Content Fixtures', () => {
    it('should use editor content fixtures', () => {
      const fixture = getContentFixture('simple');

      expect(fixture.html).toContain('<p>');
      expect(fixture.text).toBeTruthy();
      expect(fixture.description).toBe('Simple plain text paragraph');
    });

    it('should use fixture with image', () => {
      const fixture = getContentFixture('withImage');

      expect(fixture.html).toContain('<img');
      expect(fixture.imageCount).toBe(1);
    });

    it('should use fixture with table', () => {
      const fixture = getContentFixture('withTable');

      expect(fixture.html).toContain('<table');
      expect(fixture.tableCount).toBe(1);
    });
  });

  describe('Table Fixtures', () => {
    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('should create table from fixture', () => {
      const table = createMockTableFromFixture({
        name: 'test-table',
        description: 'Test table',
        rows: [
          {
            isHeader: true,
            cells: [
              { content: 'Header 1', isHeader: true },
              { content: 'Header 2', isHeader: true },
            ],
          },
          {
            cells: [
              { content: 'Cell 1' },
              { content: 'Cell 2' },
            ],
          },
        ],
        expectedBehavior: 'Render table',
        rowCount: 2,
        colCount: 2,
      });

      document.body.appendChild(table);

      const headers = table.querySelectorAll('th');
      expect(headers.length).toBe(2);

      const cells = table.querySelectorAll('td');
      expect(cells.length).toBe(2);
    });
  });

  describe('Floating Images', () => {
    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('should create floating image from config', () => {
      const container = document.createElement('div');
      container.style.width = '800px';
      container.style.height = '600px';

      const floatingImg = createMockFloatingImage({
        left: 100,
        top: 50,
        width: 200,
        height: 150,
        zIndex: 1,
      });

      container.appendChild(floatingImg);
      document.body.appendChild(container);

      expect(floatingImg.style.left).toBe('100px');
      expect(floatingImg.style.top).toBe('50px');
      expect(floatingImg.style.zIndex).toBe('1');
    });
  });

  describe('Event Simulation', () => {
    let element: HTMLDivElement;

    beforeEach(() => {
      element = document.createElement('div');
      element.id = 'test-element';
      document.body.appendChild(element);
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('should simulate pointer events', () => {
      const handleClick = jest.fn();
      element.addEventListener('click', handleClick);

      simulatePointerEvents(element, 'click', {
        clientX: 100,
        clientY: 100,
      });

      expect(handleClick).toHaveBeenCalled();
    });

    it('should simulate drag and drop', () => {
      const source = document.createElement('div');
      source.id = 'source';
      document.body.appendChild(source);

      const target = document.createElement('div');
      target.id = 'target';
      document.body.appendChild(target);

      const handleDrop = jest.fn();
      target.addEventListener('drop', handleDrop);

      simulateDrag(source, target, {
        startX: 0,
        startY: 0,
        endX: 100,
        endY: 100,
      });

      expect(handleDrop).toHaveBeenCalled();
    });
  });

  describe('Async Operations', () => {
    it('should wait for RAF', async () => {
      let rafCount = 0;

      const rafCallback = () => {
        rafCount++;
      };

      requestAnimationFrame(rafCallback);
      await waitForRAF();

      expect(rafCount).toBeGreaterThan(0);
    });
  });

  describe('ResizeObserver Mock', () => {
    it('should use ResizeObserver mock', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      const callback = jest.fn();
      const observer = new ResizeObserver(callback);

      observer.observe(element);

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('MutationObserver Mock', () => {
    it('should use MutationObserver mock', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      const callback = jest.fn();
      const observer = new MutationObserver(callback);

      observer.observe(element, { childList: true });

      element.appendChild(document.createElement('span'));

      observer.trigger();

      // Wait for the setTimeout callback in trigger()
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('Custom Providers', () => {
    it('should render with custom providers', () => {
      const ThemeProvider = ({ children }: { children: React.ReactNode }) => (
        <div className="theme-provider">{children}</div>
      );

      const TestComponent = () => <div>Themed Content</div>;

      const { container } = renderWithProviders(<TestComponent />, {
        providers: [{ provider: ThemeProvider }],
      });

      expect(container.querySelector('.theme-provider')).toBeInTheDocument();
      expect(screen.getByText('Themed Content')).toBeInTheDocument();
    });
  });

  describe('Full Resume Fixture', () => {
    it('should use full resume fixture', () => {
      const fixture = getContentFixture('fullResume');

      expect(fixture.html).toContain('John Doe');
      expect(fixture.html).toContain('Professional Summary');
      expect(fixture.html).toContain('Work Experience');
      expect(fixture.html).toContain('Education');
      expect(fixture.sectionCount).toBe(6);
      expect(fixture.hasContactInfo).toBe(true);
    });
  });
});

describe('Integration Example', () => {
  it('should demonstrate a complex test scenario', async () => {
    // Create a mock editor environment
    const iframe = createMockIframe(getContentFixture('fullResume').html);

    document.body.appendChild(iframe);

    // Wait for content to load
    await waitForRAF();

    // Verify content loaded
    const doc = iframe.contentDocument;
    expect(doc?.querySelector('h1')?.textContent).toBe('John Doe');

    // Simulate selection
    const heading = doc?.querySelector('h1');
    if (heading) {
      const range = doc?.createRange();
      const selection = createMockSelection({
        anchorNode: heading.firstChild || heading,
        anchorOffset: 0,
        focusNode: heading.firstChild || heading,
        focusOffset: 5,
        type: 'Range',
      });

      expect(selection.toString()).toBe('John ');
    }

    // Cleanup
    cleanupMockIframe(iframe);
  });
});
