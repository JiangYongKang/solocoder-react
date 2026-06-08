import { useEffect } from 'react'
import { formatDateTime, renderContentWithTopics, getRepostChain } from './utils'
import CommentSection from './CommentSection'

function PostContent({ post }) {
  const contentParts = renderContentWithTopics(post.content)
  return (
    <div className="sf-card-content">
      {contentParts.map((part) =>
        part.type === 'topic' ? (
          <span key={part.key} className="sf-topic">{part.text}</span>
        ) : (
          <span key={part.key}>{part.text}</span>
        )
      )}
    </div>
  )
}

function PostImages({ images, onImageClick }) {
  if (!images || images.length === 0) return null
  const count = images.length
  const gridClass = `sf-card-images sf-img-${count}`
  return (
    <div className={gridClass}>
      {images.map((img, index) => (
        <div key={index} className="sf-card-img" onClick={() => onImageClick?.(index)}>
          <img src={img} alt="" />
        </div>
      ))}
    </div>
  )
}

export default function PostDetail({
  post,
  allPosts,
  onClose,
  onAddComment,
  onImageClick,
  onLike,
  onFollow,
  onRepost,
  isLiked,
  isFollowing,
}) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  if (!post) return null

  const repostChain = getRepostChain(allPosts, post.id)
  const chainPosts = repostChain.slice(1).reverse()

  return (
    <div className="sf-detail-modal" role="dialog" aria-modal="true">
      <div className="sf-detail-backdrop" onClick={onClose} />
      <div className="sf-detail-content" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="sf-detail-close" onClick={onClose} aria-label="关闭">
          ×
        </button>

        <div className="sf-detail-body">
          {chainPosts.length > 0 && (
            <div className="sf-repost-chain">
              {chainPosts.map((chainPost) => (
                <div
                  key={chainPost.id}
                  className="sf-repost-card"
                  style={{ cursor: 'default' }}
                >
                  <div className="sf-repost-header">
                    <img
                      src={chainPost.userAvatar}
                      alt=""
                      className="sf-avatar"
                      style={{ width: 24, height: 24 }}
                    />
                    <p className="sf-user-name">{chainPost.userName}</p>
                    <span className="sf-post-time" style={{ fontSize: 11 }}>
                      {formatDateTime(chainPost.createdAt)}
                    </span>
                  </div>
                  <PostContent post={chainPost} />
                  <PostImages images={chainPost.images} />
                </div>
              ))}
            </div>
          )}

          <div className="sf-card-header" style={{ marginBottom: 12 }}>
            <div className="sf-card-user">
              <img src={post.userAvatar} alt="" className="sf-avatar" />
              <div className="sf-user-info">
                <p className="sf-user-name">{post.userName}</p>
                <span className="sf-post-time">{formatDateTime(post.createdAt)}</span>
              </div>
            </div>
            <button
              type="button"
              className={`sf-follow-btn ${isFollowing ? 'sf-following' : ''}`}
              onClick={() => onFollow?.(post.userId)}
            >
              {isFollowing ? '已关注' : '+ 关注'}
            </button>
          </div>

          <PostContent post={post} />

          {post.repostOf && (
            <div className="sf-repost-card" style={{ cursor: 'default' }}>
              <div className="sf-repost-header">
                <img
                  src={post.repostOf.userAvatar}
                  alt=""
                  className="sf-avatar"
                  style={{ width: 24, height: 24 }}
                />
                <p className="sf-user-name">{post.repostOf.userName}</p>
              </div>
              <PostContent post={{ content: post.repostOf.content }} />
              <PostImages images={post.repostOf.images} onImageClick={onImageClick} />
            </div>
          )}

          <PostImages images={post.images} onImageClick={onImageClick} />

          <div className="sf-card-actions" style={{ marginTop: 12 }}>
            <button
              type="button"
              className={`sf-action-btn ${isLiked ? 'sf-liked' : ''}`}
              onClick={() => onLike?.(post.id)}
            >
              <svg viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span>{post.likeCount || 0}</span>
            </button>

            <button type="button" className="sf-action-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>{post.commentCount || 0}</span>
            </button>

            <button
              type="button"
              className="sf-action-btn"
              onClick={() => onRepost?.(post.id)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
              <span>{post.repostCount || 0}</span>
            </button>
          </div>

          <CommentSection
            comments={post.comments}
            onAddComment={onAddComment}
            postId={post.id}
          />
        </div>
      </div>
    </div>
  )
}
