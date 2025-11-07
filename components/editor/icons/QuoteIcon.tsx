import { IconProps } from './IconProps'

const QuoteIcon: React.FC<IconProps> = ({ size = 18, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M7 10h5v5H7z" />
    <path d="M16 10h5v5h-5z" />
  </svg>
)

export default QuoteIcon
