import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  generateId,
  formatDateTime,
  validatePostContent,
  validateImages,
  validateCommentContent,
  loadPosts,
  savePosts,
  loadFollows,
  saveFollows,
  loadLikes,
  saveLikes,
  createPost,
  addPost,
  sortPosts,
  filterByFollowing,
  getFeedPosts,
  paginatePosts,
  isLiked,
  toggleLike,
  isFollowing,
  toggleFollow,
  createRepost,
  addComment,
  getCommentCount,
  renderContentWithTopics,
  fileToDataURL,
  getRepostChain,
} from '@/pages/social-feed/utils'
import {
  SORT_OPTIONS,
  FEED_TABS,
  PAGE_SIZE,
  MAX_IMAGES,
  MAX_TEXT_LENGTH,
  MAX_COMMENT_DEPTH,
  CURRENT_USER,
  POSTS_STORAGE_KEY,
} from '@/pages/social-feed/constants'

function createMockLocalStorage() {
  const store = new Map()
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    get length() {
      return store.size
    },
    key: (index) => Array.from(store.keys())[index] ?? null,
  }
}

function createMockFileReader() {
  return function MockFileReader() {
    this.result = null
    this.error = null
    this.onload = null
    this.onerror = null
    this.readAsDataURL = function (file) {
      const content = typeof file === 'object' && file !== null ? '[mock data]' : ''
      queueMicrotask(() => {
        this.result = `data:image/png;base64,${btoa(content)}`
        this.onload?.({ target: this })
      })
    }
  }
}

const originalLocalStorage = globalThis.localStorage
const originalFileReader = globalThis.FileReader

beforeEach(() => {
  globalThis.localStorage = createMockLocalStorage()
  globalThis.FileReader = createMockFileReader()
})

afterEach(() => {
  if (originalLocalStorage) {
    globalThis.localStorage = originalLocalStorage
  } else {
    delete globalThis.localStorage
  }
  if (originalFileReader) {
    globalThis.FileReader = originalFileReader
  } else {
    delete globalThis.FileReader
  }
  vi.restoreAllMocks()
})

function makeTestPosts() {
  const now = 1700000000000
  const hour = 60 * 60 * 1000
  return [
    {
      id: 'post_1',
      userId: 'user_a',
      userName: '用户A',
      userAvatar: 'avatar_a.png',
      content: '测试内容1 #话题1 #话题2',
      images: [],
      topics: ['话题1', '话题2'],
      createdAt: now - hour * 2,
      likeCount: 10,
      commentCount: 2,
      repostCount: 1,
      comments: [
        {
          id: 'c1',
          userId: 'user_b',
          userName: '用户B',
          userAvatar: 'avatar_b.png',
          content: '评论1',
          createdAt: now - hour,
          replies: [
            {
              id: 'c1r1',
              userId: 'user_a',
              userName: '用户A',
              userAvatar: 'avatar_a.png',
              content: '回复1',
              createdAt: now - hour + 30 * 60 * 1000,
              replies: [],
            },
          ],
        },
        {
          id: 'c2',
          userId: 'user_c',
          userName: '用户C',
          userAvatar: 'avatar_c.png',
          content: '评论2',
          createdAt: now - 30 * 60 * 1000,
          replies: [],
        },
      ],
      repostOf: null,
    },
    {
      id: 'post_2',
      userId: 'user_b',
      userName: '用户B',
      userAvatar: 'avatar_b.png',
      content: '测试内容2 #话题3',
      images: ['img1.png', 'img2.png'],
      topics: ['话题3'],
      createdAt: now - hour,
      likeCount: 50,
      commentCount: 0,
      repostCount: 5,
      comments: [],
      repostOf: null,
    },
    {
      id: 'post_3',
      userId: 'user_c',
      userName: '用户C',
      userAvatar: 'avatar_c.png',
      content: '测试内容3',
      images: [],
      topics: [],
      createdAt: now,
      likeCount: 5,
      commentCount: 0,
      repostCount: 0,
      comments: [],
      repostOf: null,
    },
  ]
}

describe('generateId', () => {
  it('生成非空字符串 ID', () => {
    const id = generateId('post')
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
    expect(id.startsWith('post_')).toBe(true)
  })

  it('生成的 ID 不重复', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(100)
  })
})

