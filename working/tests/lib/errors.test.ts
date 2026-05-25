import { describe, it, expect } from 'vitest'

// Mock error classes for testing
class AppError extends Error {
  statusCode: number
  constructor(message: string, statusCode: number = 500) {
    super(message)
    this.statusCode = statusCode
    this.name = 'AppError'
  }
}

class ValidationError extends AppError {
  constructor(message: string) { super(message, 400) }
}

class AuthError extends AppError {
  constructor(message: string) { super(message, 401) }
}

class NotFoundError extends AppError {
  constructor(message: string) { super(message, 404) }
}

class BillingError extends AppError {
  constructor(message: string) { super(message, 402) }
}

describe('Error Classes', () => {
  it('AppError should have correct properties', () => {
    const err = new AppError('test error', 500)
    expect(err.message).toBe('test error')
    expect(err.statusCode).toBe(500)
    expect(err).toBeInstanceOf(Error)
  })

  it('ValidationError should have 400 status', () => {
    const err = new ValidationError('invalid input')
    expect(err.statusCode).toBe(400)
    expect(err).toBeInstanceOf(AppError)
  })

  it('AuthError should have 401 status', () => {
    const err = new AuthError('unauthorized')
    expect(err.statusCode).toBe(401)
  })

  it('NotFoundError should have 404 status', () => {
    const err = new NotFoundError('not found')
    expect(err.statusCode).toBe(404)
  })

  it('BillingError should have 402 status', () => {
    const err = new BillingError('payment required')
    expect(err.statusCode).toBe(402)
  })
})