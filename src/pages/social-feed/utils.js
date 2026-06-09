import {
  POSTS_STORAGE_KEY,
  FOLLOWS_STORAGE_KEY,
  LIKES_STORAGE_KEY,
  PAGE_SIZE,
  MAX_IMAGES,
  MAX_TEXT_LENGTH,
  MAX_COMMENT_DEPTH,
  SORT_OPTIONS,
  FEED_TABS,
  CURRENT_USER,
  DEFAULT_AVATAR,
} from './constants'
import { createMockPosts, createMockFollows, createMockLikes, extractTopics } from './mockData'

export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function formatDateTime(timestamp) {
  if (!timestamp) return ''
  const d = new Date(timestamp)
  if (isNaN(d.getTime())) return ''
  const now = Date.now()
  const diff = now - timestamp
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)}分钟前`
  if (diff < day) return `${Math.floor(diff / hour)}小时前`
  if (diff < 7 * day) return `${Math.floor(diff / day)}天前`

  const pad = (n) => String(n).padStart(2, '0')
  const y = d.getFullYear()
  const m = pad(d.getMonth() + 1)
  const dayN = pad(d.getDate())
  const h = pad(d.getHours())
  const min = pad(d.getMinutes())
  return `${y}-${m}-${dayN} ${h}:${min}`
}

export function validatePostContent(content) {
  if (!content || typeof content !== 'string') {
    return { valid: false, error: '内容不能为空' }
  }
  const trimmed = content.trim()
  if (trimmed.length === 0) {
    return { valid: false, error: '内容不能为空或纯空格' }
  }
  if (trimmed.length > MAX_TEXT_LENGTH) {
    return { valid: false, error: `内容不能超过 ${MAX_TEXT_LENGTH} 字` }
  }
  return { valid: true, error: null }
}

export function validateImages(images) {
  if (!images) return { valid: true, error: null }
  if (!Array.isArray(images)) {
    return { valid: false, error: '图片数据格式错误' }
  }
  if (images.length > MAX_IMAGES) {
    return { valid: false, error: `最多只能上传 ${MAX_IMAGES} 张图片` }
  }
  return { valid: true, error: null }
}

export function validateCommentContent(content) {
  if (!content || typeof content !== 'string') {
    return { valid: false, error: '评论内容不能为空' }
  }
  const trimmed = content.trim()
  if (trimmed.length === 0) {
    return { valid: false, error: '评论内容不能为空或纯空格' }
  }
  return { valid: true, error: null }
}

export function loadPosts() {
  try {
    const raw = localStorage.getItem(POSTS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed
      }
    }
  } catch {
    // ignore
  }
  const initial = createMockPosts()
  savePosts(initial)
  return initial
}

export function savePosts(posts) {
  try {
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts))
    return true
  } catch {
    return false
  }
}

export function loadFollows() {
  try {
    const raw = localStorage.getItem(FOLLOWS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed
      }
    }
  } catch {
    // ignore
  }
  const initial = createMockFollows()
  saveFollows(initial)
  return initial
}

export function saveFollows(follows) {
  try {
    localStorage.setItem(FOLLOWS_STORAGE_KEY, JSON.stringify(follows))
    return true
  } catch {
    return false
  }
}

export function loadLikes() {
  try {
    const raw = localStorage.getItem(LIKES_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed
      }
    }
  } catch {
    // ignore
  }
  const initial = createMockLikes()
  saveLikes(initial)
  return initial
}

export function saveLikes(likes) {
  try {
    localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(likes))
    return true
  } catch {
    return false
  }
}

export function createPost({ content, images = [] }) {
  const contentValidation = validatePostContent(content)
  if (!contentValidation.valid) {
    return { success: false, error: contentValidation.error }
  }
  const imagesValidation = validateImages(images)
  if (!imagesValidation.valid) {
    return { success: false, error: imagesValidation.error }
  }

  const trimmedContent = content.trim()
  const newPost = {
    id: generateId('post'),
    userId: CURRENT_USER.id,
    userName: CURRENT_USER.name,
    userAvatar: CURRENT_USER.avatar || DEFAULT_AVATAR,
    content: trimmedContent,
    images: [...images],
    topics: extractTopics(trimmedContent),
    createdAt: Date.now(),
    likeCount: 0,
    commentCount: 0,
    repostCount: 0,
    comments: [],
    repostOf: null,
  }

  return { success: true, post: newPost }
}

export function addPost(posts, newPost) {
  return [newPost, ...posts]
}

export function sortPosts(posts, sortBy = SORT_OPTIONS.NEWEST) {
  const result = [...posts]
  switch (sortBy) {
    case SORT_OPTIONS.HOTTEST:
      return result.sort((a, b) => {
        if (b.likeCount !== a.likeCount) return b.likeCount - a.likeCount
        return b.createdAt - a.createdAt
      })
    case SORT_OPTIONS.NEWEST:
    default:
      return result.sort((a, b) => b.createdAt - a.createdAt)
  }
}

export function filterByFollowing(posts, followingIds) {
  if (!Array.isArray(followingIds) || followingIds.length === 0) {
    return []
  }
  const idSet = new Set(followingIds)
  return posts.filter((p) => idSet.has(p.userId))
}

export function getFeedPosts(posts, { tab = FEED_TABS.ALL, sortBy = SORT_OPTIONS.NEWEST, followingIds = [] } = {}) {
  let filtered = [...posts]
  if (tab === FEED_TABS.FOLLOWING) {
    filtered = filterByFollowing(filtered, followingIds)
  }
  return sortPosts(filtered, sortBy)
}

export function paginatePosts(posts, page, pageSize = PAGE_SIZE) {
  const total = posts.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(Math.max(1, page), totalPages)
  const start = (currentPage - 1) * pageSize
  const end = start + pageSize
  return {
    items: posts.slice(start, end),
    total,
    totalPages,
    currentPage,
    pageSize,
    hasMore: end < total,
  }
}

export function isLiked(likes, postId) {
  if (!Array.isArray(likes)) return false
  return likes.includes(postId)
}

export function toggleLike(posts, likes, postId) {
  const postIndex = posts.findIndex((p) => p.id === postId)
  if (postIndex === -1) {
    return { success: false, error: '动态不存在', posts, likes }
  }

  const liked = isLiked(likes, postId)
  const updatedPosts = [...posts]
  const post = { ...updatedPosts[postIndex] }
  post.likeCount = Math.max(0, (post.likeCount || 0) + (liked ? -1 : 1))
  updatedPosts[postIndex] = post

  const updatedLikes = liked ? likes.filter((id) => id !== postId) : [...likes, postId]

  return {
    success: true,
    posts: updatedPosts,
    likes: updatedLikes,
    liked: !liked,
  }
}

export function isFollowing(follows, userId) {
  if (!Array.isArray(follows)) return false
  return follows.includes(userId)
}

export function toggleFollow(follows, userId) {
  if (userId === CURRENT_USER.id) {
    return { success: false, error: '不能关注自己', follows }
  }
  const following = isFollowing(follows, userId)
  const updated = following ? follows.filter((id) => id !== userId) : [...follows, userId]
  return {
    success: true,
    follows: updated,
    following: !following,
  }
}

export function createRepost(posts, originalPostId, repostContent = '') {
  const originalPost = posts.find((p) => p.id === originalPostId)
  if (!originalPost) {
    return { success: false, error: '原动态不存在' }
  }

  const prefixText = repostContent && repostContent.trim().length > 0 ? repostContent.trim() : ''
  const repostMark = `【转发了@${originalPost.userName}的动态】`
  const finalContent = prefixText ? `${prefixText}\n${repostMark}` : repostMark

  const newPost = {
    id: generateId('post'),
    userId: CURRENT_USER.id,
    userName: CURRENT_USER.name,
    userAvatar: CURRENT_USER.avatar || DEFAULT_AVATAR,
    content: finalContent,
    images: [],
    topics: extractTopics(finalContent),
    createdAt: Date.now(),
    likeCount: 0,
    commentCount: 0,
    repostCount: 0,
    comments: [],
    repostOf: {
      id: originalPost.id,
      userId: originalPost.userId,
      userName: originalPost.userName,
      userAvatar: originalPost.userAvatar,
      content: originalPost.content,
      images: originalPost.images,
      createdAt: originalPost.createdAt,
    },
  }

  const updatedPosts = [...posts]
  const origIndex = updatedPosts.findIndex((p) => p.id === originalPostId)
  if (origIndex !== -1) {
    updatedPosts[origIndex] = {
      ...updatedPosts[origIndex],
      repostCount: (updatedPosts[origIndex].repostCount || 0) + 1,
    }
  }

  return { success: true, post: newPost, posts: [newPost, ...updatedPosts] }
}

function addReplyToComments(comments, parentCommentId, reply, currentDepth) {
  if (currentDepth >= MAX_COMMENT_DEPTH) return null
  for (let i = 0; i < comments.length; i++) {
    if (comments[i].id === parentCommentId) {
      const target = { ...comments[i] }
      target.replies = [...(target.replies || []), reply]
      const updated = [...comments]
      updated[i] = target
      return updated
    }
    if (comments[i].replies && comments[i].replies.length > 0) {
      const nested = addReplyToComments(comments[i].replies, parentCommentId, reply, currentDepth + 1)
      if (nested) {
        const updated = [...comments]
        updated[i] = { ...comments[i], replies: nested }
        return updated
      }
    }
  }
  return null
}

export function addComment(posts, postId, content, parentCommentId = null) {
  const contentValidation = validateCommentContent(content)
  if (!contentValidation.valid) {
    return { success: false, error: contentValidation.error, posts }
  }

  const postIndex = posts.findIndex((p) => p.id === postId)
  if (postIndex === -1) {
    return { success: false, error: '动态不存在', posts }
  }

  const reply = {
    id: generateId('comment'),
    userId: CURRENT_USER.id,
    userName: CURRENT_USER.name,
    userAvatar: CURRENT_USER.avatar || DEFAULT_AVATAR,
    content: content.trim(),
    createdAt: Date.now(),
    replies: [],
  }

  const updatedPosts = [...posts]
  const post = { ...updatedPosts[postIndex] }
  post.commentCount = (post.commentCount || 0) + 1

  if (!parentCommentId) {
    post.comments = [...(post.comments || []), reply]
  } else {
    const updatedComments = addReplyToComments(post.comments || [], parentCommentId, reply, 1)
    if (!updatedComments) {
      return { success: false, error: '回复层级过深', posts }
    }
    post.comments = updatedComments
  }

  updatedPosts[postIndex] = post
  return { success: true, posts: updatedPosts, comment: reply }
}

export function getCommentCount(comments) {
  if (!Array.isArray(comments) || comments.length === 0) return 0
  let count = comments.length
  for (const c of comments) {
    if (c.replies) {
      count += getCommentCount(c.replies)
    }
  }
  return count
}

export function renderContentWithTopics(content) {
  if (!content) return []
  const regex = /(#[^\s#]+)/g
  const parts = content.split(regex)
  return parts
    .filter((p) => p.length > 0)
    .map((part, index) => {
      if (part.startsWith('#')) {
        return { type: 'topic', text: part, key: `topic_${index}` }
      }
      return { type: 'text', text: part, key: `text_${index}` }
    })
}

export function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'))
      return
    }
    if (!file.type || !file.type.startsWith('image/')) {
      reject(new Error('File must be an image'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export function getRepostChain(posts, postId, chain = []) {
  const post = posts.find((p) => p.id === postId)
  if (!post) return chain
  chain.push(post)
  if (post.repostOf && post.repostOf.id) {
    const original = posts.find((p) => p.id === post.repostOf.id)
    if (original) {
      return getRepostChain(posts, original.id, chain)
    }
  }
  return chain
}
