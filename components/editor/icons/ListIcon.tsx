import { IconProps } from './IconProps'

const ListIcon: React.FC<IconProps & { type: 'unordered' | 'ordered' }> = ({ type, size = 18, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {type === 'unordered' ? (
      <>
        <circle cx="5" cy="7" r="1.6" fill="currentColor" stroke="none" />
        <line x1="9" y1="7" x2="21" y2="7" />
        <circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none" />
        <line x1="9" y1="12" x2="21" y2="12" />
        <circle cx="5" cy="17" r="1.6" fill="currentColor" stroke="none" />
        <line x1="9" y1="17" x2="21" y2="17" />
      </>
    ) : (
      <>
        <text x="3" y="8.5" fontSize="7" fontFamily="Arial, sans-serif" fill="currentColor">1</text>
        <line x1="9" y1="7" x2="21" y2="7" />
        <text x="3" y="13.5" fontSize="7" fontFamily="Arial, sans-serif" fill="currentColor">2</text>
        <line x1="9" y1="12" x2="21" y2="12" />
        <text x="3" y="18.5" fontSize="7" fontFamily="Arial, sans-serif" fill="currentColor">3</text>
        <line x1="9" y1="17" x2="21" y2="17" />
      </>
    )}
  </svg>
)

export default ListIcon
