import { describe, it, expect } from 'vitest'
import {
  validateName,
  validateEmail,
  validatePhone,
  validateProvince,
  validateCity,
  validateAddress,
  validateInterests,
  validateNotification,
  validateFrequency,
  validateStep1,
  validateStep2,
  validateStep3,
  validateStep,
} from '../../wizard/utils/validation'

describe('validateName', () => {
  it('should return valid for name with 2-20 chars', () => {
    expect(validateName('张三').valid).toBe(true)
    expect(validateName('a'.repeat(20)).valid).toBe(true)
  })

  it('should return invalid for empty name', () => {
    const result = validateName('')
    expect(result.valid).toBe(false)
    expect(result.message).toBeTruthy()
  })

  it('should return invalid for name shorter than 2 chars', () => {
    expect(validateName('A').valid).toBe(false)
  })

  it('should return invalid for name longer than 20 chars', () => {
    expect(validateName('a'.repeat(21)).valid).toBe(false)
  })

  it('should trim whitespace', () => {
    expect(validateName('  张三  ').valid).toBe(true)
    expect(validateName('  ').valid).toBe(false)
  })

  it('should handle non-string inputs', () => {
    expect(validateName(null).valid).toBe(false)
    expect(validateName(undefined).valid).toBe(false)
    expect(validateName(123).valid).toBe(false)
  })
})

describe('validateEmail', () => {
  it('should return valid for standard email formats', () => {
    expect(validateEmail('test@example.com').valid).toBe(true)
    expect(validateEmail('user.name+tag@domain.co.uk').valid).toBe(true)
  })

  it('should return invalid for empty email', () => {
    expect(validateEmail('').valid).toBe(false)
  })

  it('should return invalid for malformed emails', () => {
    expect(validateEmail('notanemail').valid).toBe(false)
    expect(validateEmail('missing@domain').valid).toBe(false)
    expect(validateEmail('@nodomain.com').valid).toBe(false)
    expect(validateEmail('has space@example.com').valid).toBe(false)
  })

  it('should handle non-string inputs', () => {
    expect(validateEmail(null).valid).toBe(false)
    expect(validateEmail(undefined).valid).toBe(false)
  })
})

describe('validatePhone', () => {
  it('should return valid for exactly 11 digits', () => {
    expect(validatePhone('13800138000').valid).toBe(true)
    expect(validatePhone('00000000000').valid).toBe(true)
  })

  it('should return invalid for wrong length', () => {
    expect(validatePhone('1234567890').valid).toBe(false)
    expect(validatePhone('123456789012').valid).toBe(false)
  })

  it('should return invalid for non-digit characters', () => {
    expect(validatePhone('138abc88000').valid).toBe(false)
    expect(validatePhone('138-8000-1234').valid).toBe(false)
  })

  it('should trim whitespace', () => {
    expect(validatePhone(' 13800138000 ').valid).toBe(true)
  })

  it('should handle empty and non-string', () => {
    expect(validatePhone('').valid).toBe(false)
    expect(validatePhone(null).valid).toBe(false)
  })
})

describe('validateProvince', () => {
  it('should return valid for non-empty province code', () => {
    expect(validateProvince('beijing').valid).toBe(true)
  })

  it('should return invalid for empty or whitespace', () => {
    expect(validateProvince('').valid).toBe(false)
    expect(validateProvince('   ').valid).toBe(false)
    expect(validateProvince(null).valid).toBe(false)
  })
})

describe('validateCity', () => {
  it('should return valid for non-empty city code', () => {
    expect(validateCity('dongcheng').valid).toBe(true)
  })

  it('should return invalid for empty or whitespace', () => {
    expect(validateCity('').valid).toBe(false)
    expect(validateCity('   ').valid).toBe(false)
  })
})

describe('validateAddress', () => {
  it('should return valid for address up to 200 chars', () => {
    expect(validateAddress('某某街道某某号').valid).toBe(true)
    expect(validateAddress('a'.repeat(200)).valid).toBe(true)
  })

  it('should return invalid for empty address', () => {
    expect(validateAddress('').valid).toBe(false)
    expect(validateAddress(null).valid).toBe(false)
  })

  it('should return invalid for whitespace-only address', () => {
    expect(validateAddress('   ').valid).toBe(false)
    expect(validateAddress('\t\n  \t').valid).toBe(false)
  })

  it('should return invalid for address over 200 chars', () => {
    expect(validateAddress('a'.repeat(201)).valid).toBe(false)
  })
})

