import { QUESTION_TYPES } from './constants.js'

const MOCK_SINGLE_OPTIONS = [
  [
    { label: '非常满意', value: 'v_satisfied' },
    { label: '满意', value: 'satisfied' },
    { label: '一般', value: 'neutral' },
    { label: '不满意', value: 'unsatisfied' },
    { label: '非常不满意', value: 'v_unsatisfied' },
  ],
  [
    { label: '18岁以下', value: 'lt18' },
    { label: '18-25岁', value: '18_25' },
    { label: '26-35岁', value: '26_35' },
    { label: '36-45岁', value: '36_45' },
    { label: '46岁以上', value: 'gt46' },
  ],
  [
    { label: '手机', value: 'mobile' },
    { label: '电脑', value: 'pc' },
    { label: '平板', value: 'tablet' },
  ],
  [
    { label: '是', value: 'yes' },
    { label: '否', value: 'no' },
  ],
  [
    { label: '每天', value: 'daily' },
    { label: '每周几次', value: 'weekly' },
    { label: '每月几次', value: 'monthly' },
    { label: '很少', value: 'rarely' },
  ],
  [
    { label: '朋友推荐', value: 'friend' },
    { label: '网络搜索', value: 'search' },
    { label: '社交媒体', value: 'social' },
    { label: '广告', value: 'ad' },
    { label: '其他', value: 'other' },
  ],
  [
    { label: '100元以下', value: 'lt100' },
    { label: '100-500元', value: '100_500' },
    { label: '500-1000元', value: '500_1000' },
    { label: '1000元以上', value: 'gt1000' },
  ],
  [
    { label: '本科及以上', value: 'bachelor' },
    { label: '大专', value: 'college' },
    { label: '高中/中专', value: 'high' },
    { label: '初中及以下', value: 'junior' },
  ],
]

const MOCK_MULTIPLE_OPTIONS = [
  [
    { label: '价格优惠', value: 'price' },
    { label: '品牌知名度', value: 'brand' },
    { label: '产品质量', value: 'quality' },
    { label: '售后服务', value: 'service' },
    { label: '外观设计', value: 'design' },
    { label: '朋友推荐', value: 'recommend' },
  ],
  [
    { label: '微信', value: 'wechat' },
    { label: '微博', value: 'weibo' },
    { label: '抖音', value: 'douyin' },
    { label: '小红书', value: 'xhs' },
    { label: 'B站', value: 'bilibili' },
    { label: '知乎', value: 'zhihu' },
  ],
  [
    { label: '功能完善', value: 'feature' },
    { label: '操作简单', value: 'easy' },
    { label: '界面美观', value: 'ui' },
    { label: '响应速度快', value: 'fast' },
    { label: '数据安全', value: 'security' },
  ],
  [
    { label: '咨询问题', value: 'consult' },
    { label: '购买商品', value: 'buy' },
    { label: '了解活动', value: 'activity' },
    { label: '售后服务', value: 'aftersale' },
    { label: '投诉建议', value: 'complaint' },
  ],
]

const MOCK_TEXT_TOPICS = [
  '您对我们产品有什么改进建议？',
  '您最希望我们增加哪些功能？',
  '请描述一下您的使用体验',
  '您认为我们的服务哪些方面需要提升？',
]

const MOCK_TEXT_SAMPLES = [
  '整体使用体验很好，希望能继续保持',
  '界面设计很美观，操作也很流畅',
  '客服响应速度很快，问题解决及时',
  '价格合理，质量不错，值得推荐',
  '功能很完善，满足了我的需求',
  '希望能增加更多自定义选项',
  '偶尔会有卡顿的情况，需要优化',
  '文档说明不够详细，建议补充',
  '移动端适配可以做得更好',
  '数据同步功能有时候会出问题',
  '总体满意，希望能继续改进',
  '性价比很高，会继续使用',
  '朋友推荐来的，果然没失望',
  '售后服务态度很好，点赞',
  '希望能出更多新功能',
  '使用起来非常顺手',
  '界面简洁明了，容易上手',
  '加载速度很快，体验不错',
  '希望增加深色模式',
  '建议增加快捷键操作',
]

const MOCK_SURVEY_TITLE = '用户满意度调查问卷'
const MOCK_SURVEY_DESC = '感谢您抽出宝贵时间参与本次调查，您的反馈对我们非常重要！'

