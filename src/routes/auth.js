const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const db = require('../config/db')

router.post('/register', async (req, res) => {
    const { name, email, password } = req.body
    
    try {
        // Step 1 - check if email already exists
        const existingUser = await db.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        )
        
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Email already exists' })
        }
        
        // Step 2 - hash the password
        const hashedPassword = await bcrypt.hash(password, 10)
        
        // Step 3 - save user to database
        const newUser = await db.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
            [name, email, hashedPassword]
        )
        
        // Step 4 - send back success
        res.status(201).json({
            message: 'Account created successfully',
            user: newUser.rows[0]
        })
        
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Server error' })
    }
})

router.post('/login', async (req, res) => {
    const { email, password } = req.body

    try {
        // Step 1 - find user by email
        const result = await db.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        )

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid Email or Password' })
        }

        const user = result.rows[0]

        // Step 2 - compare password
        const passwordMatch = await bcrypt.compare(password, user.password)

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid Email or Password' })
        }

        // Step 3 - create JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        )

        // Step 4 - send token back
        res.status(200).json({
            message: 'Login successful',
            token: token
        })

    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Server error' })
    }
})

module.exports=router