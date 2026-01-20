import { IconProps } from './IconProps'

const LinkIcon: React.FC<IconProps> = ({ size = 18, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 7H7a4 4 0 0 0 0 8h2" />
    <path d="M15 7h2a4 4 0 1 1 0 8h-2" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
)

export default LinkIcon