function createMockQuestions() {
  const questions = []

  MOCK_SINGLE_OPTIONS.forEach((options, i) => {
    questions.push({
      id: `q_single_${i + 1}`,
      type: QUESTION_TYPES.SINGLE,
      title: [
        '您对我们产品的整体满意度如何？',
        '请问您的年龄段是？',
        '您主要使用什么设备访问？',
        '您是首次使用我们的产品吗？',
        '您使用我们产品的频率是？',
        '您是通过什么渠道了解到我们的？',
        '您每月在我们平台的消费金额？',
        '您的最高学历是？',
      ][i],
      required: true,
      options,
    })
  })

  MOCK_MULTIPLE_OPTIONS.forEach((options, i) => {
    questions.push({
      id: `q_multi_${i + 1}`,
      type: QUESTION_TYPES.MULTIPLE,
      title: [
        '您选择我们产品的主要因素有哪些？（可多选）',
        '您平时常用的社交媒体有哪些？（可多选）',
        '您认为我们产品的优势在于？（可多选）',
        '您访问我们平台的主要目的是？（可多选）',
      ][i],
      required: true,
      options,
    })
  })

  MOCK_TEXT_TOPICS.forEach((title, i) => {
    questions.push({
      id: `q_text_${i + 1}`,
      type: QUESTION_TYPES.TEXT,
      title,
      required: false,
      placeholder: '请输入您的回答...',
    })
  })

  const ratingTitles = [
    '请为我们的产品质量打分',
    '请为我们的服务态度打分',
    '请为我们的响应速度打分',
    '请为我们的整体体验打分',
  ]
  ratingTitles.forEach((title, i) => {
    questions.push({
      id: `q_rating_${i + 1}`,
      type: QUESTION_TYPES.RATING,
      title,
      required: true,
      maxRating: 5,
    })
  })

  return questions
}

export function getMockSurvey() {
  return {
    id: 'mock_survey_001',
    title: MOCK_SURVEY_TITLE,
    description: MOCK_SURVEY_DESC,
    questions: createMockQuestions(),
  }
}

function weightedRandom(weights) {
  const total = weights.reduce((a, b) => a + b, 0)
  let rand = Math.random() * total
  for (let i = 0; i < weights.length; i++) {
    rand -= weights[i]
    if (rand <= 0) return i
  }
  return weights.length - 1
}

function generateSingleAnswer(options) {
  const weights = options.map((_, i) => Math.max(1, options.length - i) + Math.random() * 5)
  return options[weightedRandom(weights)].value
}

function generateMultipleAnswer(options) {
  const result = []
  const minCount = Math.max(1, Math.floor(options.length * 0.3))
  const maxCount = Math.floor(options.length * 0.7)
  const targetCount = minCount + Math.floor(Math.random() * (maxCount - minCount + 1))
  const shuffled = [...options].sort(() => Math.random() - 0.5)
  for (let i = 0; i < targetCount && i < shuffled.length; i++) {
    result.push(shuffled[i].value)
  }
  return result
}

function generateTextAnswer() {
  if (Math.random() < 0.25) return ''
  const idx = Math.floor(Math.random() * MOCK_TEXT_SAMPLES.length)
  if (Math.random() < 0.2) {
    return MOCK_TEXT_SAMPLES[idx] + '。' + MOCK_TEXT_SAMPLES[(idx + 3) % MOCK_TEXT_SAMPLES.length]
  }
  return MOCK_TEXT_SAMPLES[idx]
}

function generateRatingAnswer(maxRating = 5) {
  const weights = []
  for (let i = 1; i <= maxRating; i++) {
    if (i <= 2) weights.push(1)
    else if (i === 3) weights.push(3)
    else if (i === 4) weights.push(6)
    else weights.push(4)
  }
  return weightedRandom(weights) + 1
}

function generateDuration() {
  const bucketWeights = [10, 20, 30, 25, 10, 5]
  const bucketIdx = weightedRandom(bucketWeights)
  const buckets = [
    [10, 30],
    [35, 60],
    [65, 120],
    [130, 300],
    [310, 600],
    [620, 1800],
  ]
  const [min, max] = buckets[bucketIdx]
  return Math.floor(min + Math.random() * (max - min))
}

export function generateMockResponses(questions, count = 150) {
  const responses = []
  const now = Date.now()
  const dayMs = 86400000

  for (let i = 0; i < count; i++) {
    const answers = {}
    questions.forEach((q) => {
      switch (q.type) {
        case QUESTION_TYPES.SINGLE:
          answers[q.id] = generateSingleAnswer(q.options)
          break
        case QUESTION_TYPES.MULTIPLE:
          answers[q.id] = generateMultipleAnswer(q.options)
          break
        case QUESTION_TYPES.TEXT:
          answers[q.id] = generateTextAnswer()
          break
        case QUESTION_TYPES.RATING:
          answers[q.id] = generateRatingAnswer(q.maxRating)
          break
        default:
          break
      }
    })

    const submittedAt = now - Math.floor(Math.random() * 30 * dayMs)

    responses.push({
      id: `resp_${i + 1}`,
      answers,
      submittedAt,
      duration: generateDuration(),
    })
  }

  return responses.sort((a, b) => a.submittedAt - b.submittedAt)
}
