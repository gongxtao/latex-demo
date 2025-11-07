import { IconProps } from './IconProps'

const LinkIcon: React.FC<IconProps> = ({ size = 18, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {/* Chain link icon - two interlocked rings */}
    <circle cx="7" cy="12" r="3" />
    <circle cx="17" cy="12" r="3" />
    <line x1="7" y1="12" x2="17" y2="12" />
  </svg>
)

export default LinkIcon
