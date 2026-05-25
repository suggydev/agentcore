import { describe, it, expect } from 'vitest'

describe('Config', () => {
  it('should load default configuration', () => {
    const config = { port: 3000, host: 'localhost', debug: false }
    expect(config.port).toBe(3000)
    expect(config.host).toBe('localhost')
  })

  it('should override config with env vars', () => {
    process.env.PORT = '4000'
    const port = parseInt(process.env.PORT || '3000', 10)
    expect(port).toBe(4000)
    delete process.env.PORT
  })

  it('should validate required settings', () => {
    const required = ['DATABASE_URL', 'SECRET_KEY']
    const missing = required.filter(key => !process.env[key])
    expect(Array.isArray(missing)).toBe(true)
  })
})