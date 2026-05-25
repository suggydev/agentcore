import { describe, it, expect } from 'vitest'

interface ValidationResult { valid: boolean; errors: string[] }

function validateEmail(email: string): ValidationResult {
  const errors: string[] = []
  if (!email || email.trim().length === 0) errors.push('Email is required')
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email format')
  return { valid: errors.length === 0, errors }
}

function validatePassword(password: string): ValidationResult {
  const errors: string[] = []
  if (!password || password.length < 8) errors.push('Password must be at least 8 characters')
  if (password && !/[A-Z]/.test(password)) errors.push('Password must contain an uppercase letter')
  if (password && !/[0-9]/.test(password)) errors.push('Password must contain a number')
  return { valid: errors.length === 0, errors }
}

describe('Validation', () => {
  describe('validateEmail', () => {
    it('should accept valid emails', () => {
      expect(validateEmail('test@example.com').valid).toBe(true)
    })
    it('should reject empty email', () => {
      expect(validateEmail('').valid).toBe(false)
    })
    it('should reject invalid format', () => {
      expect(validateEmail('not-email').valid).toBe(false)
    })
  })

  describe('validatePassword', () => {
    it('should accept valid passwords', () => {
      expect(validatePassword('Password1').valid).toBe(true)
    })
    it('should reject short passwords', () => {
      expect(validatePassword('Short1').valid).toBe(false)
    })
    it('should reject without uppercase', () => {
      expect(validatePassword('password1').valid).toBe(false)
    })
    it('should reject without number', () => {
      expect(validatePassword('Password').valid).toBe(false)
    })
  })
})