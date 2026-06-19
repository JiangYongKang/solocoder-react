const PHONE_REGEX = /^1\d{10}$/
const SMS_CODE_REGEX = /^\d{6}$/
const LOGIN_KEY = 'phone_login_info'
const LOGIN_EXPIRE_HOURS = 24
const COUNTDOWN_SECONDS = 60
const LOCK_SECONDS = 30

export function validatePhone(phone) {
  if (!phone) {
    return '请输入手机号码'
  }
  if (!PHONE_REGEX.test(phone)) {
    return '请输入正确的手机号码'
  }
  return ''
}

export function formatPhone(phone) {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length <= 3) {
    return digits
  } else if (digits.length <= 7) {
    return digits.slice(0, 3) + ' ' + digits.slice(3)
  } else {
    return digits.slice(0, 3) + ' ' + digits.slice(3, 7) + ' ' + digits.slice(7, 11)
  }
}

export function parsePhone(formatted) {
  if (!formatted) return ''
  return formatted.replace(/\D/g, '')
}

export function maskPhone(phone) {
  if (!phone || phone.length < 7) return phone
  return phone.slice(0, 3) + '****' + phone.slice(7)
}

export function generateSmsCode() {
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += Math.floor(Math.random() * 10)
  }
  return code
}

export function validateSmsCode(code) {
  if (!code) {
    return '请输入验证码'
  }
  if (!SMS_CODE_REGEX.test(code)) {
    return '请输入 6 位数字验证码'
  }
  return ''
}

export function verifySmsCode(inputCode, correctCode) {
  return inputCode === correctCode
}

export function validateSliderPosition(sliderX, targetX, tolerance = 5) {
  return Math.abs(sliderX - targetX) <= tolerance
}

export function generateSliderTarget(trackWidth, sliderWidth) {
  const minX = 10
  const maxX = trackWidth - sliderWidth - 10
  return Math.floor(Math.random() * (maxX - minX + 1)) + minX
}

export function saveLoginInfo(phone) {
  try {
    const info = {
      phone,
      loginTime: Date.now(),
    }
    localStorage.setItem(LOGIN_KEY, JSON.stringify(info))
    return true
  } catch {
    return false
  }
}

export function getLoginInfo() {
  try {
    const raw = localStorage.getItem(LOGIN_KEY)
    if (!raw) return null
    const info = JSON.parse(raw)
    if (!info || !info.phone || !info.loginTime) return null
    return info
  } catch {
    return null
  }
}

export function isLoginExpired(loginTime, now = Date.now()) {
  const diffMs = now - loginTime
  const diffHours = diffMs / (1000 * 60 * 60)
  return diffHours >= LOGIN_EXPIRE_HOURS
}

export function hasValidLogin() {
  const info = getLoginInfo()
  if (!info) return false
  return !isLoginExpired(info.loginTime)
}

export function clearLoginInfo() {
  try {
    localStorage.removeItem(LOGIN_KEY)
    return true
  } catch {
    return false
  }
}

export function formatLoginTime(timestamp) {
  const date = new Date(timestamp)
  const pad = (n) => (n < 10 ? '0' + n : n)
  return (
    date.getFullYear() +
    '-' +
    pad(date.getMonth() + 1) +
    '-' +
    pad(date.getDate()) +
    ' ' +
    pad(date.getHours()) +
    ':' +
    pad(date.getMinutes()) +
    ':' +
    pad(date.getSeconds())
  )
}

