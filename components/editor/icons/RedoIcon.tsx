import { IconProps } from './IconProps'

const RedoIcon: React.FC<IconProps> = ({ size = 18, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 4l5 5-5 5" />
    <path d="M4 20a8 8 0 0 1 11-11" />
  </svg>
)

export default RedoIcon
