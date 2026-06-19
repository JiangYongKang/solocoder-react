export const STORAGE_KEY = 'sms_template_editor_data_v1'

export const TEMPLATE_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
}

export const TEMPLATE_STATUS_LABELS = {
  [TEMPLATE_STATUS.DRAFT]: '草稿',
  [TEMPLATE_STATUS.PENDING]: '待审核',
  [TEMPLATE_STATUS.APPROVED]: '已通过',
  [TEMPLATE_STATUS.REJECTED]: '已驳回',
}

export const TEMPLATE_STATUS_COLORS = {
  [TEMPLATE_STATUS.DRAFT]: '#909399',
  [TEMPLATE_STATUS.PENDING]: '#E6A23C',
  [TEMPLATE_STATUS.APPROVED]: '#67C23A',
  [TEMPLATE_STATUS.REJECTED]: '#F56C6C',
}

export const PRESET_GROUPS = [
  { id: 'group-verification', name: '验证码类', isPreset: true },
  { id: 'group-notification', name: '通知类', isPreset: true },
  { id: 'group-marketing', name: '营销类', isPreset: true },
  { id: 'group-payment', name: '催付类', isPreset: true },
  { id: 'group-custom', name: '自定义分组', isPreset: false },
]

export const PRESET_VARIABLES = [
  { name: '用户名', placeholder: '{用户名}', sampleValue: '张三', sampleLength: 2 },
  { name: '验证码', placeholder: '{验证码}', sampleValue: '123456', sampleLength: 6 },
  { name: '有效期', placeholder: '{有效期}', sampleValue: '5分钟', sampleLength: 3 },
  { name: '订单号', placeholder: '{订单号}', sampleValue: '20240101001', sampleLength: 11 },
  { name: '金额', placeholder: '{金额}', sampleValue: '99.99', sampleLength: 5 },
  { name: '时间', placeholder: '{时间}', sampleValue: '2024-01-01 12:00', sampleLength: 16 },
]

export const MAX_SMS_LENGTH = 500
export const SINGLE_SMS_THRESHOLD = 70
export const DEFAULT_SIGNATURE = '【XX平台】'
export const DEFAULT_SAMPLE_PHONE = '138****8888'
export const MAX_REJECT_REASON_LENGTH = 200
export const SUMMARY_MAX_LENGTH = 30

export const STATUS_TRANSITIONS = {
  [TEMPLATE_STATUS.DRAFT]: {
    canSubmit: true,
    canEdit: true,
    canDelete: true,
    canCreateRevision: false,
    canApprove: false,
    canReject: false,
  },
  [TEMPLATE_STATUS.PENDING]: {
    canSubmit: false,
    canEdit: false,
    canDelete: true,
    canCreateRevision: false,
    canApprove: true,
    canReject: true,
  },
  [TEMPLATE_STATUS.APPROVED]: {
    canSubmit: false,
    canEdit: false,
    canDelete: true,
    canCreateRevision: true,
    canApprove: false,
    canReject: false,
  },
  [TEMPLATE_STATUS.REJECTED]: {
    canSubmit: true,
    canEdit: true,
    canDelete: true,
    canCreateRevision: false,
    canApprove: false,
    canReject: false,
  },
}

export const getInitialState = () => ({
  groups: PRESET_GROUPS.map((g) => ({ ...g })),
  templates: [
    {
      id: 'tpl-1',
      title: '验证码短信模板',
      content: '尊敬的{用户名}，您的验证码为{验证码}，有效期{有效期}，请勿泄露。',
      groupId: 'group-verification',
      status: TEMPLATE_STATUS.APPROVED,
      signature: DEFAULT_SIGNATURE,
      variables: ['用户名', '验证码', '有效期'],
      variableSamples: {},
      rejectReason: '',
      createdAt: Date.now() - 86400000 * 7,
      updatedAt: Date.now() - 86400000 * 2,
      revisionOf: null,
      version: 1,
    },
    {
      id: 'tpl-2',
      title: '订单支付通知',
      content: '您好{用户名}，您的订单{订单号}支付成功，金额{金额}元，感谢您的购买！',
      groupId: 'group-notification',
      status: TEMPLATE_STATUS.PENDING,
      signature: DEFAULT_SIGNATURE,
      variables: ['用户名', '订单号', '金额'],
      variableSamples: {},
      rejectReason: '',
      createdAt: Date.now() - 86400000 * 3,
      updatedAt: Date.now() - 86400000 * 1,
      revisionOf: null,
      version: 1,
    },
    {
      id: 'tpl-3',
      title: '促销活动通知',
      content: '亲爱的{用户名}，我们在{时间}举办大型促销活动，全场低至5折，先到先得！',
      groupId: 'group-marketing',
      status: TEMPLATE_STATUS.DRAFT,
      signature: DEFAULT_SIGNATURE,
      variables: ['用户名', '时间'],
      variableSamples: {},
      rejectReason: '',
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 3600000,
      revisionOf: null,
      version: 1,
    },
  ],
})
