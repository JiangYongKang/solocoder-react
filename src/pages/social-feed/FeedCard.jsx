import { useState } from 'react'
import { formatDateTime, renderContentWithTopics } from './utils'
import CommentSection from './CommentSection'

function ImageGrid({ images, onImageClick }) {
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

function RepostCard({ repostOf, onClick }) {
  if (!repostOf) return null
  const parts = renderContentWithTopics(repostOf.content)
  return (
    <div className="sf-repost-card" onClick={onClick}>
      <div className="sf-repost-header">
        <img src={repostOf.userAvatar} alt="" className="sf-avatar" style={{ width: 24, height: 24 }} />
        <p className="sf-user-name">{repostOf.userName}</p>
      </div>
      <div className="sf-repost-content">
        {parts.map((part) =>
          part.type === 'topic' ? (
            <span key={part.key} className="sf-topic">{part.text}</span>
          ) : (
            <span key={part.key}>{part.text}</span>
          )
        )}
      </div>
    </div>
  )
}

export default function FeedCard({
  post,
  isLiked,
  isFollowing,
  onLike,
  onFollow,
  onRepost,
  onAddComment,
  onOpenDetail,
  onImageClick,
  onOpenRepostDetail,
}) {
  const [showComments, setShowComments] = useState(false)

  const contentParts = renderContentWithTopics(post.content)

  return (
    <div className="sf-card">
      <div className="sf-card-header">
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

      <div className="sf-card-content" onClick={() => onOpenDetail?.(post)}>
        {contentParts.map((part) =>
          part.type === 'topic' ? (
            <span key={part.key} className="sf-topic">{part.text}</span>
          ) : (
            <span key={part.key}>{part.text}</span>
          )
        )}
      </div>

      {post.repostOf && (
        <RepostCard
          repostOf={post.repostOf}
          onClick={() => onOpenRepostDetail?.(post.repostOf.id)}
        />
      )}

      <ImageGrid images={post.images} onImageClick={onImageClick} />

      <div className="sf-card-actions">
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

        <button
          type="button"
          className="sf-action-btn"
          onClick={() => setShowComments((v) => !v)}
        >
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

      {showComments && (
        <CommentSection
          comments={post.comments}
          onAddComment={onAddComment}
          postId={post.id}
        />
      )}
    </div>
  )
}
