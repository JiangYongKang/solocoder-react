import { describe, it, expect } from 'vitest'
import {
  validateEmail,
  validateLoginPassword,
  validateRegisterPassword,
  validateConfirmPassword,
  validateNickname,
} from '@/pages/auth/validators'

describe('validateEmail', () => {
  it('空邮箱应返回错误', () => {
    expect(validateEmail('')).toBe('请输入邮箱')
    expect(validateEmail('   ')).toBe('请输入邮箱')
  })

  it('非法格式邮箱应返回错误', () => {
    expect(validateEmail('abc')).toBe('邮箱格式不正确')
    expect(validateEmail('abc@')).toBe('邮箱格式不正确')
    expect(validateEmail('@domain.com')).toBe('邮箱格式不正确')
    expect(validateEmail('abc@domain')).toBe('邮箱格式不正确')
    expect(validateEmail('abc@domain.')).toBe('邮箱格式不正确')
  })

  it('合法邮箱应返回空字符串', () => {
    expect(validateEmail('test@example.com')).toBe('')
    expect(validateEmail('user.name+tag@domain.co.uk')).toBe('')
    expect(validateEmail('  test@example.com  ')).toBe('')
  })
})

describe('validateLoginPassword', () => {
  it('空密码应返回错误', () => {
    expect(validateLoginPassword('')).toBe('请输入密码')
  })

  it('密码少于 6 位应返回错误', () => {
    expect(validateLoginPassword('12345')).toBe('密码长度不少于 6 位')
    expect(validateLoginPassword('abcde')).toBe('密码长度不少于 6 位')
  })

  it('密码不少于 6 位应返回空字符串', () => {
    expect(validateLoginPassword('123456')).toBe('')
    expect(validateLoginPassword('abcdef')).toBe('')
    expect(validateLoginPassword('12345678901234567890')).toBe('')
  })
})

describe('validateRegisterPassword', () => {
  it('空密码应返回错误', () => {
    expect(validateRegisterPassword('')).toBe('请输入密码')
  })

  it('密码长度不在 6-20 位应返回错误', () => {
    expect(validateRegisterPassword('abc1')).toBe('密码长度需在 6-20 位之间')
    expect(validateRegisterPassword('a1')).toBe('密码长度需在 6-20 位之间')
    expect(validateRegisterPassword('abcdefghij12345678901')).toBe('密码长度需在 6-20 位之间')
  })

  it('密码不同时含字母和数字应返回错误', () => {
    expect(validateRegisterPassword('abcdef')).toBe('密码必须同时包含字母和数字')
    expect(validateRegisterPassword('123456')).toBe('密码必须同时包含字母和数字')
  })

  it('合法密码应返回空字符串', () => {
    expect(validateRegisterPassword('abc123')).toBe('')
    expect(validateRegisterPassword('a1b2c3d4')).toBe('')
    expect(validateRegisterPassword('AbCd123456')).toBe('')
  })
})

describe('validateConfirmPassword', () => {
  it('空确认密码应返回错误', () => {
    expect(validateConfirmPassword('abc123', '')).toBe('请再次输入密码')
  })

  it('两次密码不一致应返回错误', () => {
    expect(validateConfirmPassword('abc123', 'abc124')).toBe('两次输入的密码不一致')
    expect(validateConfirmPassword('abc123', 'ABC123')).toBe('两次输入的密码不一致')
  })

  it('两次密码一致应返回空字符串', () => {
    expect(validateConfirmPassword('abc123', 'abc123')).toBe('')
    expect(validateConfirmPassword('a1b2c3', 'a1b2c3')).toBe('')
  })
})

describe('validateNickname', () => {
  it('空昵称应返回错误', () => {
    expect(validateNickname('')).toBe('请输入昵称')
    expect(validateNickname('   ')).toBe('请输入昵称')
  })

  it('昵称长度不在 2-20 字符应返回错误', () => {
    expect(validateNickname('a')).toBe('昵称长度需在 2-20 个字符之间')
    expect(validateNickname('  a  ')).toBe('昵称长度需在 2-20 个字符之间')
    expect(validateNickname('abcdefghijklmnopqrstu')).toBe('昵称长度需在 2-20 个字符之间')
  })

  it('合法昵称应返回空字符串', () => {
    expect(validateNickname('ab')).toBe('')
    expect(validateNickname('测试昵称')).toBe('')
    expect(validateNickname('  test user  ')).toBe('')
    expect(validateNickname('abcdefghij1234567890')).toBe('')
  })
})
