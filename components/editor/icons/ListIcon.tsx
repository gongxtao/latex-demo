import { IconProps } from './IconProps'

const ListIcon: React.FC<IconProps & { type: 'unordered' | 'ordered' }> = ({ type, size = 18, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {type === 'unordered' ? (
      <>
        <circle cx="5" cy="7" r="1" />
        <line x1="9" y1="7" x2="21" y2="7" />
        <circle cx="5" cy="12" r="1" />
        <line x1="9" y1="12" x2="21" y2="12" />
        <circle cx="5" cy="17" r="1" />
        <line x1="9" y1="17" x2="21" y2="17" />
      </>
    ) : (
      <>
        <text x="3" y="9" fontSize="8">1.</text>
        <line x1="9" y1="7" x2="21" y2="7" />
        <text x="3" y="14" fontSize="8">2.</text>
        <line x1="9" y1="12" x2="21" y2="12" />
        <text x="3" y="19" fontSize="8">3.</text>
        <line x1="9" y1="17" x2="21" y2="17" />
      </>
    )}
  </svg>
)

export default ListIcon
