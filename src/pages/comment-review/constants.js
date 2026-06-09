export const COMMENTS_STORAGE_KEY = 'solocoder_comment_review_comments'
export const REVIEW_RECORDS_STORAGE_KEY = 'solocoder_comment_review_records'
export const SENSITIVE_WORDS_STORAGE_KEY = 'solocoder_comment_review_sensitive_words'

export const COMMENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
}

export const COMMENT_STATUS_LABEL = {
  [COMMENT_STATUS.PENDING]: '待审核',
  [COMMENT_STATUS.APPROVED]: '已通过',
  [COMMENT_STATUS.REJECTED]: '已驳回',
}

export const REVIEW_RESULT_OPTIONS = {
  ALL: 'all',
  APPROVED: COMMENT_STATUS.APPROVED,
  REJECTED: COMMENT_STATUS.REJECTED,
}

export const REVIEW_RESULT_LABEL = {
  [REVIEW_RESULT_OPTIONS.ALL]: '全部',
  [REVIEW_RESULT_OPTIONS.APPROVED]: '已通过',
  [REVIEW_RESULT_OPTIONS.REJECTED]: '已驳回',
}

export const REJECT_REASONS = [
  { key: 'ad', label: '广告信息' },
  { key: 'porn', label: '色情内容' },
  { key: 'attack', label: '人身攻击' },
  { key: 'irrelevant', label: '与主题无关' },
  { key: 'duplicate', label: '重复评论' },
  { key: 'other', label: '其他' },
]

export const REJECT_REASON_LABEL = REJECT_REASONS.reduce((acc, r) => {
  acc[r.key] = r.label
  return acc
}, {})

export const SENSITIVE_LEVEL = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
}

export const SENSITIVE_LEVEL_LABEL = {
  [SENSITIVE_LEVEL.LOW]: '轻度',
  [SENSITIVE_LEVEL.MEDIUM]: '中度',
  [SENSITIVE_LEVEL.HIGH]: '重度',
}

export const SENSITIVE_LEVEL_COLOR = {
  [SENSITIVE_LEVEL.LOW]: '#f59e0b',
  [SENSITIVE_LEVEL.MEDIUM]: '#ef4444',
  [SENSITIVE_LEVEL.HIGH]: '#b91c1c',
}

export const PAGE_SIZE = 20

export const TABS = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  SENSITIVE: 'sensitive',
}

export const TAB_LABEL = {
  [TABS.PENDING]: '待审核',
  [TABS.REVIEWED]: '已审核',
  [TABS.SENSITIVE]: '敏感词库',
}

const FIXED_BASE_TIME = 1700000000000
const DAY_MS = 86400000

const MOCK_USERS = [
  '小明同学', '爱旅行的猫', '代码搬运工', '深夜食堂', '云淡风轻',
  '星空漫步者', '咖啡不加糖', '书虫一枚', '运动达人', '美食猎手',
  '数码爱好者', '文艺青年', '佛系青年', '追梦人', '阳光灿烂',
  '月下独酌', '江南烟雨', '北极星光', '春暖花开', '秋水共长天',
]

const MOCK_ARTICLES = [
  '2024年前端技术趋势深度解析',
  'React 19 新特性完全指南',
  '如何构建高性能的 Web 应用',
  'TypeScript 高级类型体操实战',
  '从 0 到 1 搭建企业级组件库',
  '微前端架构设计与实践',
  '前端工程化最佳实践总结',
  'Node.js 性能优化技巧',
  'CSS 新特性一览：Container Queries',
  '深入浅出理解前端框架原理',
]

const NORMAL_COMMENTS = [
  '这篇文章写得很好，学到了很多！',
  '感谢分享，对我帮助很大。',
  '作者说得很有道理，支持一下。',
  '收藏了，慢慢看。',
  '这个思路很新颖，受教了。',
  '期待作者更多的分享。',
  '写得真详细，辛苦了！',
  '我也是这么想的，英雄所见略同。',
  '文章质量很高，受益匪浅。',
  '实践了一下，确实有效！',
  '请问作者这个方案在生产环境用过吗？',
  '跟着教程一步步做的，成功了！',
  '终于找到一篇讲清楚的文章了。',
  '建议增加一些实际案例会更好。',
  '作为初学者表示看懂了，谢谢！',
]

const SENSITIVE_COMMENTS = [
  { text: '这篇文章写得太差了，作者是个傻子！', words: ['傻子'] },
  { text: '加我微信 buycheap123 购买低价商品，绝对靠谱广告推广', words: ['广告推广', 'buycheap'] },
  { text: '转发抽奖，转发抽奖，转发抽奖，大家快来参与', words: ['转发抽奖'] },
  { text: '某些色情内容网站链接，点击查看更多', words: ['色情'] },
  { text: '这家公司就是骗子，大家千万别上当，诈骗！', words: ['骗子', '诈骗'] },
  { text: '私信我获取内部消息，稳赚不赔的投资渠道', words: ['稳赚不赔', '投资渠道'] },
  { text: '楼主你这个傻逼，懂不懂技术啊就在这瞎逼逼', words: ['傻逼', '瞎逼逼'] },
  { text: '需要兼职刷单的联系我，日赚500不是梦，点击链接', words: ['兼职刷单', '日赚'] },
]

