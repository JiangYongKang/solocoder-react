import { DEFAULT_AVATAR } from './constants'

const mockUsers = [
  { id: 'user_001', name: '小明同学', avatar: DEFAULT_AVATAR },
  { id: 'user_002', name: '旅行爱好者', avatar: DEFAULT_AVATAR },
  { id: 'user_003', name: '美食探店', avatar: DEFAULT_AVATAR },
  { id: 'user_004', name: '科技达人', avatar: DEFAULT_AVATAR },
  { id: 'user_005', name: '摄影师老李', avatar: DEFAULT_AVATAR },
]

function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function createMockPosts() {
  const now = Date.now()
  const posts = []

  const postTexts = [
    '今天天气真好，出门散步了一圈，心情舒畅！#生活 #日常',
    '刚刚看完《星际穿越》，感觉人类对宇宙的探索永无止境。#电影 #科幻',
    '分享一道家常菜的做法，红烧肉的秘诀就是小火慢炖！#美食 #菜谱',
    '新入手的相机拍出来的效果真不错，给大家看看样片。#摄影 #器材',
    '周末去了趟郊外的小村庄，远离城市的喧嚣，太治愈了。#旅行 #周末',
    '今天学习了 React 的新特性，感觉前端技术发展真快啊！#编程 #前端',
    '健身打卡第30天，坚持就是胜利！💪 #健身 #自律',
    '推荐一本最近在读的书《人类简史》，非常值得一看。#读书 #推荐',
    '公司团建活动完美结束，感谢每一位同事的付出！#工作 #团队',
    '尝试了一家新开的咖啡店，环境超棒，咖啡也很香。#探店 #咖啡',
    '今年的第一场雪，来得有点突然，但是好美啊！#冬天 #雪景',
    '把家里重新布置了一下，换个环境换个心情～ #生活 #家居',
    '最近在研究人工智能，感觉这个领域充满了无限可能。#AI #科技',
    '和朋友一起去爬山，登顶的那一刻所有的疲惫都值得了。#户外 #运动',
    '分享一些实用的时间管理技巧，希望对大家有帮助。#效率 #方法',
  ]

  for (let i = 0; i < 25; i++) {
    const user = mockUsers[i % mockUsers.length]
    const text = postTexts[i % postTexts.length]
    const createdAt = now - i * 6 * 60 * 60 * 1000 - rnd(0, 2 * 60 * 60 * 1000)
    const likeCount = rnd(0, 150)
    const commentCount = rnd(0, 30)
    const repostCount = rnd(0, 20)
    const hasImages = i % 3 === 0

    const comments = []
    for (let c = 0; c < Math.min(commentCount, 5); c++) {
      const commentUser = mockUsers[(i + c + 1) % mockUsers.length]
      comments.push({
        id: `comment_${i}_${c}`,
        userId: commentUser.id,
        userName: commentUser.name,
        userAvatar: commentUser.avatar,
        content: `评论内容 ${c + 1}：说得太好了！`,
        createdAt: createdAt + (c + 1) * 30 * 60 * 1000,
        replies: [],
      })
    }

    posts.push({
      id: `post_${i}`,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      content: text,
      images: hasImages
        ? [
            `https://picsum.photos/seed/${i}a/400/400`,
            `https://picsum.photos/seed/${i}b/400/400`,
            `https://picsum.photos/seed/${i}c/400/400`,
          ].slice(0, rnd(1, 3))
        : [],
      topics: extractTopics(text),
      createdAt,
      likeCount,
      commentCount,
      repostCount,
      comments,
      repostOf: null,
    })
  }

  return posts
}

export function createMockFollows() {
  return ['user_001', 'user_003']
}

export function createMockLikes() {
  return ['post_0', 'post_2', 'post_5']
}

export function extractTopics(text) {
  if (!text) return []
  const regex = /#([^\s#]+)/g
  const matches = text.match(regex) || []
  return matches.map((t) => t.slice(1))
}