describe('formatDateTime', () => {
  it('空值返回空字符串', () => {
    expect(formatDateTime(null)).toBe('')
    expect(formatDateTime(undefined)).toBe('')
    expect(formatDateTime(0)).toBe('')
  })

  it('1分钟内返回"刚刚"', () => {
    const now = Date.now()
    expect(formatDateTime(now)).toBe('刚刚')
    expect(formatDateTime(now - 30 * 1000)).toBe('刚刚')
  })

  it('1小时内返回"X分钟前"', () => {
    const now = Date.now()
    expect(formatDateTime(now - 5 * 60 * 1000)).toMatch(/^\d+分钟前$/)
    expect(formatDateTime(now - 59 * 60 * 1000)).toMatch(/^\d+分钟前$/)
  })

  it('1天内返回"X小时前"', () => {
    const now = Date.now()
    expect(formatDateTime(now - 2 * 60 * 60 * 1000)).toMatch(/^\d+小时前$/)
    expect(formatDateTime(now - 23 * 60 * 60 * 1000)).toMatch(/^\d+小时前$/)
  })

  it('7天内返回"X天前"', () => {
    const now = Date.now()
    expect(formatDateTime(now - 2 * 24 * 60 * 60 * 1000)).toMatch(/^\d+天前$/)
  })

  it('7天以上返回完整日期格式', () => {
    const old = new Date('2024-01-15T10:30:00').getTime()
    const result = formatDateTime(old)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
  })
})

describe('validatePostContent', () => {
  it('null/undefined 返回错误', () => {
    expect(validatePostContent(null).valid).toBe(false)
    expect(validatePostContent(undefined).valid).toBe(false)
    expect(validatePostContent('').valid).toBe(false)
  })

  it('纯空格返回错误', () => {
    expect(validatePostContent('   ').valid).toBe(false)
    expect(validatePostContent('\n\t  ').valid).toBe(false)
  })

  it('非字符串返回错误', () => {
    expect(validatePostContent(123).valid).toBe(false)
    expect(validatePostContent({}).valid).toBe(false)
  })

  it('超过最大字数返回错误', () => {
    const long = 'a'.repeat(MAX_TEXT_LENGTH + 1)
    const result = validatePostContent(long)
    expect(result.valid).toBe(false)
    expect(result.error).toContain(String(MAX_TEXT_LENGTH))
  })

  it('有效内容返回成功', () => {
    const result = validatePostContent('这是一条有效内容')
    expect(result.valid).toBe(true)
    expect(result.error).toBeNull()
  })

  it('刚好等于最大字数返回成功', () => {
    const content = 'a'.repeat(MAX_TEXT_LENGTH)
    expect(validatePostContent(content).valid).toBe(true)
  })
})

describe('validateImages', () => {
  it('null/undefined 返回成功', () => {
    expect(validateImages(null).valid).toBe(true)
    expect(validateImages(undefined).valid).toBe(true)
  })

  it('非数组返回错误', () => {
    expect(validateImages('not array').valid).toBe(false)
    expect(validateImages({}).valid).toBe(false)
  })

  it('超过最大数量返回错误', () => {
    const images = new Array(MAX_IMAGES + 1).fill('img.png')
    const result = validateImages(images)
    expect(result.valid).toBe(false)
    expect(result.error).toContain(String(MAX_IMAGES))
  })

  it('空数组返回成功', () => {
    expect(validateImages([]).valid).toBe(true)
  })

  it('有效数量返回成功', () => {
    const images = new Array(MAX_IMAGES).fill('img.png')
    expect(validateImages(images).valid).toBe(true)
  })
})

describe('validateCommentContent', () => {
  it('null/undefined/空字符串返回错误', () => {
    expect(validateCommentContent(null).valid).toBe(false)
    expect(validateCommentContent(undefined).valid).toBe(false)
    expect(validateCommentContent('').valid).toBe(false)
  })

  it('纯空格返回错误', () => {
    expect(validateCommentContent('   ').valid).toBe(false)
  })

  it('非字符串返回错误', () => {
    expect(validateCommentContent(123).valid).toBe(false)
  })

  it('有效内容返回成功', () => {
    expect(validateCommentContent('好评论').valid).toBe(true)
  })
})

