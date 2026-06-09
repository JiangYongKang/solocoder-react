import { useState } from 'react'
import { formatDateTime } from './utils'
import { MAX_COMMENT_DEPTH } from './constants'

export default function CommentItem({ comment, depth = 1, onReply }) {
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [replyContent, setReplyContent] = useState('')

  const handleSubmitReply = () => {
    const trimmed = replyContent.trim()
    if (!trimmed) return
    onReply?.(comment.id, trimmed)
    setReplyContent('')
    setShowReplyInput(false)
  }

  return (
    <div className="sf-comment-item">
      <img src={comment.userAvatar} alt="" className="sf-avatar" style={{ width: 32, height: 32 }} />
      <div className="sf-comment-body">
        <div className="sf-comment-header">
          <span className="sf-comment-name">{comment.userName}</span>
          <span className="sf-comment-time">{formatDateTime(comment.createdAt)}</span>
        </div>
        <div className="sf-comment-content">{comment.content}</div>
        {depth < MAX_COMMENT_DEPTH && (
          <div className="sf-comment-actions">
            <button
              type="button"
              className="sf-reply-btn"
              onClick={() => setShowReplyInput((v) => !v)}
            >
              回复
            </button>
          </div>
        )}

        {showReplyInput && (
          <div className="sf-comment-input">
            <textarea
              placeholder={`回复 ${comment.userName}...`}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={2}
              style={{ minHeight: 36 }}
            />
            <button
              type="button"
              className="sf-comment-send"
              onClick={handleSubmitReply}
              disabled={!replyContent.trim()}
            >
              回复
            </button>
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="sf-comment-replies">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                depth={depth + 1}
                onReply={onReply}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
