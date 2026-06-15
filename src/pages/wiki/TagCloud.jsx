import { getAllTagsInSpace, getTagCloudSize } from './wikiUtils.js'

export default function TagCloud({
  data,
  spaceId,
  selectedTag,
  onSelectTag,
}) {
  const tags = getAllTagsInSpace(data, spaceId)
  const maxCount = tags.length > 0 ? Math.max(...tags.map((t) => t.count)) : 0

  return (
    <div className="wiki-tag-cloud">
      <div className="wiki-tag-cloud-title">标签云</div>
      <div className="wiki-tag-cloud-items">
        {tags.length === 0 ? (
          <span style={{ color: '#9ca3af', fontSize: '12px' }}>暂无标签</span>
        ) : (
          tags.map((tag) => {
            const size = getTagCloudSize(tag.count, maxCount)
            return (
              <button
                key={tag.name}
                className={`wiki-tag ${selectedTag === tag.name ? 'active' : ''}`}
                style={{ fontSize: `${size}em` }}
                onClick={() =>
                  onSelectTag?.(selectedTag === tag.name ? null : tag.name)
                }
              >
                {tag.name}
                <span className="wiki-tag-close" style={{ opacity: 0.6 }}>
                  {tag.count}
                </span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
