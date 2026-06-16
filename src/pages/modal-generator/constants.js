export const MODAL_TYPES = {
  CONFIRM: 'confirm',
  ALERT: 'alert',
  FORM: 'form',
  INFO: 'info',
}

export const MODAL_TYPE_LABELS = {
  [MODAL_TYPES.CONFIRM]: '确认弹窗',
  [MODAL_TYPES.ALERT]: '提示弹窗',
  [MODAL_TYPES.FORM]: '表单弹窗',
  [MODAL_TYPES.INFO]: '信息弹窗',
}

export const ANIMATION_TYPES = {
  FADE: 'fade',
  SLIDE_TOP: 'slideTop',
  SLIDE_BOTTOM: 'slideBottom',
  SCALE: 'scale',
  SLIDE_LEFT: 'slideLeft',
  SLIDE_RIGHT: 'slideRight',
}

export const ANIMATION_TYPE_LABELS = {
  [ANIMATION_TYPES.FADE]: '淡入',
  [ANIMATION_TYPES.SLIDE_TOP]: '从上方滑入',
  [ANIMATION_TYPES.SLIDE_BOTTOM]: '从下方滑入',
  [ANIMATION_TYPES.SCALE]: '缩放进入',
  [ANIMATION_TYPES.SLIDE_LEFT]: '从左侧滑入',
  [ANIMATION_TYPES.SLIDE_RIGHT]: '从右侧滑入',
}

export const ANIMATION_CLASS_MAP = {
  [ANIMATION_TYPES.FADE]: 'mg-modal-anim-fade',
  [ANIMATION_TYPES.SLIDE_TOP]: 'mg-modal-anim-slide-top',
  [ANIMATION_TYPES.SLIDE_BOTTOM]: 'mg-modal-anim-slide-bottom',
  [ANIMATION_TYPES.SCALE]: 'mg-modal-anim-scale',
  [ANIMATION_TYPES.SLIDE_LEFT]: 'mg-modal-anim-slide-left',
  [ANIMATION_TYPES.SLIDE_RIGHT]: 'mg-modal-anim-slide-right',
}

export const PRESET_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#64748b',
]

export const MIN_WIDTH = 300
export const MAX_WIDTH = 800
export const DEFAULT_WIDTH = 480

export const MIN_MASK_OPACITY = 0
export const MAX_MASK_OPACITY = 100
export const DEFAULT_MASK_OPACITY = 50

export const MIN_ANIMATION_DURATION = 100
export const MAX_ANIMATION_DURATION = 1000
export const DEFAULT_ANIMATION_DURATION = 300

export const MIN_FORM_FIELDS = 1
export const MAX_FORM_FIELDS = 5
export const DEFAULT_FORM_FIELDS = 2

export const DEFAULT_CONFIRM_TEXT = '确定'
export const DEFAULT_CANCEL_TEXT = '取消'
export const DEFAULT_TITLE = '弹窗标题'
export const DEFAULT_CONTENT = '这是弹窗的正文内容，可以放置提示信息或其他内容。'