export const MOCK_SENSITIVE_WORDS = [
  { id: 'sw_001', word: '傻子', level: SENSITIVE_LEVEL.MEDIUM, createdAt: FIXED_BASE_TIME - DAY_MS * 10 },
  { id: 'sw_002', word: '广告推广', level: SENSITIVE_LEVEL.LOW, createdAt: FIXED_BASE_TIME - DAY_MS * 9 },
  { id: 'sw_003', word: '转发抽奖', level: SENSITIVE_LEVEL.LOW, createdAt: FIXED_BASE_TIME - DAY_MS * 8 },
  { id: 'sw_004', word: '色情', level: SENSITIVE_LEVEL.HIGH, createdAt: FIXED_BASE_TIME - DAY_MS * 7 },
  { id: 'sw_005', word: '骗子', level: SENSITIVE_LEVEL.MEDIUM, createdAt: FIXED_BASE_TIME - DAY_MS * 6 },
  { id: 'sw_006', word: '诈骗', level: SENSITIVE_LEVEL.HIGH, createdAt: FIXED_BASE_TIME - DAY_MS * 5 },
  { id: 'sw_007', word: '稳赚不赔', level: SENSITIVE_LEVEL.MEDIUM, createdAt: FIXED_BASE_TIME - DAY_MS * 4 },
  { id: 'sw_008', word: '投资渠道', level: SENSITIVE_LEVEL.MEDIUM, createdAt: FIXED_BASE_TIME - DAY_MS * 3 },
  { id: 'sw_009', word: '傻逼', level: SENSITIVE_LEVEL.HIGH, createdAt: FIXED_BASE_TIME - DAY_MS * 2 },
  { id: 'sw_010', word: '瞎逼逼', level: SENSITIVE_LEVEL.HIGH, createdAt: FIXED_BASE_TIME - DAY_MS * 2 },
  { id: 'sw_011', word: '兼职刷单', level: SENSITIVE_LEVEL.MEDIUM, createdAt: FIXED_BASE_TIME - DAY_MS * 1 },
  { id: 'sw_012', word: '日赚', level: SENSITIVE_LEVEL.LOW, createdAt: FIXED_BASE_TIME - DAY_MS * 1 },
  { id: 'sw_013', word: 'buycheap', level: SENSITIVE_LEVEL.LOW, createdAt: FIXED_BASE_TIME },
]

function generateMockComments() {
  const comments = []
  let idx = 1

  NORMAL_COMMENTS.forEach((text, i) => {
    comments.push({
      id: `cmt_${String(idx).padStart(3, '0')}`,
      content: text,
      username: MOCK_USERS[i % MOCK_USERS.length],
      articleTitle: MOCK_ARTICLES[i % MOCK_ARTICLES.length],
      status: COMMENT_STATUS.PENDING,
      createdAt: FIXED_BASE_TIME - DAY_MS * (i + 1) - Math.floor(Math.random() * 10000000),
      reviewedAt: null,
      rejectReason: null,
      rejectReasonDetail: null,
    })
    idx++
  })

  SENSITIVE_COMMENTS.forEach((item, i) => {
    comments.push({
      id: `cmt_${String(idx).padStart(3, '0')}`,
      content: item.text,
      username: MOCK_USERS[(i + 10) % MOCK_USERS.length],
      articleTitle: MOCK_ARTICLES[(i + 3) % MOCK_ARTICLES.length],
      status: COMMENT_STATUS.PENDING,
      createdAt: FIXED_BASE_TIME - DAY_MS * i - Math.floor(Math.random() * 10000000),
      reviewedAt: null,
      rejectReason: null,
      rejectReasonDetail: null,
    })
    idx++
  })

  for (let i = 0; i < 35; i++) {
    comments.push({
      id: `cmt_${String(idx).padStart(3, '0')}`,
      content: NORMAL_COMMENTS[i % NORMAL_COMMENTS.length] + '（自动生成）',
      username: MOCK_USERS[i % MOCK_USERS.length],
      articleTitle: MOCK_ARTICLES[i % MOCK_ARTICLES.length],
      status: COMMENT_STATUS.PENDING,
      createdAt: FIXED_BASE_TIME - DAY_MS * 20 - i * 3600000,
      reviewedAt: null,
      rejectReason: null,
      rejectReasonDetail: null,
    })
    idx++
  }

  const reviewedApproved = [
    { idx: 50, reason: null },
    { idx: 51, reason: null },
    { idx: 52, reason: null },
  ]
  reviewedApproved.forEach((item, i) => {
    comments.push({
      id: `cmt_${String(item.idx).padStart(3, '0')}`,
      content: NORMAL_COMMENTS[i % NORMAL_COMMENTS.length] + '（已审核通过）',
      username: MOCK_USERS[i % MOCK_USERS.length],
      articleTitle: MOCK_ARTICLES[i % MOCK_ARTICLES.length],
      status: COMMENT_STATUS.APPROVED,
      createdAt: FIXED_BASE_TIME - DAY_MS * 25 - i * 3600000,
      reviewedAt: FIXED_BASE_TIME - DAY_MS * 24 - i * 3600000,
      rejectReason: null,
      rejectReasonDetail: null,
    })
  })

  const reviewedRejected = [
    { idx: 53, reason: 'ad', detail: '包含推广链接' },
    { idx: 54, reason: 'attack', detail: null },
    { idx: 55, reason: 'other', detail: '内容违反社区规范' },
  ]
  reviewedRejected.forEach((item, i) => {
    comments.push({
      id: `cmt_${String(item.idx).padStart(3, '0')}`,
      content: SENSITIVE_COMMENTS[i % SENSITIVE_COMMENTS.length].text + '（已驳回）',
      username: MOCK_USERS[(i + 5) % MOCK_USERS.length],
      articleTitle: MOCK_ARTICLES[(i + 5) % MOCK_ARTICLES.length],
      status: COMMENT_STATUS.REJECTED,
      createdAt: FIXED_BASE_TIME - DAY_MS * 26 - i * 3600000,
      reviewedAt: FIXED_BASE_TIME - DAY_MS * 25 - i * 3600000,
      rejectReason: item.reason,
      rejectReasonDetail: item.detail,
    })
  })

  return comments
}

export const MOCK_COMMENTS = generateMockComments()