describe('localStorage 持久化', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('savePosts 和 loadPosts 正常工作', () => {
    const posts = makeTestPosts()
    expect(savePosts(posts)).toBe(true)
    const loaded = loadPosts()
    expect(Array.isArray(loaded)).toBe(true)
    expect(loaded.length).toBeGreaterThan(0)
  })

  it('savePosts 在 localStorage 异常时返回 false', () => {
    const originalSetItem = localStorage.setItem
    localStorage.setItem = () => {
      throw new Error('QuotaExceededError')
    }
    expect(savePosts([{ id: 'a' }])).toBe(false)
    localStorage.setItem = originalSetItem
  })

  it('loadPosts 在 localStorage 为空时自动初始化数据', () => {
    expect(localStorage.getItem(POSTS_STORAGE_KEY)).toBeNull()
    const result = loadPosts()
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
    expect(localStorage.getItem(POSTS_STORAGE_KEY)).toBeTruthy()
  })

  it('loadPosts 在 JSON 非法时回退到初始化数据', () => {
    localStorage.setItem(POSTS_STORAGE_KEY, 'invalid json {{{')
    const result = loadPosts()
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })

  it('saveFollows 和 loadFollows 正常工作', () => {
    const follows = ['user_1', 'user_2']
    expect(saveFollows(follows)).toBe(true)
    expect(loadFollows()).toEqual(follows)
  })

  it('saveLikes 和 loadLikes 正常工作', () => {
    const likes = ['post_1', 'post_2']
    expect(saveLikes(likes)).toBe(true)
    expect(loadLikes()).toEqual(likes)
  })
})

describe('createPost', () => {
  it('创建动态成功', () => {
    const result = createPost({ content: '测试内容 #话题', images: ['img1.png'] })
    expect(result.success).toBe(true)
    expect(result.post).toBeDefined()
    expect(result.post.content).toBe('测试内容 #话题')
    expect(result.post.images).toEqual(['img1.png'])
    expect(result.post.userId).toBe(CURRENT_USER.id)
    expect(result.post.topics).toContain('话题')
    expect(result.post.likeCount).toBe(0)
    expect(result.post.commentCount).toBe(0)
    expect(result.post.repostCount).toBe(0)
    expect(Array.isArray(result.post.comments)).toBe(true)
    expect(result.post.comments.length).toBe(0)
  })

  it('空内容创建失败', () => {
    const result = createPost({ content: '   ' })
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('图片过多创建失败', () => {
    const images = new Array(MAX_IMAGES + 1).fill('img.png')
    const result = createPost({ content: '测试', images })
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('不提供图片默认为空数组', () => {
    const result = createPost({ content: '测试' })
    expect(result.success).toBe(true)
    expect(result.post.images).toEqual([])
  })
})

describe('addPost', () => {
  it('将新动态添加到列表顶部', () => {
    const posts = makeTestPosts()
    const newPost = { id: 'new', content: 'new' }
    const result = addPost(posts, newPost)
    expect(result.length).toBe(posts.length + 1)
    expect(result[0].id).toBe('new')
  })

  it('不修改原始数组', () => {
    const posts = makeTestPosts()
    const originalLength = posts.length
    addPost(posts, { id: 'new' })
    expect(posts.length).toBe(originalLength)
  })
})

describe('sortPosts', () => {
  it('默认按发布时间降序（最新）', () => {
    const posts = makeTestPosts()
    const sorted = sortPosts(posts)
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].createdAt).toBeGreaterThanOrEqual(sorted[i].createdAt)
    }
  })

  it('按点赞数降序（最热），点赞数相同时按时间降序', () => {
    const posts = makeTestPosts()
    const sorted = sortPosts(posts, SORT_OPTIONS.HOTTEST)
    expect(sorted[0].id).toBe('post_2')
    expect(sorted[1].id).toBe('post_1')
    expect(sorted[2].id).toBe('post_3')
  })

  it('不修改原始数组', () => {
    const posts = makeTestPosts()
    const originalOrder = posts.map((p) => p.id)
    sortPosts(posts, SORT_OPTIONS.HOTTEST)
    expect(posts.map((p) => p.id)).toEqual(originalOrder)
  })
})

describe('filterByFollowing', () => {
  it('空关注列表返回空数组', () => {
    const posts = makeTestPosts()
    expect(filterByFollowing(posts, [])).toEqual([])
    expect(filterByFollowing(posts, null)).toEqual([])
  })

  it('按关注的用户 ID 筛选', () => {
    const posts = makeTestPosts()
    const result = filterByFollowing(posts, ['user_a', 'user_c'])
    expect(result.length).toBe(2)
    expect(result.every((p) => ['user_a', 'user_c'].includes(p.userId))).toBe(true)
  })

  it('不修改原始数组', () => {
    const posts = makeTestPosts()
    const originalLength = posts.length
    filterByFollowing(posts, ['user_a'])
    expect(posts.length).toBe(originalLength)
  })
})

describe('getFeedPosts', () => {
  it('默认返回全部动态并按最新排序', () => {
    const posts = makeTestPosts()
    const result = getFeedPosts(posts)
    expect(result.length).toBe(posts.length)
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].createdAt).toBeGreaterThanOrEqual(result[i].createdAt)
    }
  })

  it('关注 tab 只显示关注用户的动态', () => {
    const posts = makeTestPosts()
    const result = getFeedPosts(posts, {
      tab: FEED_TABS.FOLLOWING,
      followingIds: ['user_b'],
    })
    expect(result.length).toBe(1)
    expect(result[0].userId).toBe('user_b')
  })

  it('最热排序正确应用', () => {
    const posts = makeTestPosts()
    const result = getFeedPosts(posts, { sortBy: SORT_OPTIONS.HOTTEST })
    expect(result[0].id).toBe('post_2')
  })
})

