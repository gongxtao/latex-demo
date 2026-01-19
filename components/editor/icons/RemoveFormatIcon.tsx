import { IconProps } from './IconProps'

const RemoveFormatIcon: React.FC<IconProps> = ({ size = 18, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {/* Eraser body */}
    <path d="M7 21L2.7 16.7c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
    {/* Bottom line */}
    <path d="M22 21H7" />
    {/* Middle line */}
    <path d="M5 11l9 9" />
  </svg>
)

export default RemoveFormatIcon