describe('validateInterests', () => {
  it('should return valid for non-empty array', () => {
    expect(validateInterests(['tech']).valid).toBe(true)
    expect(validateInterests(['tech', 'finance']).valid).toBe(true)
  })

  it('should return invalid for empty array or non-array', () => {
    expect(validateInterests([]).valid).toBe(false)
    expect(validateInterests(null).valid).toBe(false)
    expect(validateInterests('tech').valid).toBe(false)
  })
})

describe('validateNotification', () => {
  it('should return valid for non-empty method', () => {
    expect(validateNotification('email').valid).toBe(true)
  })

  it('should return invalid for empty', () => {
    expect(validateNotification('').valid).toBe(false)
    expect(validateNotification('  ').valid).toBe(false)
  })
})

describe('validateFrequency', () => {
  it('should return valid for non-empty frequency', () => {
    expect(validateFrequency('daily').valid).toBe(true)
  })

  it('should return invalid for empty', () => {
    expect(validateFrequency('').valid).toBe(false)
  })
})

describe('validateStep1', () => {
  it('should pass with all valid fields', () => {
    const result = validateStep1({
      name: '张三',
      email: 'test@example.com',
      phone: '13800138000',
    })
    expect(result.valid).toBe(true)
    expect(Object.keys(result.errors).length).toBe(0)
  })

  it('should collect all errors for invalid fields', () => {
    const result = validateStep1({ name: '', email: 'bad', phone: '123' })
    expect(result.valid).toBe(false)
    expect(result.errors.name).toBeTruthy()
    expect(result.errors.email).toBeTruthy()
    expect(result.errors.phone).toBeTruthy()
  })
})

describe('validateStep2', () => {
  it('should pass with all valid fields', () => {
    const result = validateStep2({
      province: 'beijing',
      city: 'dongcheng',
      address: '某某路123号',
    })
    expect(result.valid).toBe(true)
  })

  it('should fail with missing province or city', () => {
    const result = validateStep2({ province: '', city: '', address: '' })
    expect(result.valid).toBe(false)
    expect(result.errors.province).toBeTruthy()
    expect(result.errors.city).toBeTruthy()
    expect(result.errors.address).toBeTruthy()
  })
})

describe('validateStep3', () => {
  it('should pass with all valid fields', () => {
    const result = validateStep3({
      interests: ['tech', 'finance'],
      notification: 'email',
      frequency: 'daily',
    })
    expect(result.valid).toBe(true)
  })

  it('should fail with missing selections', () => {
    const result = validateStep3({ interests: [], notification: '', frequency: '' })
    expect(result.valid).toBe(false)
    expect(result.errors.interests).toBeTruthy()
    expect(result.errors.notification).toBeTruthy()
    expect(result.errors.frequency).toBeTruthy()
  })
})

describe('validateStep', () => {
  it('should delegate step 0 to validateStep1 with valid data', () => {
    const step0 = validateStep(0, {
      name: '张三',
      email: 'test@example.com',
      phone: '13800138000',
    })
    expect(step0.valid).toBe(true)
  })

  it('should delegate step 0 to validateStep1 with invalid data', () => {
    const step0 = validateStep(0, { name: '', email: '', phone: '' })
    expect(step0.valid).toBe(false)
    expect(step0.errors.name).toBeTruthy()
  })

  it('should delegate step 1 to validateStep2 with valid data', () => {
    const step1 = validateStep(1, {
      province: 'beijing',
      city: 'dongcheng',
      address: '某某路123号',
    })
    expect(step1.valid).toBe(true)
  })

  it('should delegate step 1 to validateStep2 with invalid data', () => {
    const step1 = validateStep(1, { province: '', city: '', address: '' })
    expect(step1.valid).toBe(false)
    expect(step1.errors.province).toBeTruthy()
    expect(step1.errors.city).toBeTruthy()
    expect(step1.errors.address).toBeTruthy()
  })

  it('should delegate step 2 to validateStep3 with valid data', () => {
    const step2 = validateStep(2, {
      interests: ['tech'],
      notification: 'email',
      frequency: 'daily',
    })
    expect(step2.valid).toBe(true)
  })

  it('should delegate step 2 to validateStep3 with invalid data', () => {
    const step2 = validateStep(2, { interests: [], notification: '', frequency: '' })
    expect(step2.valid).toBe(false)
    expect(step2.errors.interests).toBeTruthy()
    expect(step2.errors.notification).toBeTruthy()
    expect(step2.errors.frequency).toBeTruthy()
  })

  it('should always pass step 3 (review step)', () => {
    const step3 = validateStep(3, {})
    expect(step3.valid).toBe(true)
    expect(Object.keys(step3.errors).length).toBe(0)
  })
})
