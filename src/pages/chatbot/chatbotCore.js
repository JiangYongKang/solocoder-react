export const FAQ_PAIRS = [
  {
    keywords: ['你好', '您好', 'hi', 'hello', '在吗', '有人吗', '早上好', '下午好', '晚上好'],
    category: 'greeting',
    answer: '您好！我是智能客服助手，很高兴为您服务。请问有什么可以帮您的？',
  },
  {
    keywords: ['产品', '商品', '介绍', '有什么产品', '卖什么'],
    category: 'product',
    answer: '我们平台提供多种优质产品，包括电子产品、家居用品、服饰配件等。您可以在我们的官网浏览全部商品。请问您对哪类产品感兴趣呢？',
  },
  {
    keywords: ['价格', '多少钱', '价格表', '报价', '优惠', '折扣', '便宜'],
    category: 'price',
    answer: '我们的产品价格从几十元到几千元不等，经常有促销活动。具体价格请以商品详情页为准。新用户注册可享首单9折优惠哦！',
  },
  {
    keywords: ['售后', '维修', '保修', '质保', '三包'],
    category: 'after-sales',
    answer: '我们提供完善的售后服务：所有商品均享受7天无理由退换，一年质保服务。如需售后请联系客服提交申请，我们会在24小时内处理。',
  },
  {
    keywords: ['退款', '退货', '退钱', '怎么退', '退款流程'],
    category: 'refund',
    answer: '退款流程如下：1. 在订单详情页提交退款申请；2. 客服审核通过后将发送退货地址；3. 您寄出商品并填写快递单号；4. 商家收到商品确认无误后，款项将在1-3个工作日原路退回。',
  },
  {
    keywords: ['物流', '快递', '发货', '配送', '多久到', '几天到'],
    category: 'logistics',
    answer: '我们一般在下单后24小时内发货（节假日顺延），使用顺丰/圆通快递。江浙沪1-2天送达，其他地区3-5天送达。您可以在订单详情页实时查看物流信息。',
  },
  {
    keywords: ['工作时间', '营业时间', '几点上班', '几点下班', '服务时间'],
    category: 'hours',
    answer: '我们的客服工作时间是：周一至周日 9:00-22:00，节假日正常值班。您也可以随时留言，我们会在第一时间回复您。',
  },
  {
    keywords: ['电话', '联系方式', '联系客服', '怎么联系', '客服电话'],
    category: 'contact',
    answer: '您可以通过以下方式联系我们：客服热线 400-123-4567（9:00-22:00），邮箱 service@example.com，或直接在当前页面输入「人工」转接在线客服。',
  },
  {
    keywords: ['订单', '查订单', '我的订单', '订单号'],
    category: 'order',
    answer: '您可以在「我的订单」页面查看所有订单记录，点击订单详情可查看物流信息、申请售后等操作。如有订单问题请提供订单号以便查询。',
  },
  {
    keywords: ['支付', '付款', '怎么付款', '支付方式', '支付宝', '微信'],
    category: 'payment',
    answer: '我们支持多种支付方式：支付宝、微信支付、银联卡、信用卡等。支付过程安全加密，请放心使用。如遇支付问题请尝试刷新页面或更换支付方式。',
  },
  {
    keywords: ['发票', '开发票', '电子发票', '增值税'],
    category: 'invoice',
    answer: '我们支持开具电子发票和增值税专用发票。下单时可在备注中填写发票抬头和税号，电子发票将在发货后3个工作日内发送至您的邮箱。',
  },
  {
    keywords: ['会员', '积分', 'vip', '会员等级'],
    category: 'vip',
    answer: '注册即成为普通会员，消费累计积分可升级为银卡、金卡、钻石会员。会员享受专属折扣、积分兑换、生日礼包等福利，钻石会员还可享受免运费特权。',
  },
  {
    keywords: ['优惠券', '代金券', '红包', '优惠码', '满减'],
    category: 'coupon',
    answer: '优惠券使用方法：在购物车或结算页面输入优惠码或选择可用优惠券即可享受折扣。优惠券有使用期限和使用条件，请在有效期内使用。关注我们的活动可领取更多优惠券！',
  },
  {
    keywords: ['地址', '改地址', '修改地址', '收货地址'],
    category: 'address',
    answer: '下单前可在「收货地址」管理页面添加或修改收货地址。订单发货前可联系客服修改地址，发货后无法修改请见谅。',
  },
  {
    keywords: ['谢谢', '感谢', 'thx', 'thanks'],
    category: 'thanks',
    answer: '不客气！感谢您的咨询，祝您购物愉快！如有其他问题随时欢迎您。',
  },
  {
    keywords: ['人工', '人工客服', '真人', '转人工', '接人工'],
    category: 'human',
    answer: '正在为您转接人工客服...',
  },
]

