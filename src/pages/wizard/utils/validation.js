export function validateName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, message: '请输入姓名' }
  }
  const trimmed = name.trim()
  if (trimmed.length < 2 || trimmed.length > 20) {
    return { valid: false, message: '姓名需要 2-20 个字符' }
  }
  return { valid: true, message: '' }
}

export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, message: '请输入邮箱' }
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.trim())) {
    return { valid: false, message: '邮箱格式不正确' }
  }
  return { valid: true, message: '' }
}

export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, message: '请输入手机号' }
  }
  const phoneRegex = /^\d{11}$/
  if (!phoneRegex.test(phone.trim())) {
    return { valid: false, message: '手机号必须为 11 位数字' }
  }
  return { valid: true, message: '' }
}

export function validateProvince(province) {
  if (!province || typeof province !== 'string' || !province.trim()) {
    return { valid: false, message: '请选择省份' }
  }
  return { valid: true, message: '' }
}

export function validateCity(city) {
  if (!city || typeof city !== 'string' || !city.trim()) {
    return { valid: false, message: '请选择城市' }
  }
  return { valid: true, message: '' }
}

export function validateAddress(address) {
  if (!address || typeof address !== 'string') {
    return { valid: false, message: '请输入详细地址' }
  }
  const trimmed = address.trim()
  if (trimmed.length === 0) {
    return { valid: false, message: '请输入详细地址' }
  }
  if (trimmed.length > 200) {
    return { valid: false, message: '详细地址不能超过 200 个字符' }
  }
  return { valid: true, message: '' }
}

export function validateInterests(interests) {
  if (!Array.isArray(interests) || interests.length === 0) {
    return { valid: false, message: '请至少选择一个感兴趣的领域' }
  }
  return { valid: true, message: '' }
}

export function validateNotification(method) {
  if (!method || typeof method !== 'string' || !method.trim()) {
    return { valid: false, message: '请选择接收通知方式' }
  }
  return { valid: true, message: '' }
}

export function validateFrequency(frequency) {
  if (!frequency || typeof frequency !== 'string' || !frequency.trim()) {
    return { valid: false, message: '请选择使用频率' }
  }
  return { valid: true, message: '' }
}

export function validateStep1(data) {
  const errors = {}
  const nameResult = validateName(data.name)
  if (!nameResult.valid) errors.name = nameResult.message

  const emailResult = validateEmail(data.email)
  if (!emailResult.valid) errors.email = emailResult.message

  const phoneResult = validatePhone(data.phone)
  if (!phoneResult.valid) errors.phone = phoneResult.message

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

export function validateStep2(data) {
  const errors = {}
  const provinceResult = validateProvince(data.province)
  if (!provinceResult.valid) errors.province = provinceResult.message

  const cityResult = validateCity(data.city)
  if (!cityResult.valid) errors.city = cityResult.message

  const addressResult = validateAddress(data.address)
  if (!addressResult.valid) errors.address = addressResult.message

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

export function validateStep3(data) {
  const errors = {}
  const interestsResult = validateInterests(data.interests)
  if (!interestsResult.valid) errors.interests = interestsResult.message

  const notificationResult = validateNotification(data.notification)
  if (!notificationResult.valid) errors.notification = notificationResult.message

  const frequencyResult = validateFrequency(data.frequency)
  if (!frequencyResult.valid) errors.frequency = frequencyResult.message

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

export function validateStep(stepIndex, data) {
  switch (stepIndex) {
    case 0:
      return validateStep1(data)
    case 1:
      return validateStep2(data)
    case 2:
      return validateStep3(data)
    default:
      return { valid: true, errors: {} }
  }
}
