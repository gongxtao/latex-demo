/**
 * Test utilities and fixtures index
 * Central export point for all testing utilities
 */

// Export testing utilities
export * from './utils/test-utils';
export * from './utils/mock-dom';
export * from './utils/mock-resize-observer';
export * from './utils/mock-mutation-observer';

// Export fixtures with explicit re-exports to avoid conflicts
export {
  simple,
  withImage,
  withTable,
  withFormatting,
  fullResume,
  empty as emptyEditorContent,
  withMultipleImages,
  withInlineFormatting,
  withNestedLists,
  withCodeBlock,
  contentFixtures,
  getContentFixture,
  getFixtureNames as getEditorContentFixtureNames,
} from './fixtures/editor-content';

export {
  single as singleFloatingImage,
  multiple as multipleFloatingImages,
  zeroHeight as zeroHeightImages,
  overflowing as overflowingImages,
  rotated as rotatedImages,
  overlapping as overlappingImages,
  edgePositioned as edgePositionedImages,
  centered as centeredImage,
  floatingImageFixtures,
  getFixture,
  getFixtureNames as getFloatingImageFixtureNames,
  createMockFloatingImage,
} from './fixtures/floating-images';

export {
  simple2x2,
  simple3x3,
  withMergedCells,
  withColspanRowspan,
  resumeStyle,
  empty as emptyTable,
  singleCell,
  wide,
  tall,
  withNestedContent,
  tableFixtures,
  getFixture as getTableFixture,
  getFixtureNames as getTableFixtureNames,
  createMockTableFromFixture,
  createMockTableCell,
  createMockTableRow,
} from './fixtures/table-data';
