/**
 * Floating images fixtures for testing
 * Provides test data for floating image positioning and layout scenarios
 */

/**
 * Base floating image configuration interface
 */
export interface FloatingImageConfig {
  left: number;
  top: number;
  width: number;
  height: number;
  zIndex?: number;
  src?: string;
  alt?: string;
  rotation?: number;
}

/**
 * Complete floating image fixture interface
 */
export interface FloatingImagesFixture {
  name: string;
  description: string;
  images: FloatingImageConfig[];
  containerSize: {
    width: number;
    height: number;
  };
  expectedBehavior: string;
}

/**
 * Single floating image fixture
 * Tests basic floating image functionality
 */
export const single: FloatingImagesFixture = {
  name: 'single-floating-image',
  description: 'Single image floating in container',
  images: [
    {
      left: 100,
      top: 50,
      width: 200,
      height: 150,
      zIndex: 1,
      src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      alt: 'Single floating image',
      rotation: 0,
    },
  ],
  containerSize: {
    width: 800,
    height: 600,
  },
  expectedBehavior: 'Image should be positioned at (100, 50) with dimensions 200x150',
};

/**
 * Multiple floating images fixture
 * Tests multiple images with different positions and z-indexes
 */
export const multiple: FloatingImagesFixture = {
  name: 'multiple-floating-images',
  description: 'Multiple images with different positions and z-indexes',
  images: [
    {
      left: 50,
      top: 50,
      width: 150,
      height: 100,
      zIndex: 1,
      src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      alt: 'Image 1',
      rotation: 0,
    },
    {
      left: 250,
      top: 100,
      width: 180,
      height: 120,
      zIndex: 2,
      src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      alt: 'Image 2',
      rotation: 5,
    },
    {
      left: 100,
      top: 200,
      width: 200,
      height: 150,
      zIndex: 3,
      src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      alt: 'Image 3',
      rotation: -3,
    },
  ],
  containerSize: {
    width: 800,
    height: 600,
  },
  expectedBehavior: 'Images should stack according to z-index values with proper positioning',
};

/**
 * Zero height images fixture
 * Tests edge case of images with zero or minimal height
 */
export const zeroHeight: FloatingImagesFixture = {
  name: 'zero-height-images',
  description: 'Images with zero or minimal height for edge case testing',
  images: [
    {
      left: 50,
      top: 50,
      width: 200,
      height: 0,
      zIndex: 1,
      src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      alt: 'Zero height image',
      rotation: 0,
    },
    {
      left: 300,
      top: 50,
      width: 150,
      height: 1,
      zIndex: 2,
      src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      alt: 'Minimal height image',
      rotation: 0,
    },
  ],
  containerSize: {
    width: 800,
    height: 600,
  },
  expectedBehavior: 'Should handle zero and minimal height images gracefully',
};

/**
 * Overflowing images fixture
 * Tests images that extend beyond container boundaries
 */
export const overflowing: FloatingImagesFixture = {
  name: 'overflowing-images',
  description: 'Images that extend beyond container boundaries',
  images: [
    {
      left: -50,
      top: -50,
      width: 200,
      height: 200,
      zIndex: 1,
      src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      alt: 'Overflowing top-left',
      rotation: 0,
    },
    {
      left: 700,
      top: 500,
      width: 200,
      height: 200,
      zIndex: 2,
      src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      alt: 'Overflowing bottom-right',
      rotation: 0,
    },
  ],
  containerSize: {
    width: 800,
    height: 600,
  },
  expectedBehavior: 'Images should be partially visible when positioned outside container',
};

/**
 * Rotated images fixture
 * Tests images with various rotation angles
 */
export const rotated: FloatingImagesFixture = {
  name: 'rotated-images',
  description: 'Images with various rotation angles',
  images: [
    {
      left: 100,
      top: 100,
      width: 150,
      height: 150,
      zIndex: 1,
      src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      alt: '0 degrees',
      rotation: 0,
    },
    {
      left: 300,
      top: 100,
      width: 150,
      height: 150,
      zIndex: 2,
      src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      alt: '45 degrees',
      rotation: 45,
    },
    {
      left: 500,
      top: 100,
      width: 150,
      height: 150,
      zIndex: 3,
      src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      alt: '90 degrees',
      rotation: 90,
    },
    {
      left: 200,
      top: 300,
      width: 150,
      height: 150,
      zIndex: 4,
      src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      alt: '-30 degrees',
      rotation: -30,
    },
  ],
  containerSize: {
    width: 800,
    height: 600,
  },
  expectedBehavior: 'Images should render with correct rotation transformations',
};

