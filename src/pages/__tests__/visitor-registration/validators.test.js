import { describe, it, expect } from 'vitest'
import {
  validateName,
  validatePhone,
  validateIdCard,
  validateReason,
  validateHost,
  validateImageFile,
} from '../../visitor-registration/validators'
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from '../../visitor-registration/constants'

describe('validateName', () => {
  it('空姓名应返回错误', () => {
    expect(validateName('')).toBe('请输入访客姓名')
    expect(validateName('   ')).toBe('请输入访客姓名')
    expect(validateName(null)).toBe('请输入访客姓名')
    expect(validateName(undefined)).toBe('请输入访客姓名')
  })

  it('姓名长度小于2应返回错误', () => {
    expect(validateName('a')).toBe('姓名至少 2 个字符')
    expect(validateName('  a  ')).toBe('姓名至少 2 个字符')
  })

  it('姓名长度大于20应返回错误', () => {
    expect(validateName('a'.repeat(21))).toBe('姓名最多 20 个字符')
  })

  it('合法姓名应返回空字符串', () => {
    expect(validateName('张三')).toBe('')
    expect(validateName('  张三  ')).toBe('')
    expect(validateName('abcdefghij1234567890')).toBe('')
    expect(validateName('欧阳小明')).toBe('')
  })
})

describe('validatePhone', () => {
  it('空手机号应返回错误', () => {
    expect(validatePhone('')).toBe('请输入手机号')
    expect(validatePhone('   ')).toBe('请输入手机号')
    expect(validatePhone(null)).toBe('请输入手机号')
    expect(validatePhone(undefined)).toBe('请输入手机号')
  })

  it('非11位数字应返回错误', () => {
    expect(validatePhone('123456')).toBe('请输入有效的11位手机号')
    expect(validatePhone('123456789012')).toBe('请输入有效的11位手机号')
  })

  it('非1开头应返回错误', () => {
    expect(validatePhone('02345678901')).toBe('请输入有效的11位手机号')
    expect(validatePhone('22345678901')).toBe('请输入有效的11位手机号')
  })

  it('第二位不是3-9应返回错误', () => {
    expect(validatePhone('10345678901')).toBe('请输入有效的11位手机号')
    expect(validatePhone('11345678901')).toBe('请输入有效的11位手机号')
    expect(validatePhone('12345678901')).toBe('请输入有效的11位手机号')
  })

  it('包含非数字字符应返回错误', () => {
    expect(validatePhone('138abcdefgh')).toBe('请输入有效的11位手机号')
    expect(validatePhone('138-4567-8901')).toBe('请输入有效的11位手机号')
  })

  it('合法手机号应返回空字符串', () => {
    expect(validatePhone('13812345678')).toBe('')
    expect(validatePhone('13900001111')).toBe('')
    expect(validatePhone('15012345678')).toBe('')
    expect(validatePhone('18612345678')).toBe('')
    expect(validatePhone('  13812345678  ')).toBe('')
  })
})

describe('validateIdCard', () => {
  it('空身份证号应返回错误', () => {
    expect(validateIdCard('')).toBe('请输入身份证号')
    expect(validateIdCard('   ')).toBe('请输入身份证号')
    expect(validateIdCard(null)).toBe('请输入身份证号')
    expect(validateIdCard(undefined)).toBe('请输入身份证号')
  })

  it('非18位应返回错误', () => {
    expect(validateIdCard('123456')).toBe('请输入有效的18位身份证号')
    expect(validateIdCard('11010119900101123')).toBe('请输入有效的18位身份证号')
    expect(validateIdCard('1101011990010112345')).toBe('请输入有效的18位身份证号')
  })

  it('首位不是1-9应返回错误', () => {
    expect(validateIdCard('010101199001011234')).toBe('请输入有效的18位身份证号')
  })

  it('非法年份应返回错误', () => {
    expect(validateIdCard('110101189001011234')).toBe('请输入有效的18位身份证号')
    expect(validateIdCard('110101219001011234')).toBe('请输入有效的18位身份证号')
  })

  it('非法月份应返回错误', () => {
    expect(validateIdCard('110101199000011234')).toBe('请输入有效的18位身份证号')
    expect(validateIdCard('110101199013011234')).toBe('请输入有效的18位身份证号')
  })

  it('非法日期应返回错误', () => {
    expect(validateIdCard('110101199001001234')).toBe('请输入有效的18位身份证号')
    expect(validateIdCard('110101199001321234')).toBe('请输入有效的18位身份证号')
  })

  it('末位包含非数字/X应返回错误', () => {
    expect(validateIdCard('11010119900101123A')).toBe('请输入有效的18位身份证号')
    expect(validateIdCard('11010119900101123Y')).toBe('请输入有效的18位身份证号')
  })

  it('合法身份证号应返回空字符串', () => {
    expect(validateIdCard('110101199001011234')).toBe('')
    expect(validateIdCard('310101198512154321')).toBe('')
    expect(validateIdCard('440301199912315678')).toBe('')
    expect(validateIdCard('11010119900101123X')).toBe('')
    expect(validateIdCard('11010119900101123x')).toBe('')
    expect(validateIdCard('  110101199001011234  ')).toBe('')
  })
})

describe('validateReason', () => {
  it('空访问事由应返回错误', () => {
    expect(validateReason('')).toBe('请输入访问事由')
    expect(validateReason('   ')).toBe('请输入访问事由')
    expect(validateReason(null)).toBe('请输入访问事由')
    expect(validateReason(undefined)).toBe('请输入访问事由')
  })

  it('超过200字应返回错误', () => {
    expect(validateReason('a'.repeat(201))).toBe('访问事由最多 200 字')
  })

  it('合法访问事由应返回空字符串', () => {
    expect(validateReason('商务洽谈')).toBe('')
    expect(validateReason('  商务洽谈  ')).toBe('')
    expect(validateReason('a'.repeat(200))).toBe('')
  })
})

describe('validateHost', () => {
  it('未选择被访人应返回错误', () => {
    expect(validateHost(null)).toBe('请选择被访人')
    expect(validateHost(undefined)).toBe('请选择被访人')
  })

  it('已选择被访人应返回空字符串', () => {
    expect(validateHost({ id: 'H001', name: '张三' })).toBe('')
    expect(validateHost({ id: 'H002' })).toBe('')
  })
})

describe('validateImageFile', () => {
  it('空文件应返回空字符串', () => {
    expect(validateImageFile(null)).toBe('')
    expect(validateImageFile(undefined)).toBe('')
  })

  it('不支持的文件类型应返回错误', () => {
    const file = { type: 'application/pdf', size: 1000 }
    expect(validateImageFile(file)).toBe('仅支持 JPG/PNG 格式')
  })

  it('文件过大应返回错误', () => {
    const file = { type: ALLOWED_IMAGE_TYPES[0], size: MAX_FILE_SIZE + 1 }
    expect(validateImageFile(file)).toBe('图片大小不能超过 5MB')
  })

  it('合法图片文件应返回空字符串', () => {
    expect(validateImageFile({ type: 'image/jpeg', size: 1000000 })).toBe('')
    expect(validateImageFile({ type: 'image/jpg', size: 2000000 })).toBe('')
    expect(validateImageFile({ type: 'image/png', size: MAX_FILE_SIZE })).toBe('')
  })
})
