import { ANIMATION_TYPES, formatDate } from './constants.js'
import { buildHTML, generateFullCSS } from './loadingAnimationCore.js'

function SavedItemThumbnail({ item }) {
  const html = buildHTML(item.animationType, item.config, 'thumb')
  const css = generateFullCSS(item.animationType, item.config, 'thumb')

  return (
    <div className="saved-thumb">
      <style>{css}</style>
      <div className="thumb-wrapper" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}

export default function SavedAnimations({ savedAnimations, onLoad, onDelete, maxCount }) {
  return (
    <div className="saved-animations">
      <div className="saved-header">
        <h3 className="panel-title">我的动画</h3>
        <span className="saved-count">
          {savedAnimations.length} / {maxCount}
        </span>
      </div>

      {savedAnimations.length === 0 ? (
        <div className="saved-empty">
          <p>暂无保存的动画</p>
          <p className="saved-hint">配置好动画后点击「保存」按钮添加</p>
        </div>
      ) : (
        <div className="saved-list">
          {savedAnimations.map((item) => {
            const animType = ANIMATION_TYPES[item.animationType]
            return (
              <div key={item.id} className="saved-item">
                <SavedItemThumbnail item={item} />
                <div className="saved-info">
                  <div className="saved-name">
                    {item.name || animType?.name || '未命名动画'}
                  </div>
                  <div className="saved-type">
                    {animType?.name || item.animationType}
                  </div>
                  <div className="saved-date">
                    {formatDate(item.updatedAt || item.createdAt)}
                  </div>
                </div>
                <div className="saved-actions">
                  <button
                    className="saved-btn load-btn"
                    onClick={() => onLoad(item)}
                    title="加载"
                  >
                    加载
                  </button>
                  <button
                    className="saved-btn delete-btn"
                    onClick={() => onDelete(item.id)}
                    title="删除"
                  >
                    删除
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
