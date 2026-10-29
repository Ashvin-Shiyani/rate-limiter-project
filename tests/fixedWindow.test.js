jest.mock('../src/config/redis', () => ({
    get: jest.fn(),
    set: jest.fn(),
    incr: jest.fn(),
    ttl: jest.fn()
}))

const redisClient = require('../src/config/redis')
const fixedWindow = require('../src/algorithms/fixedWindow')

describe('fixedWindow', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    test('first request in a window creates the counter with an expiry', async () => {
        redisClient.get.mockResolvedValue(null)

        const result = await fixedWindow('key1', 5, 60)

        expect(redisClient.set).toHaveBeenCalledWith('fixed:key1', 1, { EX: 60 })
        expect(result).toEqual({ allowed: true, remaining: 4 })
    })

    test('request under the limit increments the counter', async () => {
        redisClient.get.mockResolvedValue('2')

        const result = await fixedWindow('key1', 5, 60)

        expect(redisClient.incr).toHaveBeenCalledWith('fixed:key1')
        expect(result).toEqual({ allowed: true, remaining: 2 })
    })

    test('request at the limit is blocked with the time left in the window', async () => {
        redisClient.get.mockResolvedValue('5')
        redisClient.ttl.mockResolvedValue(42)

        const result = await fixedWindow('key1', 5, 60)

        expect(redisClient.incr).not.toHaveBeenCalled()
        expect(result).toEqual({ allowed: false, remaining: 0, retryAfter: 42 })
    })

    test('fails open when Redis throws', async () => {
        redisClient.get.mockRejectedValue(new Error('connection lost'))

        const result = await fixedWindow('key1', 5, 60)

        expect(result).toEqual({ allowed: true, remaining: 5 })
    })
})
