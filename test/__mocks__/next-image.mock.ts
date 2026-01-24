/**
 * Next.js Image component mock for testing
 * This mock allows testing Next.js Image components without actual image loading
 */

import * as React from 'react';

/**
 * Mock Image component props interface
 */
interface MockImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  quality?: number;
  fill?: boolean;
  sizes?: string;
  srcSet?: string;
  loading?: 'lazy' | 'eager';
}

/**
 * Mock Next.js Image component
 * Renders a standard img element with Next.js Image props
 */
const MockNextImage = React.forwardRef<HTMLImageElement, MockImageProps>(
  ({ src, alt, width, height, priority, placeholder, className, ...props }, ref) => {
    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        {...props}
      />
    );
  }
);

MockNextImage.displayName = 'MockNextImage';

/**
 * Export mock as default and named export
 */
export default MockNextImage;
export { MockNextImage as Image };
