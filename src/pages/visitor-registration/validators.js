import { NAME_MIN_LENGTH, NAME_MAX_LENGTH, REASON_MAX_LENGTH, ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from './constants'

const PHONE_REGEX = /^1[3-9]\d{9}$/
const ID_CARD_REGEX = /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/

export function validateName(name) {
  if (!name || !name.trim()) {
    return '请输入访客姓名'
  }
  const trimmed = name.trim()
  if (trimmed.length < NAME_MIN_LENGTH) {
    return `姓名至少 ${NAME_MIN_LENGTH} 个字符`
  }
  if (trimmed.length > NAME_MAX_LENGTH) {
    return `姓名最多 ${NAME_MAX_LENGTH} 个字符`
  }
  return ''
}

export function validatePhone(phone) {
  if (!phone || !phone.trim()) {
    return '请输入手机号'
  }
  const trimmed = phone.trim()
  if (!PHONE_REGEX.test(trimmed)) {
    return '请输入有效的11位手机号'
  }
  return ''
}

export function validateIdCard(idCard) {
  if (!idCard || !idCard.trim()) {
    return '请输入身份证号'
  }
  const trimmed = idCard.trim()
  if (!ID_CARD_REGEX.test(trimmed)) {
    return '请输入有效的18位身份证号'
  }
  return ''
}

export function validateReason(reason) {
  if (!reason || !reason.trim()) {
    return '请输入访问事由'
  }
  const trimmed = reason.trim()
  if (trimmed.length > REASON_MAX_LENGTH) {
    return `访问事由最多 ${REASON_MAX_LENGTH} 字`
  }
  return ''
}

export function validateHost(host) {
  if (!host) {
    return '请选择被访人'
  }
  return ''
}

export function validateImageFile(file) {
  if (!file) return ''
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return '仅支持 JPG/PNG 格式'
  }
  if (file.size > MAX_FILE_SIZE) {
    return '图片大小不能超过 5MB'
  }
  return ''
}