describe('paginatePosts', () => {
  it('第一页返回正确数量', () => {
    const posts = []
    for (let i = 0; i < 25; i++) {
      posts.push({ id: `p${i}` })
    }
    const result = paginatePosts(posts, 1, 10)
    expect(result.items.length).toBe(10)
    expect(result.currentPage).toBe(1)
    expect(result.total).toBe(25)
    expect(result.totalPages).toBe(3)
    expect(result.hasMore).toBe(true)
  })

  it('最后一页 hasMore 为 false', () => {
    const posts = []
    for (let i = 0; i < 15; i++) {
      posts.push({ id: `p${i}` })
    }
    const result = paginatePosts(posts, 2, 10)
    expect(result.items.length).toBe(5)
    expect(result.hasMore).toBe(false)
  })

  it('page 超出范围时取边界值', () => {
    const posts = [{ id: '1' }, { id: '2' }]
    const r1 = paginatePosts(posts, 0, 10)
    expect(r1.currentPage).toBe(1)
    const r2 = paginatePosts(posts, 999, 10)
    expect(r2.currentPage).toBe(1)
  })

  it('使用默认 PAGE_SIZE', () => {
    const posts = []
    for (let i = 0; i < PAGE_SIZE + 5; i++) {
      posts.push({ id: `p${i}` })
    }
    const result = paginatePosts(posts, 1)
    expect(result.items.length).toBe(PAGE_SIZE)
  })
})

describe('isLiked', () => {
  it('正确判断是否已点赞', () => {
    expect(isLiked(['post_1', 'post_2'], 'post_1')).toBe(true)
    expect(isLiked(['post_1'], 'post_999')).toBe(false)
    expect(isLiked(null, 'post_1')).toBe(false)
    expect(isLiked(undefined, 'post_1')).toBe(false)
  })
})

describe('toggleLike', () => {
  it('未点赞时添加点赞', () => {
    const posts = makeTestPosts()
    const likes = []
    const result = toggleLike(posts, likes, 'post_1')
    expect(result.success).toBe(true)
    expect(result.liked).toBe(true)
    expect(result.likes).toContain('post_1')
    expect(result.posts.find((p) => p.id === 'post_1').likeCount).toBe(11)
  })

  it('已点赞时取消点赞', () => {
    const posts = makeTestPosts()
    const likes = ['post_1']
    const result = toggleLike(posts, likes, 'post_1')
    expect(result.success).toBe(true)
    expect(result.liked).toBe(false)
    expect(result.likes).not.toContain('post_1')
    expect(result.posts.find((p) => p.id === 'post_1').likeCount).toBe(9)
  })

  it('动态不存在时返回错误', () => {
    const posts = makeTestPosts()
    const result = toggleLike(posts, [], 'non_existent')
    expect(result.success).toBe(false)
  })

  it('不修改原始数组', () => {
    const posts = makeTestPosts()
    const likes = ['post_1']
    const originalLikeCount = posts[0].likeCount
    toggleLike(posts, likes, 'post_1')
    expect(posts[0].likeCount).toBe(originalLikeCount)
  })
})

describe('isFollowing', () => {
  it('正确判断是否已关注', () => {
    expect(isFollowing(['user_a'], 'user_a')).toBe(true)
    expect(isFollowing(['user_a'], 'user_b')).toBe(false)
    expect(isFollowing(null, 'user_a')).toBe(false)
  })
})

