jest.mock('../src/config/redis', () => ({
    zRemRangeByScore: jest.fn(),
    zCard: jest.fn(),
    zAdd: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn()
}))

const redisClient = require('../src/config/redis')
const slidingWindow = require('../src/algorithms/slidingWindow')

describe('slidingWindow', () => {
    const NOW = 1_700_000_000_000

    beforeEach(() => {
        jest.clearAllMocks()
        jest.spyOn(Date, 'now').mockReturnValue(NOW)
        jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    test('drops timestamps older than the window before counting', async () => {
        redisClient.zCard.mockResolvedValue(0)

        await slidingWindow('key1', 3, 60)

        expect(redisClient.zRemRangeByScore).toHaveBeenCalledWith('sliding:key1', 0, NOW - 60_000)
    })

    test('request under the limit records its timestamp and refreshes the expiry', async () => {
        redisClient.zCard.mockResolvedValue(1)

        const result = await slidingWindow('key1', 3, 60)

        expect(redisClient.zAdd).toHaveBeenCalledWith('sliding:key1', { score: NOW, value: NOW.toString() })
        expect(redisClient.expire).toHaveBeenCalledWith('sliding:key1', 60)
        expect(result).toEqual({ allowed: true, remaining: 1 })
    })

    test('request at the limit is blocked and not recorded', async () => {
        redisClient.zCard.mockResolvedValue(3)
        redisClient.ttl.mockResolvedValue(30)

        const result = await slidingWindow('key1', 3, 60)

        expect(redisClient.zAdd).not.toHaveBeenCalled()
        expect(result).toEqual({ allowed: false, remaining: 0, retryAfter: 30 })
    })

    test('fails open when Redis throws', async () => {
        redisClient.zRemRangeByScore.mockRejectedValue(new Error('connection lost'))

        const result = await slidingWindow('key1', 3, 60)

        expect(result).toEqual({ allowed: true, remaining: 3 })
    })
})
