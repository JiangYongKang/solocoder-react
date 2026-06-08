import { useState } from 'react'
import CommentItem from './CommentItem'

export default function CommentSection({ comments, onAddComment, postId }) {
  const [inputValue, setInputValue] = useState('')

  const handleSubmit = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    onAddComment?.(postId, trimmed, null)
    setInputValue('')
  }

  const handleReply = (parentCommentId, content) => {
    onAddComment?.(postId, content, parentCommentId)
  }

  return (
    <div className="sf-comments-section">
      {comments && comments.length > 0 && (
        <div className="sf-comments-list">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              depth={1}
              onReply={handleReply}
            />
          ))}
        </div>
      )}

      <div className="sf-comment-input">
        <textarea
          placeholder="说点什么..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          rows={2}
        />
        <button
          type="button"
          className="sf-comment-send"
          onClick={handleSubmit}
          disabled={!inputValue.trim()}
        >
          发送
        </button>
      </div>
    </div>
  )
}
