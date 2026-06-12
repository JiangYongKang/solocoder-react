export default function TagList({ tags, activeTags, onTagClick }) {
  function handleClick(tagName) {
    onTagClick(tagName)
  }

  if (tags.length === 0) {
    return (
      <div className="tag-list">
        <h4>标签</h4>
        <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>暂无标签</p>
      </div>
    )
  }

  return (
    <div className="tag-list">
      <h4>标签</h4>
      {tags.map((tag) => (
        <span
          key={tag.name}
          className={`tag-item ${activeTags.includes(tag.name) ? 'active' : ''}`}
          onClick={() => handleClick(tag.name)}
          title={`点击筛选 ${tag.count} 篇笔记`}
        >
          {tag.name}
          <span className="tag-count">{tag.count}</span>
        </span>
      ))}
    </div>
  )
}
