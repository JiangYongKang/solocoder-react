export const STORAGE_KEY = 'signature-pad-history'

export const PRESET_COLORS = [
  '#000000',
  '#e53935',
  '#1e88e5',
  '#43a047',
  '#8e24aa',
  '#fb8c00',
  '#424242',
  '#03a9f4',
]

export const DEFAULT_COLOR = '#000000'

export const DEFAULT_LINE_WIDTH = 3
export const MIN_LINE_WIDTH = 1
export const MAX_LINE_WIDTH = 20

export const DEFAULT_SMOOTHING = 5
export const MIN_SMOOTHING = 0
export const MAX_SMOOTHING = 10

export const CANVAS_MIN_WIDTH = 600
export const CANVAS_MIN_HEIGHT = 300

export const HISTORY_MAX_ITEMS = 20

export const THUMBNAIL_WIDTH = 120
export const THUMBNAIL_HEIGHT = 60

export const TEMPLATE_TYPES = {
  NONE: 'none',
  CONTRACT: 'contract',
  AUTHORIZATION: 'authorization',
  CONFIRMATION: 'confirmation',
  CUSTOM: 'custom',
}

export const TEMPLATES = [
  {
    id: TEMPLATE_TYPES.CONTRACT,
    name: '合同签署页',
    content: `合同编号：HT-${Date.now().toString().slice(-6)}

甲方（委托方）：
名称：_____________________
地址：_____________________
联系电话：_________________
甲方签字：_________________
日期：___________


乙方（受托方）：
名称：_____________________
地址：_____________________
联系电话：_________________
乙方签字：_________________
日期：___________`,
    signaturePositions: [
      { id: 'party_a', label: '甲方签字', x: 60, y: 68 },
      { id: 'party_b', label: '乙方签字', x: 60, y: 88 },
    ],
  },
  {
    id: TEMPLATE_TYPES.AUTHORIZATION,
    name: '授权书',
    content: `授权委托书

本人/本公司特此授权：

授权方：___________________
身份证件号：_______________
联系电话：_________________

被授权方：_________________
身份证件号：_______________

授权事项：
授权方签字：_______________
日期：___________`,
    signaturePositions: [
      { id: 'authorizer', label: '授权方签字', x: 60, y: 80 },
    ],
  },
  {
    id: TEMPLATE_TYPES.CONFIRMATION,
    name: '确认函',
    content: `确认函

致：_____________________

本人已收到并确认以下内容：
1. ________________________________
2. ________________________________
3. ________________________________

确认人签字：_______________
日期：___________`,
    signaturePositions: [
      { id: 'confirmer', label: '确认人签字', x: 60, y: 82 },
    ],
  },
  {
    id: TEMPLATE_TYPES.CUSTOM,
    name: '自定义空白模板',
    content: `请在下方签署：



签字：___________________
日期：___________`,
    signaturePositions: [
      { id: 'custom', label: '签字', x: 60, y: 75 },
    ],
  },
]
