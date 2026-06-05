const express = require('express')
require('dotenv').config()

const db = require('./config/db')
const redisClient = require('./config/redis')


const app =express()
const PORT= process.env.PORT || 3000

app.use(express.json())

app.listen(PORT, () => {
    console.log(`server running on Port ${PORT}`)
})

