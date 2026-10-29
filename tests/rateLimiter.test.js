jest.mock('../src/config/db', () => ({ query: jest.fn() }))
jest.mock('../src/algorithms/fixedWindow', () => jest.fn())
jest.mock('../src/algorithms/slidingWindow', () => jest.fn())
jest.mock('../src/algorithms/tokenBucket', () => jest.fn())

const db = require('../src/config/db')
const fixedWindow = require('../src/algorithms/fixedWindow')
const slidingWindow = require('../src/algorithms/slidingWindow')
const tokenBucket = require('../src/algorithms/tokenBucket')
const rateLimiter = require('../src/middleware/rateLimiter')

const mockResponse = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    res.setHeader = jest.fn()
    return res
}

const keyRow = (algorithm) => ({
    rows: [{ algorithm, limit_count: 10, window_seconds: 60 }]
})

describe('rateLimiter middleware', () => {
    let res
    let next

    beforeEach(() => {
        jest.clearAllMocks()
        jest.spyOn(console, 'error').mockImplementation(() => {})
        res = mockResponse()
        next = jest.fn()
    })

    test('rejects a request with no API key', async () => {
        await rateLimiter({ headers: {} }, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({ error: 'API key required' })
        expect(next).not.toHaveBeenCalled()
    })

    test('rejects an API key that is not in the database', async () => {
        db.query.mockResolvedValue({ rows: [] })

        await rateLimiter({ headers: { 'x-api-key': 'unknown' } }, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid API key' })
        expect(next).not.toHaveBeenCalled()
    })

    test.each([
        ['fixed_window', fixedWindow],
        ['sliding_window', slidingWindow],
        ['token_bucket', tokenBucket]
    ])('routes %s keys to the matching algorithm', async (algorithm, algorithmFn) => {
        db.query.mockResolvedValue(keyRow(algorithm))
        algorithmFn.mockResolvedValue({ allowed: true, remaining: 9 })

        await rateLimiter({ headers: { 'x-api-key': 'abc' } }, res, next)

        expect(algorithmFn).toHaveBeenCalledWith('abc', 10, 60)
        expect(next).toHaveBeenCalled()
    })

    test('sets rate limit headers on an allowed request', async () => {
        db.query.mockResolvedValue(keyRow('fixed_window'))
        fixedWindow.mockResolvedValue({ allowed: true, remaining: 7 })

        await rateLimiter({ headers: { 'x-api-key': 'abc' } }, res, next)

        expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 10)
        expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 7)
        expect(next).toHaveBeenCalled()
    })

    test('returns 429 with retryAfter when the algorithm blocks the request', async () => {
        db.query.mockResolvedValue(keyRow('fixed_window'))
        fixedWindow.mockResolvedValue({ allowed: false, remaining: 0, retryAfter: 12 })

        await rateLimiter({ headers: { 'x-api-key': 'abc' } }, res, next)

        expect(res.status).toHaveBeenCalledWith(429)
        expect(res.json).toHaveBeenCalledWith({ error: 'Too many requests', retryAfter: 12 })
        expect(next).not.toHaveBeenCalled()
    })

    test('defaults retryAfter to 60 seconds when the algorithm gives none', async () => {
        db.query.mockResolvedValue(keyRow('token_bucket'))
        tokenBucket.mockResolvedValue({ allowed: false, remaining: 0, limit: 10 })

        await rateLimiter({ headers: { 'x-api-key': 'abc' } }, res, next)

        expect(res.json).toHaveBeenCalledWith({ error: 'Too many requests', retryAfter: 60 })
    })

    test('lets the request through when the database lookup fails', async () => {
        db.query.mockRejectedValue(new Error('db down'))

        await rateLimiter({ headers: { 'x-api-key': 'abc' } }, res, next)

        expect(next).toHaveBeenCalled()
    })
})
