export default function Breadcrumb({ path, onNavigate }) {
  if (!path || path.length === 0) return null

  return (
    <div className="kb-breadcrumb">
      {path.map((item, index) => (
        <span key={item.id} style={{ display: 'inline-flex', alignItems: 'center' }}>
          <span
            className={`kb-breadcrumb-item ${index === path.length - 1 ? 'current' : ''}`}
            onClick={() => index < path.length - 1 && onNavigate(item.id)}
          >
            {item.name}
          </span>
          {index < path.length - 1 && (
            <span className="kb-breadcrumb-sep">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          )}
        </span>
      ))}
    </div>
  )
}