export function getProtocolText(type) {
  if (type === 'service') {
    return `用户服务协议

欢迎使用本服务。请您在使用前仔细阅读以下协议条款。

第一条 服务内容
本服务为用户提供便捷的登录及相关功能体验，包括但不限于手机号登录、账号管理等服务。

第二条 用户注册
1. 用户需提供真实、准确的个人信息进行注册。
2. 用户应妥善保管账号信息，因用户保管不当造成的损失由用户自行承担。
3. 用户不得将账号转让、出借给他人使用。

第三条 用户行为规范
1. 用户应遵守相关法律法规，不得利用本服务从事任何违法违规活动。
2. 用户不得发布、传播违法违规内容。
3. 用户不得干扰、破坏本服务的正常运行。

第四条 服务变更与终止
1. 我们有权根据业务需要对服务内容进行变更、暂停或终止。
2. 用户违反本协议的，我们有权终止为其提供服务。

第五条 免责声明
1. 因不可抗力导致的服务中断或数据丢失，我们不承担责任。
2. 用户因使用本服务产生的任何直接或间接损失，我们在法律允许的范围内不承担责任。

第六条 协议修改
我们有权根据需要修改本协议条款，修改后的协议将在本平台公布。

第七条 法律适用
本协议的订立、执行和解释均适用中华人民共和国法律。

感谢您的使用！`
  }
  if (type === 'privacy') {
    return `隐私政策

我们非常重视您的个人信息和隐私保护。本隐私政策将帮助您了解我们如何收集、使用和保护您的信息。

第一条 信息收集
1. 注册信息：当您使用手机号登录时，我们会收集您的手机号码用于身份验证。
2. 设备信息：我们可能会收集设备型号、操作系统版本等信息以优化服务体验。
3. 日志信息：当您使用服务时，我们会收集相关操作日志用于安全分析和服务改进。

第二条 信息使用
1. 身份验证：使用您的手机号进行登录验证。
2. 安全保障：利用收集的信息进行风险防控和安全审计。
3. 服务优化：基于使用数据分析和优化产品功能。

第三条 信息存储与保护
1. 我们采用行业标准的安全措施保护您的个人信息。
2. 信息存储于中华人民共和国境内的服务器上。
3. 我们仅在必要期限内保留您的个人信息。

第四条 信息共享
除以下情形外，我们不会向第三方共享您的个人信息：
1. 事先获得您的明确同意。
2. 法律法规要求或司法机关依法要求。
3. 为保护我们或用户的合法权益所必需。

第五条 您的权利
1. 您有权查询、更正、删除您的个人信息。
2. 您有权撤回对个人信息使用的同意。
3. 您有权注销账号。

第六条 未成年人保护
我们非常重视未成年人的隐私保护。若您是未成年人，请在监护人陪同下阅读本政策并使用本服务。

第七条 政策更新
我们可能会适时更新本隐私政策，更新后的政策将在本平台公布。

如有疑问，请通过平台联系方式与我们取得联系。`
  }
  return ''
}

export const SMS_COUNTDOWN_SECONDS = COUNTDOWN_SECONDS
export const ERROR_LOCK_SECONDS = LOCK_SECONDS

export function getCountdownButtonText(countdown, hasRequestedBefore) {
  if (countdown > 0) {
    return `${countdown} 秒后重新发送`
  }
  if (hasRequestedBefore) {
    return '重新获取验证码'
  }
  return '获取验证码'
}

export function getNextCountdownValue(current) {
  if (current <= 1) {
    return 0
  }
  return current - 1
}

export function isCountdownActive(countdown) {
  return countdown > 0
}

export function shouldResetOnPhoneChange(oldPhone, newPhone, countdown) {
  return isCountdownActive(countdown) && oldPhone !== newPhone
}

export function canRequestCode(phoneValid, countdown) {
  return phoneValid && !isCountdownActive(countdown)
}

export function getLockButtonText(lockCountdown) {
  if (lockCountdown > 0) {
    return `${lockCountdown} 秒后重试`
  }
  return '登录'
}

export function getNextLockValue(current) {
  if (current <= 1) {
    return 0
  }
  return current - 1
}

export function isLocked(lockCountdown) {
  return lockCountdown > 0
}

export function shouldTriggerLock(errorCount) {
  return errorCount >= 3
}

