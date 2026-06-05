const db = require('./db')

const createTables = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id         SERIAL PRIMARY KEY,
                name       VARCHAR(100) NOT NULL,
                email      VARCHAR(100) UNIQUE NOT NULL,
                password   VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `)
        console.log('users table created successfully')

        await db.query(`
            CREATE TABLE IF NOT EXISTS api_keys (
                id         SERIAL PRIMARY KEY,
                user_id    INTEGER REFERENCES users(id),
                api_key    VARCHAR(255) UNIQUE NOT NULL,
                algorithm  VARCHAR(50) DEFAULT 'sliding_window',
                limit_count INTEGER DEFAULT 100,
                window_seconds INTEGER DEFAULT 60,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `)
        console.log('api_keys table created successfully')

        console.log('all tables created')
        process.exit(0)

    } catch (err) {
        console.error('error creating tables:', err)
        process.exit(1)
    }
}

createTables()