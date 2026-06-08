export const POSTS_STORAGE_KEY = 'social-feed-posts'
export const FOLLOWS_STORAGE_KEY = 'social-feed-follows'
export const LIKES_STORAGE_KEY = 'social-feed-likes'

export const PAGE_SIZE = 10
export const MAX_IMAGES = 9
export const MAX_TEXT_LENGTH = 500
export const MAX_COMMENT_DEPTH = 3

export const SORT_OPTIONS = {
  NEWEST: 'newest',
  HOTTEST: 'hottest',
}

export const FEED_TABS = {
  ALL: 'all',
  FOLLOWING: 'following',
}

export const DEFAULT_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="%23e0e0e0"/><circle cx="32" cy="26" r="10" fill="%239e9e9e"/><path d="M12,56 C12,44 22,38 32,38 C42,38 52,44 52,56 Z" fill="%239e9e9e"/></svg>'

export const CURRENT_USER = {
  id: 'user_me',
  name: '我',
  avatar: DEFAULT_AVATAR,
}
