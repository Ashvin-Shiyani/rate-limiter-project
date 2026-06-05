const express = require('express')
require('dotenv').config()

const db = require('./config/db')
const redisClient = require('./config/redis')
const authRoutes= require('./routes/auth')

const app =express()
const PORT= process.env.PORT || 3000

app.use(express.json())
app.use('/auth', authRoutes)

app.listen(PORT, () => {
    console.log(`server running on Port ${PORT}`)
})

