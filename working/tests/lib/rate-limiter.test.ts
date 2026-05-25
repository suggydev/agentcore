import { describe, it, expect, beforeEach } from 'vitest'

class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  
  constructor(private maxRequests: number = 100, private windowMs: number = 60000) {}

  isAllowed(key: string): boolean {
    const now = Date.now()
    const requests = this.requests.get(key) || []
    const validRequests = requests.filter(t => now - t < this.windowMs)
    this.requests.set(key, validRequests)
    if (validRequests.length >= this.maxRequests) return false
    validRequests.push(now)
    return true
  }

  reset(key?: string): void {
    if (key) this.requests.delete(key)
    else this.requests.clear()
  }
}

describe('RateLimiter', () => {
  let limiter: RateLimiter
  beforeEach(() => { limiter = new RateLimiter(3, 1000) })

  it('should allow requests within limit', () => {
    expect(limiter.isAllowed('user1')).toBe(true)
    expect(limiter.isAllowed('user1')).toBe(true)
    expect(limiter.isAllowed('user1')).toBe(true)
  })

  it('should block requests exceeding limit', () => {
    limiter.isAllowed('user1')
    limiter.isAllowed('user1')
    limiter.isAllowed('user1')
    expect(limiter.isAllowed('user1')).toBe(false)
  })

  it('should track different keys independently', () => {
    limiter.isAllowed('user1')
    limiter.isAllowed('user1')
    limiter.isAllowed('user1')
    expect(limiter.isAllowed('user2')).toBe(true)
  })

  it('should reset limits', () => {
    limiter.isAllowed('user1')
    limiter.isAllowed('user1')
    limiter.isAllowed('user1')
    limiter.reset('user1')
    expect(limiter.isAllowed('user1')).toBe(true)
  })
})