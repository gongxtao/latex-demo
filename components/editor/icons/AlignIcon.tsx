import { IconProps } from './IconProps'

const AlignIcon: React.FC<IconProps & { type: 'left' | 'center' | 'right' | 'justify' }> = ({ type, size = 18, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="3" y1="6" x2="21" y2="6" />
    {type === 'left' && <line x1="3" y1="12" x2="14" y2="12" />}
    {type === 'center' && <line x1="5" y1="12" x2="19" y2="12" />}
    {type === 'right' && <line x1="10" y1="12" x2="21" y2="12" />}
    {type === 'justify' && <line x1="3" y1="12" x2="21" y2="12" />}
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

export default AlignIcon
