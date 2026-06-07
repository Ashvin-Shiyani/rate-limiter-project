const express = require('express')
require('dotenv').config()

const db = require('./config/db')
const redisClient = require('./config/redis')
const authRoutes= require('./routes/auth')
const keysRoutes = require('./routes/keys')

const app =express()
const PORT= process.env.PORT || 3000

app.use(express.json())
app.use('/auth', authRoutes)
app.use('/keys', keysRoutes)

app.listen(PORT, () => {
    console.log(`server running on Port ${PORT}`)
})