export const DEFAULT_QUICK_OPTIONS = [
  { id: 'price', label: '产品价格', question: '你们的产品价格是多少？' },
  { id: 'refund', label: '退款流程', question: '退款流程是什么？' },
  { id: 'logistics', label: '物流查询', question: '物流多久能到？' },
  { id: 'contact', label: '联系客服', question: '怎么联系你们？' },
  { id: 'after-sales', label: '售后服务', question: '售后政策是什么？' },
  { id: 'hours', label: '工作时间', question: '你们的工作时间是什么时候？' },
]

export const REFERENCE_KEYWORDS = ['上一个', '上上个', '上上', '刚才', '之前', '那个', '以上', '这个', '前边', '前两个', '两个之前']

export function matchFAQ(userMessage, faqList = FAQ_PAIRS) {
  if (!userMessage || typeof userMessage !== 'string') {
    return null
  }
  const normalized = userMessage.toLowerCase().trim()
  let bestMatch = null
  let maxHits = 0
  for (const item of faqList) {
    let hits = 0
    for (const keyword of item.keywords) {
      const kw = keyword.toLowerCase()
      if (normalized.includes(kw)) {
        hits += 1
      }
    }
    if (hits > maxHits || (hits > 0 && hits === maxHits)) {
      maxHits = hits
      bestMatch = item
    }
  }
  return maxHits > 0 ? bestMatch : null
}

export function createContextCache(maxPairs = 5) {
  const pairs = []
  return {
    add(userMsg, botMsg, botCategory) {
      pairs.push({
        user: userMsg,
        bot: botMsg,
        category: botCategory || null,
        timestamp: Date.now(),
      })
      while (pairs.length > maxPairs) {
        pairs.shift()
      }
    },
    getAll() {
      return pairs.map((p) => ({ ...p }))
    },
    getLatest() {
      return pairs.length > 0 ? { ...pairs[pairs.length - 1] } : null
    },
    findByCategory(category) {
      if (!category) return null
      for (let i = pairs.length - 1; i >= 0; i--) {
        if (pairs[i].category === category) {
          return { ...pairs[i] }
        }
      }
      return null
    },
    getByIndexFromEnd(n) {
      if (n < 0 || n >= pairs.length) return null
      return { ...pairs[pairs.length - 1 - n] }
    },
    size() {
      return pairs.length
    },
    clear() {
      pairs.length = 0
    },
    maxPairs,
  }
}

export function isReferenceExpression(userMessage, refKeywords = REFERENCE_KEYWORDS) {
  if (!userMessage || typeof userMessage !== 'string') {
    return false
  }
  const normalized = userMessage.trim()
  for (const kw of refKeywords) {
    if (normalized.includes(kw)) {
      return true
    }
  }
  return false
}

