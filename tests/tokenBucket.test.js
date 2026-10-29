jest.mock('../src/config/redis', () => ({
    eval: jest.fn()
}))

const redisClient = require('../src/config/redis')
const tokenBucket = require('../src/algorithms/tokenBucket')

describe('tokenBucket', () => {
    const NOW = 1_700_000_000_000

    beforeEach(() => {
        jest.clearAllMocks()
        jest.spyOn(Date, 'now').mockReturnValue(NOW)
        jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    test('runs the Lua script atomically with the bucket key and arguments', async () => {
        redisClient.eval.mockResolvedValue([1, 9])

        await tokenBucket('key1', 10, 2)

        const [script, options] = redisClient.eval.mock.calls[0]
        expect(script).toContain("redis.call('HMGET'")
        expect(options).toEqual({
            keys: ['token:key1'],
            arguments: ['10', '2', NOW.toString(), '1']
        })
    })

    test('allows the request when the script returns a token', async () => {
        redisClient.eval.mockResolvedValue([1, 9])

        const result = await tokenBucket('key1', 10, 2)

        expect(result).toEqual({ allowed: true, remaining: 9, limit: 10 })
    })

    test('blocks the request when the bucket is empty', async () => {
        redisClient.eval.mockResolvedValue([0, 0])

        const result = await tokenBucket('key1', 10, 2)

        expect(result).toEqual({ allowed: false, remaining: 0, limit: 10 })
    })

    test('fails open when Redis throws', async () => {
        redisClient.eval.mockRejectedValue(new Error('connection lost'))

        const result = await tokenBucket('key1', 10, 2)

        expect(result).toEqual({ allowed: true, remaining: 10 })
    })
})
