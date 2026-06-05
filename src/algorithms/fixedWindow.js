const redisClient = require('../config/redis')

const fixedWindow = async (apiKey, limit, windowSeconds) => {
    const redisKey = `fixed:${apiKey}`
    
    try {
        const count = await redisClient.get(redisKey)
        
        if (count === null) {
            await redisClient.set(redisKey, 1, { EX: windowSeconds })
            return { allowed: true, remaining: limit - 1 }
        }
        
        if (parseInt(count) >= limit) {
            const ttl = await redisClient.ttl(redisKey)
            return { allowed: false, remaining: 0, retryAfter: ttl }
        }
        
        await redisClient.incr(redisKey)
        return { allowed: true, remaining: limit - parseInt(count) - 1 }
        
    } catch (err) {
        console.error('Fixed window error:', err)
        return { allowed: true, remaining: limit }
    }
}

module.exports = fixedWindow