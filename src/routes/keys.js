const express = require('express')
const router = express.Router()
const crypto = require('crypto')
const db = require('../config/db')
const verifyJWT = require('../middleware/auth')

const TIERS = {
    free:   { limit: 100, windowSeconds: 60 },
    silver: { limit: 200, windowSeconds: 60 },
    gold:   { limit: 500, windowSeconds: 60 }
}

router.post('/generate', verifyJWT, async (req, res) => {
    const userId = req.user.userId
    const { algorithm, tier } = req.body

    const selectedTier = TIERS[tier] || TIERS.free
    const { limit, windowSeconds } = selectedTier

    try {
        const apiKey = crypto.randomBytes(32).toString('hex')

        const result = await db.query(
            `INSERT INTO api_keys (user_id, api_key, algorithm, limit_count, window_seconds)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                userId,
                apiKey,
                algorithm || 'sliding_window',
                limit,
                windowSeconds
            ]
        )

        res.status(201).json({
            message: 'API key generated successfully',
            apiKey: result.rows[0]
        })

    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Server error' })
    }
})

router.get('/', verifyJWT, async (req, res) => {
    const userId = req.user.userId

    try {
        const result = await db.query(
            'SELECT * FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        )

        res.status(200).json({
            keys: result.rows
        })

    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Server error' })
    }
})

router.delete('/:id', verifyJWT, async (req, res) => {
    const userId = req.user.userId
    const keyId = req.params.id

    try {
        const result = await db.query(
            'DELETE FROM api_keys WHERE id = $1 AND user_id = $2 RETURNING *',
            [keyId, userId]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Key not found' })
        }

        res.status(200).json({ message: 'API key deleted successfully' })

    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Server error' })
    }
})

module.exports = router