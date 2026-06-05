const redisClient = require('../config/redis')


const slidingWindow = async (apiKey, limit, windowSeconds) => {
    const redisKey = `sliding:${apiKey}`
    const now = Date.now()
    const windowStart = now - (windowSeconds * 1000)

    try {
        // remove timestamps older than window
        await redisClient.zRemRangeByScore(redisKey, 0, windowStart)

        // count remaining timestamps in window
        const count = await redisClient.zCard(redisKey)

        if (count >= limit) {
            const ttl = await redisClient.ttl(redisKey)
            return { allowed: false, remaining: 0, retryAfter: ttl }
        }

        // add current timestamp
        await redisClient.zAdd(redisKey, { score: now, value: now.toString() })

        // set expiry on the key
        await redisClient.expire(redisKey, windowSeconds)

        return { allowed: true, remaining: limit - count - 1 }

    } catch (err) {
        console.error('Sliding window error:', err)
        return { allowed: true, remaining: limit }
    }
}

module.exports = slidingWindow