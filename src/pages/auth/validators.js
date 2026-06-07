const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const PASSWORD_HAS_LETTER = /[a-zA-Z]/
const PASSWORD_HAS_NUMBER = /\d/

export function validateEmail(email) {
  if (!email || !email.trim()) {
    return '请输入邮箱'
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return '邮箱格式不正确'
  }
  return ''
}

export function validateLoginPassword(password) {
  if (!password) {
    return '请输入密码'
  }
  if (password.length < 6) {
    return '密码长度不少于 6 位'
  }
  return ''
}

export function validateRegisterPassword(password) {
  if (!password) {
    return '请输入密码'
  }
  if (password.length < 6 || password.length > 20) {
    return '密码长度需在 6-20 位之间'
  }
  if (!PASSWORD_HAS_LETTER.test(password) || !PASSWORD_HAS_NUMBER.test(password)) {
    return '密码必须同时包含字母和数字'
  }
  return ''
}

export function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword) {
    return '请再次输入密码'
  }
  if (password !== confirmPassword) {
    return '两次输入的密码不一致'
  }
  return ''
}

export function validateNickname(nickname) {
  if (!nickname || !nickname.trim()) {
    return '请输入昵称'
  }
  const trimmed = nickname.trim()
  if (trimmed.length < 2 || trimmed.length > 20) {
    return '昵称长度需在 2-20 个字符之间'
  }
  return ''
}
