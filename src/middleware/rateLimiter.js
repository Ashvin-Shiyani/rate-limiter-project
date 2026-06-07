const fixedWindow = require('../algorithms/fixedWindow')
const slidingWindow = require('../algorithms/slidingWindow')
const tokenBucket = require('../algorithms/tokenBucket')
const db = require('../config/db')

const rateLimiter = async (req, res, next) => {
    const apiKey = req.headers['x-api-key']

    if (!apiKey) {
        return res.status(401).json({ error: 'API key required' })
    }

    try {
        const result = await db.query(
            'SELECT * FROM api_keys WHERE api_key = $1',
            [apiKey]
        )

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid API key' })
        }

        const keyData = result.rows[0]
        const { algorithm, limit_count, window_seconds } = keyData

        let response

        if (algorithm === 'fixed_window') {
            response = await fixedWindow(apiKey, limit_count, window_seconds)
        } else if (algorithm === 'sliding_window') {
            response = await slidingWindow(apiKey, limit_count, window_seconds)
        } else if (algorithm === 'token_bucket') {
            response = await tokenBucket(apiKey, limit_count, window_seconds)
        }

        res.setHeader('X-RateLimit-Limit', limit_count)
        res.setHeader('X-RateLimit-Remaining', response.remaining)

        if (!response.allowed) {
            return res.status(429).json({
                error: 'Too many requests',
                retryAfter: response.retryAfter || 60
            })
        }

        next()

    } catch (err) {
        console.error(err)
        next()
    }
}

module.exports = rateLimiter