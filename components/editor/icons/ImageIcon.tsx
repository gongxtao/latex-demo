import { IconProps } from './IconProps'

const ImageIcon: React.FC<IconProps> = ({ size = 18, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="8" cy="10" r="2" />
    <path d="M21 19l-6-6-4 4-3-3-5 5" />
  </svg>
)

export default ImageIcon
