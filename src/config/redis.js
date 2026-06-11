const redis = require('redis')
require('dotenv').config()

const client = redis.createClient({
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    },
    password: process.env.REDIS_PASSWORD
})

client.on('connect', () => {
    console.log('Redis connected successfully')
})

client.on('error', (err) => {
    console.error('Redis error:', err)
})

client.connect()

module.exports = client