export function resolveReference(userMessage, contextCache) {
  if (!isReferenceExpression(userMessage)) {
    return null
  }
  const latest = contextCache.getLatest()
  if (!latest) {
    return null
  }
  const msg = userMessage.trim()
  if (msg.includes('上上个') || msg.includes('前两个') || msg.includes('两个之前') || msg.includes('上上')) {
    const twoAgo = contextCache.getByIndexFromEnd(1)
    if (twoAgo) {
      return {
        type: 'repeat',
        pair: twoAgo,
      }
    }
  }
  return {
    type: 'repeat',
    pair: latest,
  }
}

export function generateBotReply(userMessage, contextCache, faqList = FAQ_PAIRS) {
  if (!userMessage || typeof userMessage !== 'string') {
    return {
      type: 'unknown',
      answer: '抱歉，我暂时无法回答这个问题，请输入「人工」转接人工客服，或尝试换个方式描述您的问题。',
      category: null,
    }
  }
  const ref = resolveReference(userMessage, contextCache)
  if (ref && ref.pair) {
    return {
      type: 'context',
      answer: `您之前询问的是：「${ref.pair.user}」\n我的回复是：${ref.pair.bot}`,
      category: ref.pair.category,
      contextPair: ref.pair,
    }
  }
  const matched = matchFAQ(userMessage, faqList)
  if (matched) {
    return {
      type: 'matched',
      answer: matched.answer,
      category: matched.category,
      matchedFAQ: matched,
    }
  }
  return {
    type: 'unknown',
    answer: '抱歉，我暂时无法回答这个问题，请输入「人工」转接人工客服，或尝试换个方式描述您的问题。',
    category: null,
  }
}

export function formatTimestamp(ts) {
  const date = new Date(ts)
  const y = date.getFullYear()
  const mo = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${y}-${mo}-${d} ${h}:${mi}:${s}`
}

export function exportChatToTxt(messages, sessionName = '智能助手') {
  if (!Array.isArray(messages)) {
    return ''
  }
  const lines = [`===== 聊天记录：${sessionName} =====`, `导出时间：${formatTimestamp(Date.now())}`, '']
  for (const msg of messages) {
    const role = msg.sender === 'user' ? '用户' : '机器人'
    const time = formatTimestamp(msg.timestamp || Date.now())
    lines.push(`[${time}] ${role}：${msg.content || ''}`)
  }
  return lines.join('\n')
}

export function downloadTxtFile(content, filename) {
  if (typeof document === 'undefined') {
    return false
  }
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 100)
  return true
}

export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function createMessage(content, sender = 'user') {
  return {
    id: generateId('msg'),
    sender,
    content,
    timestamp: Date.now(),
  }
}

export function truncatePreview(text, maxLen = 30) {
  if (!text) return ''
  const t = String(text)
  return t.length > maxLen ? t.slice(0, maxLen) + '...' : t
}

export function createNewSession(name = '新会话') {
  const now = Date.now()
  const sessionId = generateId('session')
  return {
    id: sessionId,
    name,
    messages: [
      {
        id: generateId('msg'),
        sender: 'bot',
        content: '您好！我是智能客服助手，很高兴为您服务。请问有什么可以帮您的？',
        timestamp: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
    isHuman: false,
  }
}

export function parseQuickOptions(jsonString, fallback = DEFAULT_QUICK_OPTIONS) {
  if (!jsonString) {
    return [...fallback]
  }
  try {
    const parsed = JSON.parse(jsonString)
    if (!Array.isArray(parsed)) {
      return [...fallback]
    }
    const valid = parsed.filter(
      (item) =>
        item &&
        typeof item.label === 'string' &&
        typeof item.question === 'string' &&
        item.label.trim() !== '' &&
        item.question.trim() !== ''
    )
    return valid.length > 0 ? valid : [...fallback]
  } catch {
    return [...fallback]
  }
}

export function serializeQuickOptions(options) {
  if (!Array.isArray(options)) {
    return JSON.stringify(DEFAULT_QUICK_OPTIONS)
  }
  return JSON.stringify(options)
}
