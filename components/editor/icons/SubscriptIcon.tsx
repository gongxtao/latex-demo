import { IconProps } from './IconProps'

const SubscriptIcon: React.FC<IconProps> = ({ size = 18, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {/* X shape */}
    <path d="M5 7l8 10M5 17l8-10" />
    {/* Small 2 */}
    <path d="M19 16c0-1.1-.9-2-2-2s-2 .9-2 2c0 1.1.9 2 2 2 0 1.1-.9 2-2 2h4" transform="scale(0.8) translate(5, 5)" strokeWidth="2.5" />
  </svg>
)

export default SubscriptIcon