describe('toggleFollow', () => {
  it('未关注时添加关注', () => {
    const follows = ['user_a']
    const result = toggleFollow(follows, 'user_b')
    expect(result.success).toBe(true)
    expect(result.following).toBe(true)
    expect(result.follows).toContain('user_b')
    expect(result.follows).toContain('user_a')
  })

  it('已关注时取消关注', () => {
    const follows = ['user_a', 'user_b']
    const result = toggleFollow(follows, 'user_b')
    expect(result.success).toBe(true)
    expect(result.following).toBe(false)
    expect(result.follows).not.toContain('user_b')
  })

  it('不能关注自己', () => {
    const result = toggleFollow([], CURRENT_USER.id)
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('不修改原始数组', () => {
    const follows = ['user_a']
    toggleFollow(follows, 'user_b')
    expect(follows.length).toBe(1)
    expect(follows).toEqual(['user_a'])
  })
})

describe('createRepost', () => {
  it('创建转发动态成功', () => {
    const posts = makeTestPosts()
    const result = createRepost(posts, 'post_1', '我也觉得不错')
    expect(result.success).toBe(true)
    expect(result.post).toBeDefined()
    expect(result.post.content).toContain('我也觉得不错')
    expect(result.post.content).toContain('转发了')
    expect(result.post.content).toContain('用户A')
    expect(result.post.repostOf).toBeDefined()
    expect(result.post.repostOf.id).toBe('post_1')
    expect(result.posts.length).toBe(posts.length + 1)
    expect(result.posts.find((p) => p.id === 'post_1').repostCount).toBe(2)
  })

  it('无转发文本时也能成功转发', () => {
    const posts = makeTestPosts()
    const result = createRepost(posts, 'post_1', '')
    expect(result.success).toBe(true)
    expect(result.post.content).toContain('转发了')
  })

  it('原动态不存在时返回错误', () => {
    const posts = makeTestPosts()
    const result = createRepost(posts, 'non_existent')
    expect(result.success).toBe(false)
  })
})

describe('addComment', () => {
  it('添加顶级评论成功', () => {
    const posts = makeTestPosts()
    const result = addComment(posts, 'post_3', '新评论')
    expect(result.success).toBe(true)
    expect(result.comment).toBeDefined()
    expect(result.comment.content).toBe('新评论')
    const updatedPost = result.posts.find((p) => p.id === 'post_3')
    expect(updatedPost.comments.length).toBe(1)
    expect(updatedPost.commentCount).toBe(1)
  })

  it('添加嵌套回复成功', () => {
    const posts = makeTestPosts()
    const result = addComment(posts, 'post_1', '回复评论1', 'c1')
    expect(result.success).toBe(true)
    const updatedPost = result.posts.find((p) => p.id === 'post_1')
    const targetComment = updatedPost.comments.find((c) => c.id === 'c1')
    expect(targetComment.replies.length).toBe(2)
  })

  it('空评论内容返回错误', () => {
    const posts = makeTestPosts()
    const result = addComment(posts, 'post_1', '   ')
    expect(result.success).toBe(false)
  })

  it('动态不存在时返回错误', () => {
    const posts = makeTestPosts()
    const result = addComment(posts, 'non_existent', '评论')
    expect(result.success).toBe(false)
  })

  it('不修改原始数组', () => {
    const posts = makeTestPosts()
    const originalCommentCount = posts[0].comments.length
    addComment(posts, 'post_1', '新评论')
    expect(posts[0].comments.length).toBe(originalCommentCount)
  })

  it('嵌套回复超过 MAX_COMMENT_DEPTH 层时返回错误', () => {
    const buildNestedComments = (depth) => {
      if (depth === 0) return []
      return [
        {
          id: `c_depth_${depth}`,
          userId: 'u1',
          userName: 'User',
          userAvatar: 'a.png',
          content: `depth ${depth}`,
          createdAt: Date.now(),
          replies: buildNestedComments(depth - 1),
        },
      ]
    }
    const deeplyNestedPost = {
      id: 'post_deep',
      userId: 'u1',
      userName: 'User',
      userAvatar: 'a.png',
      content: 'test',
      images: [],
      topics: [],
      createdAt: Date.now(),
      likeCount: 0,
      commentCount: MAX_COMMENT_DEPTH,
      repostCount: 0,
      comments: buildNestedComments(MAX_COMMENT_DEPTH),
      repostOf: null,
    }
    const posts = [deeplyNestedPost]
    const result = addComment(posts, 'post_deep', '超限回复', 'c_depth_1')
    expect(result.success).toBe(false)
    expect(result.error).toContain('层级')
  })

  it('第 MAX_COMMENT_DEPTH-1 层仍然可以添加回复', () => {
    const buildNestedComments = (depth) => {
      if (depth === 0) return []
      return [
        {
          id: `c_${depth}`,
          userId: 'u1',
          userName: 'User',
          userAvatar: 'a.png',
          content: `depth ${depth}`,
          createdAt: Date.now(),
          replies: buildNestedComments(depth - 1),
        },
      ]
    }
    const post = {
      id: 'post_test',
      userId: 'u1',
      userName: 'User',
      userAvatar: 'a.png',
      content: 'test',
      images: [],
      topics: [],
      createdAt: Date.now(),
      likeCount: 0,
      commentCount: MAX_COMMENT_DEPTH - 1,
      repostCount: 0,
      comments: buildNestedComments(MAX_COMMENT_DEPTH - 1),
      repostOf: null,
    }
    const posts = [post]
    const result = addComment(posts, 'post_test', '有效回复', 'c_1')
    expect(result.success).toBe(true)
  })
})

describe('getCommentCount', () => {
  it('计算评论总数（含嵌套）', () => {
    const posts = makeTestPosts()
    const count = getCommentCount(posts[0].comments)
    expect(count).toBe(3)
  })

  it('空评论返回 0', () => {
    expect(getCommentCount([])).toBe(0)
    expect(getCommentCount(null)).toBe(0)
  })
})

describe('renderContentWithTopics', () => {
  it('正确拆分话题标签和普通文本', () => {
    const result = renderContentWithTopics('今天天气真好 #旅行 #风景 很棒')
    expect(result.length).toBe(5)
    expect(result[0].type).toBe('text')
    expect(result[1].type).toBe('topic')
    expect(result[1].text).toBe('#旅行')
    expect(result[2].type).toBe('text')
    expect(result[3].type).toBe('topic')
    expect(result[3].text).toBe('#风景')
    expect(result[4].type).toBe('text')
  })

  it('纯文本不包含话题', () => {
    const result = renderContentWithTopics('普通文本没有话题')
    expect(result.length).toBe(1)
    expect(result[0].type).toBe('text')
  })

  it('空内容返回空数组', () => {
    expect(renderContentWithTopics('')).toEqual([])
    expect(renderContentWithTopics(null)).toEqual([])
  })
})

describe('fileToDataURL', () => {
  function makeMockFile(name, type) {
    return {
      name,
      size: 100,
      type,
    }
  }

  it('返回 Promise', () => {
    const file = makeMockFile('test.png', 'image/png')
    const result = fileToDataURL(file)
    expect(result).toBeInstanceOf(Promise)
  })

  it('图片文件读取成功返回 data URL', async () => {
    const file = makeMockFile('test.png', 'image/png')
    const result = await fileToDataURL(file)
    expect(typeof result).toBe('string')
    expect(result.startsWith('data:')).toBe(true)
  })

  it('非图片文件 reject', async () => {
    const file = makeMockFile('test.txt', 'text/plain')
    await expect(fileToDataURL(file)).rejects.toBeDefined()
  })

  it('空文件 reject', async () => {
    await expect(fileToDataURL(null)).rejects.toBeDefined()
  })
})

describe('getRepostChain', () => {
  it('获取转发链', () => {
    const now = 1700000000000
    const original = {
      id: 'orig',
      userId: 'u1',
      content: '原始内容',
      images: [],
      repostOf: null,
      createdAt: now,
    }
    const repost1 = {
      id: 'repost1',
      userId: 'u2',
      content: '转发了',
      images: [],
      repostOf: { id: 'orig', userId: 'u1', userName: '用户1', content: '原始内容', images: [], createdAt: now },
      createdAt: now + 1000,
    }
    const repost2 = {
      id: 'repost2',
      userId: 'u3',
      content: '再转发',
      images: [],
      repostOf: { id: 'repost1', userId: 'u2', userName: '用户2', content: '转发了', images: [], createdAt: now + 1000 },
      createdAt: now + 2000,
    }
    const posts = [repost2, repost1, original]
    const chain = getRepostChain(posts, 'repost2')
    expect(chain.length).toBeGreaterThanOrEqual(1)
    expect(chain[0].id).toBe('repost2')
  })

  it('动态不存在返回空数组', () => {
    expect(getRepostChain([], 'non_existent')).toEqual([])
  })
})
