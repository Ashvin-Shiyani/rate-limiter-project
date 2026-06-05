const redisClient = require('../config/redis')
const fs = require('fs')
const path = require('path')

const luaScript = fs.readFileSync(
    path.join(__dirname, '../../scripts/tokenBucket.lua'),
    'utf8'
)

const tokenBucket = async (apiKey, maxTokens, refillRate) => {
    const redisKey = `token:${apiKey}`
    const now = Date.now()

    try {
        const result = await redisClient.eval(luaScript, {
            keys: [redisKey],
            arguments: [
                maxTokens.toString(),
                refillRate.toString(),
                now.toString(),
                '1'
            ]
        })

        const allowed = result[0] === 1
        const remaining = result[1]

        return {
            allowed,
            remaining,
            limit: maxTokens
        }

    } catch (err) {
        console.error('Token bucket error:', err)
        return { allowed: true, remaining: maxTokens }
    }
}

module.exports = tokenBucket