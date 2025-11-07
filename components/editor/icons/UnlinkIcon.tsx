import { IconProps } from './IconProps'

const UnlinkIcon: React.FC<IconProps> = ({ size = 18, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 15l6-6" />
    <path d="M10 13a5 5 0 0 1 7 0l2 2" />
    <path d="M14 11a5 5 0 0 1-7 0l-2-2" />
  </svg>
)

export default UnlinkIcon