/**
 * Overlapping images fixture
 * Tests images that overlap each other
 */
export const overlapping: FloatingImagesFixture = {
  name: 'overlapping-images',
  description: 'Images with overlapping positions',
  images: [
    {
      left: 100,
      top: 100,
      width: 200,
      height: 200,
      zIndex: 1,
      src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      alt: 'Bottom layer',
      rotation: 0,
    },
    {
      left: 150,
      top: 150,
      width: 200,
      height: 200,
      zIndex: 2,
      src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      alt: 'Middle layer',
      rotation: 0,
    },
    {
      left: 200,
      top: 200,
      width: 200,
      height: 200,
      zIndex: 3,
      src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      alt: 'Top layer',
      rotation: 0,
    },
  ],
  containerSize: {
    width: 800,
    height: 600,
  },
  expectedBehavior: 'Images should overlap according to z-index stacking order',
};

/**
 * Edge positioned images fixture
 * Tests images positioned at container edges
 */
export const edgePositioned: FloatingImagesFixture = {
  name: 'edge-positioned-images',
  description: 'Images positioned at container edges',
  images: [
    {
      left: 0,
      top: 0,
      width: 100,
      height: 100,
      zIndex: 1,
      src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      alt: 'Top-left corner',
      rotation: 0,
    },
    {
      left: 700,
      top: 0,
      width: 100,
      height: 100,
      zIndex: 2,
      src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      alt: 'Top-right corner',
      rotation: 0,
    },
    {
      left: 0,
      top: 500,
      width: 100,
      height: 100,
      zIndex: 3,
      src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      alt: 'Bottom-left corner',
      rotation: 0,
    },
    {
      left: 700,
      top: 500,
      width: 100,
      height: 100,
      zIndex: 4,
      src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      alt: 'Bottom-right corner',
      rotation: 0,
    },
  ],
  containerSize: {
    width: 800,
    height: 600,
  },
  expectedBehavior: 'Images should be positioned at container edges',
};

/**
 * Centered images fixture
 * Tests images positioned at container center
 */
export const centered: FloatingImagesFixture = {
  name: 'centered-images',
  description: 'Images positioned at container center',
  images: [
    {
      left: 300,
      top: 200,
      width: 200,
      height: 200,
      zIndex: 1,
      src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      alt: 'Centered image',
      rotation: 0,
    },
  ],
  containerSize: {
    width: 800,
    height: 600,
  },
  expectedBehavior: 'Image should be centered in container',
};

/**
 * All floating image fixtures indexed by name
 */
export const floatingImageFixtures = {
  single,
  multiple,
  zeroHeight,
  overflowing,
  rotated,
  overlapping,
  edgePositioned,
  centered,
};

/**
 * Gets a floating image fixture by name
 *
 * @param name - Name of the fixture
 * @returns Floating image fixture or undefined if not found
 */
export function getFixture(name: keyof typeof floatingImageFixtures): FloatingImagesFixture {
  return floatingImageFixtures[name];
}

/**
 * Gets all floating image fixture names
 *
 * @returns Array of fixture names
 */
export function getFixtureNames(): Array<keyof typeof floatingImageFixtures> {
  return Object.keys(floatingImageFixtures) as Array<keyof typeof floatingImageFixtures>;
}

/**
 * Creates a mock floating image element from configuration
 *
 * @param config - Floating image configuration
 * @returns HTMLDivElement configured as floating image
 */
export function createMockFloatingImage(config: FloatingImageConfig): HTMLDivElement {
  const wrapper = document.createElement('div');
  const img = document.createElement('img');

  wrapper.style.position = 'absolute';
  wrapper.style.left = `${config.left}px`;
  wrapper.style.top = `${config.top}px`;
  wrapper.style.width = `${config.width}px`;
  wrapper.style.height = `${config.height}px`;
  wrapper.style.zIndex = String(config.zIndex || 1);
  wrapper.className = 'floating-image';

  if (config.rotation) {
    wrapper.style.transform = `rotate(${config.rotation}deg)`;
  }

  img.src = config.src || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  img.alt = config.alt || 'Floating image';
  img.style.width = '100%';
  img.style.height = '100%';
  img.draggable = false;

  wrapper.appendChild(img);

  return wrapper;
}
