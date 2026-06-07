export default function Breadcrumb({ path, onNavigate }) {
  return (
    <nav className="fm-breadcrumb" aria-label="面包屑导航">
      {path.map((item, index) => (
        <span key={item.id} className="fm-breadcrumb-item">
          {index > 0 && <span className="fm-breadcrumb-separator">/</span>}
          {index === path.length - 1 ? (
            <span className="fm-breadcrumb-current">{item.name}</span>
          ) : (
            <button
              type="button"
              className="fm-breadcrumb-link"
              onClick={() => onNavigate(item.id)}
            >
              {item.name}
            </button>
          )}
        </span>
      ))}
    </nav>
  )
}
