const express = require('express')
require('dotenv').config()

const db = require('./config/db')
const redisClient = require('./config/redis')
const authRoutes = require('./routes/auth')
const keysRoutes = require('./routes/keys')
const rateLimiter = require('./middleware/rateLimiter')
const initSchema = require('./config/schema')

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use('/auth', authRoutes)
app.use('/keys', keysRoutes)
app.get('/test', rateLimiter, (req, res) => {
    res.json({ message: 'Request allowed!' })
})

app.listen(PORT, async () => {
    console.log(`server running on Port ${PORT}`)
    await initSchema()
    console.log('Database schema initialized')
})
